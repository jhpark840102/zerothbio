/* Zeroth Bio – CFPS DNA design core logic (no dependencies, browser + Node) */
(function (root) {
  'use strict';

  // ---- Default genetic parts (editable in UI; VERIFY against your validated CFPS template) ----
  const DEFAULTS = {
    // 5' flank + T7 promoter + 5'UTR (T7 gene10 leader / RBS), ends right before ORF ATG
    utr5: 'TCGATCCCGCGAAATTAATACGACTCACTATAGGGAGACCACAACGGTTTCCCTCTAGAAATAATTTTGTTTAACTTTAAGAAGGAGATATACAT',
    // 3'UTR: Zeroth Bio default, begins right after stop codon
    utr3: 'GTCGACCGGCTGCTAACAAAGCCCGAAAGGAAGCTGAGTTGGCTGCTGCCACCGCTGAGCAATAACTAGCATAACCCCTTGGGGCCTCTAAACGGGTCTTGAGGGGTTTTTTG',
    overlap: 15,        // minimum overlap length between step-1 overhang and universal primer
    overlapTm: 55,      // overlap Tm target (°C); overlap is extended until reached (max 40 nt)
    pcrTm: 55,          // option 3 (2-step PCR): gene-specific part Tm target (°C)
    tmTarget: 60,       // gene-specific primer Tm target (°C, Primer3-default Tm)
  };

  const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const revcomp = s => s.split('').reverse().map(c => COMP[c]).join('');
  const gc = s => (s.match(/[GC]/g) || []).length / s.length;

  // ---- Input cleaning / validation ----
  function parseInput(raw) {
    const warnings = [], errors = [];
    if ((String(raw || '').match(/^\s*>/gm) || []).length > 1) return {seq:'',warnings,errors:['FASTA 레코드는 한 번에 하나만 입력해 주세요.']};
    if (String(raw || '').length > 300000) return {seq:'',warnings,errors:['입력은 300,000자 이하로 제한됩니다.']};
    let s = (raw || '').replace(/^>.*$/gm, '').replace(/[\s\d]/g, '').toUpperCase().replace(/U/g, 'T');
    if (!s) { errors.push('서열을 입력해 주세요.'); return { seq: '', warnings, errors }; }
    const bad = s.match(/[^ACGT]/g);
    if (bad) { errors.push('A/C/G/T 이외의 문자가 있습니다: ' + [...new Set(bad)].join(', ')); return { seq: s, warnings, errors }; }
    if (!s.startsWith('ATG')) errors.push('이 도구는 ATG로 시작하는 완전한 ORF를 지원합니다. 시작 위치를 확인해 주세요.');
    if (s.length % 3 !== 0) errors.push('ORF 길이(' + s.length + ' nt)가 3의 배수가 아닙니다.');
    const stops = ['TAA', 'TAG', 'TGA'];
    let internal = [];
    for (let i = 0; i + 3 <= s.length - 3; i += 3) if (stops.includes(s.substr(i, 3))) internal.push(i / 3 + 1);
    if (internal.length) errors.push('ORF 내부 정지코돈 위치(codon): ' + internal.slice(0, 5).join(', '));
    if (stops.includes(s.slice(-3))) {
      /* has stop */
    } else {
      s += 'TAA';
      warnings.push('정지코돈이 없어 TAA를 3\' 말단에 추가했습니다.');
    }
    return { seq: s, warnings, errors, addedStop: warnings.some(w => w.includes('TAA')) };
  }

  // ---- Tm: SantaLucia 1998 NN + SantaLucia salt correction, Primer3 defaults ----
  // (mono 50 mM, Mg2+ 1.5 mM, dNTP 0.6 mM, DNA 50 nM). Reproduces VectorBuilder: 55.1 / 55.9 °C for the two reference oligos.
  const NA_EQ = (50 + 120 * Math.sqrt(1.5 - 0.6)) / 1000;
  const TM_NOTE = 'Tm 계산: SantaLucia 1998 nearest-neighbor, Na⁺ 50 mM · Mg²⁺ 1.5 mM · dNTP 0.6 mM · DNA 50 nM; 단순 NN 추정, 실제 PCR 조건과 다를 수 있음.';
  const NN = {
    AA: [-7.9, -22.2], TT: [-7.9, -22.2], AT: [-7.2, -20.4], TA: [-7.2, -21.3],
    CA: [-8.5, -22.7], TG: [-8.5, -22.7], GT: [-8.4, -22.4], AC: [-8.4, -22.4],
    CT: [-7.8, -21.0], AG: [-7.8, -21.0], GA: [-8.2, -22.2], TC: [-8.2, -22.2],
    CG: [-10.6, -27.2], GC: [-9.8, -24.4], GG: [-8.0, -19.9], CC: [-8.0, -19.9]
  };
  function tm(seq, na = NA_EQ, conc = 50e-9) {
    if (typeof seq !== 'string' || seq.length < 2 || /[^ACGT]/.test(seq)) throw new Error('Tm 계산에는 2 nt 이상의 A/C/G/T 서열이 필요합니다.');
    let dH = 0, dS = 0;
    for (let i = 0; i < seq.length - 1; i++) { const p = NN[seq.substr(i, 2)]; dH += p[0]; dS += p[1]; }
    for (const end of [seq[0], seq[seq.length - 1]]) {
      if (end === 'G' || end === 'C') { dH += 0.1; dS += -2.8; } else { dH += 2.3; dS += 4.1; }
    }
    dS += 0.368 * (seq.length - 1) * Math.log(na);
    const symmetric = seq === revcomp(seq);
    if (symmetric) dS -= 1.4;
    return dH * 1000 / (dS + 1.987 * Math.log(symmetric ? conc : conc / 4)) - 273.15;
  }

  // gene-specific primer: shortest 18–40 nt from 5' end of `template` reaching tmTarget, 3' end G/C preferred
  function annealPart(template, target) {
    // closest Tm to target among 15-40 nt, 3' G/C clamp preferred (ties -> shorter)
    let best = null, bestD = Infinity;
    for (let n = 15; n <= Math.min(40, template.length); n++) {
      const p = template.slice(0, n);
      const d = Math.abs(tm(p) - target) + (/[GC]$/.test(p) ? 0 : 1.5);
      if (d < bestD) { best = p; bestD = d; }
    }
    return best;
  }

  const f1 = x => Math.round(x * 10) / 10;
  const pct = x => Math.round(x * 1000) / 10;

  // ---- sequence-level QC flags ----
  function qc(orf, opts) {
    const flags = [];
    const g = gc(orf);
    if (g < 0.30 || g > 0.65) flags.push('GC 함량 ' + pct(g) + '% (권장 30–65%) – 합성/PCR 난이도 상승 가능');
    const homo = orf.match(/A{8,}|T{8,}|G{6,}|C{8,}/);
    if (homo) flags.push('긴 homopolymer 존재: ' + homo[0]);
    if (orf.includes('TAATACGACTCACTATAG')) flags.push('ORF 내부에 T7 promoter 유사 서열 존재');
    if (/GGGGTTTTTT|CCCCTTTT/.test(orf)) flags.push('T7 terminator 유사 서열 존재 – 조기 종결 가능');
    if (opts && opts.sites) for (const s of opts.sites) {
      let c = 0, i = -1; while ((i = orf.indexOf(s.seq, i + 1)) !== -1) c++;
      if (c) flags.push('ORF 내부 ' + s.name + ' (' + s.seq + ') 부위 ' + c + '개 – 제한효소 클로닝 불가, 옵션 1 또는 다른 효소 사용');
    }
    return flags;
  }

  const ngToNM = (ngUl, bp) => ngUl * 1e6 / (bp * 650); // ng/µl -> nM

  // ---- Option 1: gene synthesis (linear fragment with UTRs) ----
  function optionSynthesis(orf, cfg) {
    const full = cfg.utr5 + orf + cfg.utr3;
    return {
      title: '1. Gene synthesis (5′·3′ UTR 포함 linear fragment)',
      fragment: full,
      length: full.length,
      parts: [
        { name: "5′ flank + T7 promoter + 5′UTR", seq: cfg.utr5 },
        { name: 'ORF (+stop)', seq: orf },
        { name: "3′UTR / T7 terminator", seq: cfg.utr3 }
      ],
      usage: {
        finalConc: '적용 Kit 매뉴얼의 검증 조건 확인',
        nMrange: [f1(ngToNM(10, full.length)), f1(ngToNM(50, full.length))],
        notes: [
          '최종 DNA 서열과 적용 Kit 조건을 확인한 뒤 사용하세요.',
          'DNA 용매·투입량·최종 농도는 적용 Kit 매뉴얼을 따르세요.',
          'linear template은 E. coli 추출물의 RecBCD/exonuclease에 분해될 수 있음 – 필요 시 GamS 첨가.',
          'IPTG 필요 여부는 operator 구성과 반응계의 LacI 조건에 따라 확인하세요. 기본 linear cassette와 사용자 변경 서열을 구분해 검토하세요.'
        ]
      },
      flags: qc(orf).concat(full.length < 200 ? ['합성 fragment 길이 < 200 bp – 업체 최소 길이 확인'] : [])
    };
  }

  // ---- Option 2: pET-28a(+) restriction cloning with automatic enzyme selection ----
  // MCS order (5'->3', all unique in pET-28a(+)); `spacer` = nt inserted after a 5' site to keep the ORF
  // in frame with the vector's N-terminal His/T7-tag frame (frame counted from the NdeI ATG).
  const MCS = [
    { name: 'NdeI',    seq: 'CATATG', fw: true, rv: false },
    { name: 'NheI',    seq: 'GCTAGC', fw: true, rv: false, spacer: 0 },
    { name: 'BamHI',   seq: 'GGATCC', fw: true, rv: true,  spacer: 0 },
    { name: 'EcoRI',   seq: 'GAATTC', fw: true, rv: true,  spacer: 0 },
    { name: 'SacI',    seq: 'GAGCTC', fw: true, rv: true,  spacer: 0 },
    { name: 'SalI',    seq: 'GTCGAC', fw: true, rv: true,  spacer: 2 },
    { name: 'HindIII', seq: 'AAGCTT', fw: true, rv: true,  spacer: 2 },
    { name: 'NotI',    seq: 'GCGGCCGC', fw: true, rv: true, spacer: 0, pad: 'ATAAGAAT' },
    { name: 'XhoI',    seq: 'CTCGAG', fw: false, rv: true }
  ];
  const PAD = 'TATAT';
  const countSite = (s, site) => { let c = 0, i = -1; while ((i = s.indexOf(site, i + 1)) !== -1) c++; return c; };

  function optionPET(orf, cfg, withStop, pick) {
    const table = MCS.map(e => ({ name: e.name, seq: e.seq, cuts: countSite(orf, e.seq) }));
    const free = n => table.find(t => t.name === n).cuts === 0;
    const idx = n => MCS.findIndex(e => e.name === n);
    const fwList = MCS.filter(e => e.fw && free(e.name));
    const rvList = MCS.filter(e => e.rv && free(e.name)).sort((x, y) => (x.name === 'XhoI' ? -1 : y.name === 'XhoI' ? 1 : 0));
    const fwE = pick && pick.fw ? MCS.find(e => e.name === pick.fw) : fwList[0];
    const rvE = pick && pick.rv ? MCS.find(e => e.name === pick.rv) : rvList.find(e => !fwE || idx(e.name) > idx(fwE.name));
    const base = { title: '2. pET 벡터 클로닝 (pET-28a(+))', enzymeTable: table, fwOptions: fwList.map(e => e.name), rvOptions: rvList.map(e => e.name), flags: qc(orf) };
    if (!fwE || !rvE || !fwE.fw || !rvE.rv || idx(fwE.name) >= idx(rvE.name) || !free(fwE.name) || !free(rvE.name)) {
      base.noPair = true;
      base.flags.push('사용 가능한 제한효소 쌍이 없습니다 (ORF 내부 절단 부위가 있거나 선택한 쌍의 MCS 순서가 맞지 않음). 옵션 1(gene synthesis) 또는 옵션 3(PCR)을 권장합니다.');
      return base;
    }
    const stop = rvE.name === 'XhoI' ? withStop : true; // only XhoI keeps the vector C-terminal His-tag
    const body = stop ? orf : orf.slice(0, -3);
    const fwAnneal = annealPart(body, cfg.tmTarget);
    const addedStopTail = stop && cfg.addedStop ? revcomp(orf.slice(-3)) : '';
    const rvAnneal = annealPart(revcomp(addedStopTail ? body.slice(0,-3) : body), cfg.tmTarget);
    const padF = fwE.pad || PAD, padR = rvE.pad || PAD;
    // NdeI CATATG supplies the ORF ATG (primer = CAT + ORF); other 5' sites sit upstream of the ORF's own ATG
    const fw = fwE.name === 'NdeI' ? padF + 'CAT' + fwAnneal : padF + fwE.seq + 'GG'.slice(0, fwE.spacer) + fwAnneal;
    const rv = padR + rvE.seq + addedStopTail + rvAnneal;
    const fwTail = fwE.name === 'NdeI' ? 3 : fwE.seq.length + fwE.spacer;
    const amplicon = padF.length + fwTail + body.length + rvE.seq.length + padR.length;
    const std = fwE.name === 'NdeI' && rvE.name === 'XhoI';
    const nTag = ['NdeI','NheI'].includes(fwE.name) ? 'N-terminal His-tag (thrombin/linker 포함; 완전한 T7-tag 없음)' : 'N-terminal His-tag + T7-tag 융합 (링커 포함)';
    return Object.assign(base, {
      title: '2. pET 벡터 클로닝 (pET-28a(+), ' + fwE.name + '/' + rvE.name + ')',
      pair: { fw: fwE.name, rv: rvE.name, standard: std },
      parts: { fwIns: fwE.name === 'NdeI' ? 'CAT' : fwE.seq + 'GG'.slice(0, fwE.spacer), fwSite: fwE.seq, rvSite: rvE.seq, fwName: fwE.name, rvName: rvE.name, body },
      forward: fw, reverse: rv,
      fwTm: f1(tm(fwAnneal)), rvTm: f1(tm(rvAnneal)), amplicon,
      steps: [
        'PCR: ORF 템플릿 + 위 primer, high-fidelity polymerase.',
        fwE.name + ' + ' + rvE.name + ' 이중 절단 → 겔 정제 → pET-28a(+) (동일 효소 절단)와 ligation.',
        'DH5α 등에 형질전환 → colony PCR/Sanger 시퀀싱(T7 promoter / T7 terminator primer).',
        '플라스미드 mini-prep (endotoxin·RNase 잔존 최소화) 후 농도 확인하여 CFPS 템플릿으로 사용.'
      ],
      cfpsNotes: [
        'IPTG 적용 여부와 농도는 사용 중인 CFPS Kit 매뉴얼 및 검증 조건을 따르세요.',
        fwE.name === 'NdeI' ? 'NdeI 사용 시 ORF의 ATG가 CATATG 내 시작코돈으로 사용됨.' : fwE.name + ' 사용 시 벡터 상류 ATG부터 읽어 ORF가 in-frame 융합됨' + (fwE.spacer ? ' (프레임 맞춤용 ' + fwE.spacer + ' nt spacer 포함).' : '.'),
        stop ? '정지코돈 포함: ' + nTag + '와 표적 단백질의 융합 형태로 발현.' : '정지코돈 제외: ' + nTag + ' + C-terminal His-tag read-through.',
        rvE.name !== 'XhoI' ? rvE.name + '은 C-terminal His-tag 프레임이 아니므로 정지코돈을 반드시 포함합니다.' : ''
      ].filter(Boolean)
    });
  }

  // ---- Option 3: 2-step overlap PCR ----
  function optionPCR(orf, cfg) {
    // overlap grows from cfg.overlap until Tm >= cfg.overlapTm
    const grow = (get, len) => { let k = cfg.overlap; while (k < Math.min(40,len) && tm(get(k)) < cfg.overlapTm) k++; return k; };
    const k5 = grow(n => cfg.utr5.slice(-n),cfg.utr5.length), k3 = grow(n => cfg.utr3.slice(0, n),cfg.utr3.length);
    const tail5 = cfg.utr5.slice(-k5);
    const tail3 = revcomp(cfg.utr3.slice(0, k3));
    const fwAnneal = annealPart(orf, cfg.pcrTm);
    const addedStopTail = cfg.addedStop ? revcomp(orf.slice(-3)) : '';
    const rvAnneal = annealPart(revcomp(cfg.addedStop ? orf.slice(0,-3) : orf), cfg.pcrTm);
    const step1Fw = tail5 + fwAnneal;
    const step1Rv = tail3 + addedStopTail + rvAnneal;
    const uF = cfg.utr5;                 // universal forward: whole 5' flank+T7p+5'UTR
    const uR = revcomp(cfg.utr3);        // universal reverse: T7 terminator
    const step1Len = k5 + orf.length + k3;
    const finalLen = cfg.utr5.length + orf.length + cfg.utr3.length;
    return {
      title: '3. 2-step overlap PCR (linear template)',
      step1: { tail3Length: tail3.length, forward: step1Fw, reverse: step1Rv, fwAnneal, rvAnneal, fwTm: f1(tm(fwAnneal)), rvTm: f1(tm(rvAnneal)), product: step1Len,
        note: 'ORF 특이 서열 + 5′/3′ overhang. 중간 산물이므로 gel prep 권장 (primer dimer·비특이 밴드 제거).' },
      step2: { forward: uF, reverse: uR, product: finalLen, overlapTm: [f1(tm(tail5)), f1(tm(revcomp(tail3)))],
        note: 'Universal primer (T7 promoter + 5′UTR / 3′UTR). 모든 유전자에 공통 사용 → 1회 합성 후 재사용.' + (Math.max(uF.length, uR.length) > 60 ? ' 길이 ' + uF.length + ' / ' + uR.length + ' nt – PAGE(또는 HPLC) 정제 주문 권장.' : '') },
      steps: [
        'Step 1: ORF 템플릿 + step-1 primer로 PCR (' + step1Len + ' bp 예상) → 아가로스 겔 정제(권장).',
        'Step 2: 정제된 step-1 산물(약 1–10 ng) + universal primer F/R로 2차 PCR (' + finalLen + ' bp 예상).',
        'Step 2 산물의 정제 여부와 투입량은 사용 중인 Kit의 검증 조건에 따릅니다.',
        '템플릿이 플라스미드인 경우 DpnI 처리로 잔존 원본 플라스미드 제거 권장 (CFPS 중 원본 발현 방지).',
        'PCR polymerase는 high-fidelity 사용; 반응 완충액이 CFPS를 저해하지 않는지 사전 확인.'
      ],
      cfpsNotes: [
        'PCR 반응액의 carryover와 DNA 농도를 확인하고 매뉴얼의 조건을 적용하세요.',
        '산물 크기·순도를 확인하세요. DNA 밴드 확인만으로 단백질 발현을 검증할 수는 없습니다.',
        'IPTG 필요 여부는 operator 구성과 반응계의 LacI 조건에 따라 확인하세요. 기본 linear cassette와 사용자 변경 서열을 구분해 검토하세요.'
      ],
      flags: qc(orf)
    };
  }

  function design(rawSeq, option, userCfg) {
    const cfg = Object.assign({}, DEFAULTS, userCfg || {});
    const parsed = parseInput(rawSeq);
    cfg.addedStop = !!parsed.addedStop;
    if (![1,2,3].includes(option)) parsed.errors.push('제작 방식을 선택해 주세요.');
    for (const key of ['utr5','utr3']) {
      cfg[key] = String(cfg[key] ?? '').replace(/\s/g,'').toUpperCase();
      if (!/^[ACGT]+$/.test(cfg[key])) parsed.errors.push(key + ': A/C/G/T 서열을 입력해 주세요.');
      if (cfg[key].length < 15 || cfg[key].length > 500) parsed.errors.push(key + ': 길이는 15–500 nt 범위여야 합니다.');
    }
    for (const key of ['overlapTm','pcrTm','tmTarget']) if (!Number.isFinite(cfg[key]) || cfg[key]<20 || cfg[key]>85) parsed.errors.push(key + ': 20–85°C 범위의 수치가 필요합니다.');
    if (!Number.isInteger(cfg.overlap) || cfg.overlap<15 || cfg.overlap>40) parsed.errors.push('overlap은 15–40 nt 정수여야 합니다.');
    if (option===3 && Math.min(cfg.utr5.length,cfg.utr3.length)<cfg.overlap) parsed.errors.push('UTR 길이가 최소 overlap보다 짧습니다.');
    if ([2,3].includes(option) && parsed.seq.length-3<15) parsed.errors.push('PCR 설계에는 정지코돈을 제외한 ORF가 최소 15 nt 필요합니다.');
    const out = { cfg, orf: parsed.seq, warnings: parsed.warnings, errors: parsed.errors };
    if (parsed.errors.length) return out;
    out.orfLength = parsed.seq.length;
    out.orfGC = pct(gc(parsed.seq));
    out.aaLength = parsed.seq.length / 3 - 1;
    if (option === 1) out.result = optionSynthesis(parsed.seq, cfg);
    else if (option === 2) out.result = optionPET(parsed.seq, cfg, userCfg && userCfg.petStop === false ? false : true, userCfg && userCfg.petPick);
    else if (option === 3) out.result = optionPCR(parsed.seq, cfg);
    if (out.result) {
      const r=out.result;
      if (option===3 && r.step2.overlapTm.some(t=>t<cfg.overlapTm)) out.errors.push('UTR overlap이 목표 Tm에 도달하지 못했습니다. UTR 또는 설정을 확인하세요.');
      const pair=option===2&&!r.noPair?[r.fwTm,r.rvTm]:option===3?[r.step1.fwTm,r.step1.rvTm]:null;
      const target=option===2?cfg.tmTarget:cfg.pcrTm;
      if(pair && (Math.abs(pair[0]-pair[1])>5 || pair.some(t=>Math.abs(t-target)>5))) out.warnings.push('Primer Tm 편차가 큽니다. 주문 전 별도 primer 검증이 필요합니다.');
      if(option!==2 && !cfg.utr5.includes(T7P)) out.warnings.push('5′ 설정에서 기본 T7 promoter motif를 찾지 못했습니다.');
      out.warnings.push('설계 초안입니다. Primer 이차구조·dimer·특이성과 실제 발현은 검증하지 않습니다.');
    }
    return out;
  }

  // ---- GenBank export ----
  const CODON = (function () {
    const b = 'TCAG', aa = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG', t = {};
    let i = 0; for (const x of b) for (const y of b) for (const z of b) t[x + y + z] = aa[i++];
    return t;
  })();
  const translate = d => { let p = ''; for (let i = 0; i + 3 <= d.length; i += 3) p += CODON[d.substr(i, 3)] || 'X'; return p.replace(/\*$/, ''); };

  function motif(feats, seq, m, type, label, once) {
    for (const [mm, strand] of [[m, 1], [revcomp(m), -1]]) {
      let i = -1;
      while ((i = seq.indexOf(mm, i + 1)) !== -1) {
        feats.push({ type, start: i + 1, end: i + mm.length, strand, label });
        if (once) return;
      }
    }
  }
  const T7P = 'TAATACGACTCACTATAG', T7T = 'CTAGCATAACCCCTTGGGGCC', HIS6 = 'CACCACCACCACCACCAC', LACO = 'TTGTGAGCGGATAACAA';

  // ORF feature found from a start motif on either strand, extended codon-by-codon to the first stop
  function orfFeature(feats, seq, startMotif, label) {
    const L = seq.length, rcs = revcomp(seq);
    for (const [s, strand] of [[seq, 1], [rcs, -1]]) {
      const j = s.indexOf(startMotif);
      if (j === -1) continue;
      let e = j;
      while (e + 3 <= s.length && !['TAA', 'TAG', 'TGA'].includes(s.substr(e, 3))) e += 3;
      e += 3;
      if (strand === 1) feats.push({ type: 'CDS', start: j + 1, end: e, strand: 1, label, plain: true });
      else feats.push({ type: 'CDS', start: L - e + 1, end: L - j, strand: -1, label, plain: true });
      return;
    }
  }

  function formatGB(name, seq, circular, feats, definition, comment) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const d = new Date(), date = ('0' + d.getDate()).slice(-2) + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    let o = 'LOCUS       ' + name.padEnd(20) + String(seq.length).padStart(7) + ' bp    DNA     ' + (circular ? 'circular' : 'linear  ') + ' SYN ' + date + '\n';
    o += 'DEFINITION  ' + definition + '\nACCESSION   .\nVERSION     .\nKEYWORDS    CFPS; cell-free protein synthesis.\nSOURCE      synthetic DNA construct\n  ORGANISM  synthetic DNA construct\n';
    o += 'COMMENT     ' + comment.join('\n            ') + '\nFEATURES             Location/Qualifiers\n';
    feats.sort((a, b) => a.start - b.start);
    for (const f of feats) {
      const loc = f.start + '..' + f.end;
      o += '     ' + f.type.padEnd(16) + (f.strand === -1 ? 'complement(' + loc + ')' : loc) + '\n';
      o += '                     /label="' + f.label + '"\n';
      if (f.note) o += '                     /note="' + f.note + '"\n';
      if (f.type === 'CDS' && !f.plain) o += '                     /codon_start=1\n                     /translation="' + translate(seq.substr(f.start - 1, f.end - f.start + 1)) + '"\n';
    }
    o += 'ORIGIN\n';
    const l = seq.toLowerCase();
    for (let i = 0; i < l.length; i += 60) {
      let line = String(i + 1).padStart(9);
      for (let j = i; j < Math.min(i + 60, l.length); j += 10) line += ' ' + l.slice(j, Math.min(j + 10, i + 60, l.length));
      o += line + '\n';
    }
    return o + '//\n';
  }

  // extract bare sequence from FASTA or GenBank text
  function parseVector(text) {
    const m = text.match(/ORIGIN([\s\S]*?)\/\//);
    const raw = m ? m[1] : text.replace(/^>.*$/gm, '');
    return raw.replace(/[^A-Za-z]/g, '').toUpperCase();
  }

  // build in-silico cloned plasmid; returns {seq} or {error}
  function cloneIntoVector(parts, vec) {
    for (const v of [vec, revcomp(vec)]) {
      const f = [], r = [];
      let i = -1; while ((i = v.indexOf(parts.fwSite, i + 1)) !== -1) f.push(i);
      i = -1; while ((i = v.indexOf(parts.rvSite, i + 1)) !== -1) r.push(i);
      if (f.length === 1 && r.length === 1 && f[0] < r[0]) {
        return { seq: v.slice(0, f[0]) + parts.fwIns + parts.body + parts.rvSite + v.slice(r[0] + parts.rvSite.length) };
      }
    }
    return { error: '벡터 서열에서 ' + parts.fwName + ' / ' + parts.rvName + ' 부위를 각각 1곳씩, 올바른 순서로 찾지 못했습니다 (pET-28a(+) 서열을 확인하세요).' };
  }

  // option: 1|2|3, d: result of design(), vectorSeq: optional (option 2)
  function genbank(d, option, vectorSeq) {
    if (!d || d.errors.length || !d.result || d.result.noPair) return {error:'유효한 설계 결과가 필요합니다.'};
    if (option === 2 && !vectorSeq) vectorSeq = root.PET28A_SEQ;
    const r = d.result, orf = d.orf, cfg = d.cfg, feats = [];
    const gene = 'target';
    const comment = ['Generated by ZerothBIO CFPS DNA Design v1.5.0 (design draft).' , 'Features are annotated automatically from sequence motifs; verify before use.'];
    if (option === 1 || option === 3) {
      const seq = cfg.utr5 + orf + cfg.utr3;
      const a = cfg.utr5.length;
      motif(feats, seq, T7P, 'promoter', 'T7 promoter', true);
      const pr = feats.find(f => f.label === 'T7 promoter');
      if (pr) feats.push({ type: "5'UTR", start: pr.end, end: a, strand: 1, label: "5' UTR" });
      const sd = cfg.utr5.indexOf('AGGAG'); if (sd !== -1) feats.push({ type: 'RBS', start: sd + 1, end: sd + 5, strand: 1, label: 'RBS (SD motif; predicted)' });
      feats.push({ type: 'CDS', start: a + 1, end: a + orf.length, strand: 1, label: gene + ' ORF' });
      feats.push({ type: "3'UTR", start: a + orf.length + 1, end: seq.length, strand: 1, label: "3' UTR" });
      const t = seq.indexOf(T7T, a + orf.length); if (t !== -1) feats.push({ type: 'terminator', start: t + 1, end: seq.length, strand: 1, label: 'T7 terminator' });
      if (option === 3) {
        feats.push({ type: 'primer_bind', start: 1, end: a, strand: 1, label: 'Universal F' });
        feats.push({ type: 'primer_bind', start: seq.length - cfg.utr3.length + 1, end: seq.length, strand: -1, label: 'Universal R' });
        const s1 = r.step1, fa = s1.fwAnneal.length, ra = s1.rvAnneal.length, oe = a + orf.length;
        feats.push({ type: 'primer_bind', start: a - (s1.forward.length - fa) + 1, end: a + fa, strand: 1, label: 'Step1 Forward (' + s1.forward.length + ' nt)', note: 'Step-1 forward primer 5-3: ' + s1.forward + '; gene-specific Tm ' + s1.fwTm + ' C; 5 overlap Tm ' + r.step2.overlapTm[0] + ' C' });
        feats.push({ type: 'primer_bind', start: oe + s1.tail3Length - s1.reverse.length + 1, end: oe + s1.tail3Length, strand: -1, label: 'Step1 Reverse (' + s1.reverse.length + ' nt)', note: 'Step-1 reverse primer 5-3: ' + s1.reverse + '; gene-specific Tm ' + s1.rvTm + ' C; 3 overlap Tm ' + r.step2.overlapTm[1] + ' C' });
      }
      const name = option === 1 ? 'CFPS_synth_fragment' : 'CFPS_2step_PCR_product';
      return { filename: name + '.gb', text: formatGB(name, seq, false, feats, (option === 1 ? 'Gene synthesis linear fragment' : 'Final PCR product (step 2)') + " with T7 promoter, 5'/3' UTR for CFPS.", comment), length: seq.length };
    }
    // option 2
    const p = r.parts;
    let seq, circular = false, note;
    if (vectorSeq) {
      const c = cloneIntoVector(p, vectorSeq);
      if (c.error) return { error: c.error };
      seq = c.seq; circular = true;
    } else {
      seq = p.fwIns + p.body + p.rvSite;
      note = 'pET-28a(+) 벡터 서열을 불러오지 못해 insert 부분만 포함됩니다.';
    }
    const anchor=seq.indexOf(p.fwIns + p.body + p.rvSite);
    if(anchor<0) return {error:'Insert 경계를 확인하지 못했습니다.'};
    const bs = anchor + p.fwIns.length + 1;
    feats.push({ type: 'misc_feature', start: bs, end: bs + p.body.length - 1, strand: 1, label: gene + ' coding region' });
    if (vectorSeq) {
      const start=seq.indexOf('ATGGGCAGCAGCCATCAT');
      if(start<0 || (bs-1-start)%3!==0) return {error:'융합 단백질의 시작점 또는 프레임을 확인하지 못했습니다.'};
      let end=start; while(end+3<=seq.length && !['TAA','TAG','TGA'].includes(seq.slice(end,end+3))) end+=3;
      if(end+3>seq.length || end<bs-1+p.body.length-3) return {error:'융합 CDS의 종료코돈을 확인하지 못했습니다.'};
      feats.push({type:'CDS',start:start+1,end:end+3,strand:1,label:'Expression fusion CDS'});
    }
    const fs = p.fwName === 'NdeI' ? bs - 3 : bs - p.fwIns.length;
    feats.push({ type: 'misc_feature', start: fs, end: fs + p.fwSite.length - 1, strand: 1, label: p.fwName + ' site' });
    feats.push({ type: 'misc_feature', start: bs + p.body.length, end: bs + p.body.length + p.rvSite.length - 1, strand: 1, label: p.rvName + ' site' });
    if (vectorSeq) {
      motif(feats, seq, T7P, 'promoter', 'T7 promoter', true);
      motif(feats, seq, LACO, 'protein_bind', 'lacO');
      motif(feats, seq, T7T, 'terminator', 'T7 terminator', true);
      motif(feats, seq, HIS6, 'misc_feature', 'C-term His6 (stop 포함 시 미발현)');
      motif(feats, seq, 'CATCATCATCATCATCAC', 'misc_feature', 'N-term His6 tag', true);
      motif(feats, seq, 'CTGGTGCCGCGCGGCAGC', 'misc_feature', 'Thrombin site', true);
      motif(feats, seq, 'ATGGCTAGCATGACTGGTGGACAGCAAATGGGTCGC', 'misc_feature', 'T7 tag', true);
      orfFeature(feats, seq, 'ATGAGCCATATTCAACGGGAAACG', 'KanR (aph(3\')-Ia)');
      orfFeature(feats, seq, 'GTGAAACCAGTAACGTTATACGATG', 'lacI');
    }
    const name = 'CFPS_pET28a_' + p.fwName + '_' + p.rvName;
    return { filename: name + '.gb', text: formatGB(name, seq, circular, feats, vectorSeq ? 'pET-28a(+) with target cloned via ' + p.fwName + '/' + p.rvName + ' (in silico).' : 'Cloning insert (' + p.fwName + '/' + p.rvName + ' digested region).', note ? comment.concat([note]) : comment), length: seq.length, note };
  }

  const api = { TM_NOTE, design, parseInput, tm, revcomp, DEFAULTS, genbank, parseVector };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CFPSDesign = api;
})(typeof window !== 'undefined' ? window : globalThis);
