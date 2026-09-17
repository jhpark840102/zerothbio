/**
 * ZerothBIO website contact form backend (Google Apps Script)
 * - Receives POST from index.html / ko/index.html
 * - Logs each inquiry to a Google Sheet (tab "Inquiries")
 * - Emails the admin immediately (Reply-To = visitor)
 *
 * Setup: see form-backend/README.md
 */
const ADMIN_EMAIL   = 'jh.park8401@gmail.com';   // 알림 받을 관리자 메일
const SHEET_NAME    = 'Inquiries';
const ALLOWED_ORIGIN_HINT = 'jh.park8401@gmail.com';    // page 필드에 포함돼야 정상 요청으로 처리
const MAX_PER_EMAIL_PER_HOUR = 5;               // 같은 이메일 반복 제출 제한

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // 1) Spam: honeypot + too-fast submit + origin hint
    if (p.website) return json_({ ok: true });                       // bot filled hidden field
    if (Number(p.elapsed_ms || 0) < 3000) return json_({ ok: false, error: 'too_fast' });
    if (p.page && ALLOWED_ORIGIN_HINT && String(p.page).indexOf(ALLOWED_ORIGIN_HINT) === -1
        && String(p.page).indexOf('github.io') === -1) return json_({ ok: false, error: 'origin' });

    // 2) Validate
    const name = clip_(p.name, 100), email = clip_(p.email, 200), org = clip_(p.org, 150);
    const topic = clip_(p.topic, 100), message = clip_(p.message, 5000), lang = clip_(p.lang, 5);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'invalid' });
    if (p.consent !== 'yes') return json_({ ok: false, error: 'consent' });

    // 3) Rate limit per email
    const cache = CacheService.getScriptCache(), key = 'rl_' + email.toLowerCase();
    const n = Number(cache.get(key) || 0);
    if (n >= MAX_PER_EMAIL_PER_HOUR) return json_({ ok: false, error: 'rate_limited' });
    cache.put(key, String(n + 1), 3600);

    // 4) Log to sheet
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(['Received (KST)', 'Lang', 'Topic', 'Name', 'Organization', 'Email', 'Message', 'Page', 'Consent']);
    const ts = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([ts, lang, topic, name, org, email, message, clip_(p.page, 300), 'yes']);
    lock.releaseLock();

    // 5) Notify admin
    const subject = '[ZerothBIO 홈페이지 문의] ' + (topic || '일반') + ' — ' + name + (org ? ' (' + org + ')' : '');
    const body = [
      '홈페이지 문의가 접수되었습니다.', '',
      '접수: ' + ts + ' (KST)', '언어: ' + lang, '유형: ' + topic,
      '이름: ' + name, '소속: ' + org, '이메일: ' + email, '',
      '— 문의 내용 —', message, '',
      '페이지: ' + clip_(p.page, 300),
      '※ 이 메일에 회신하면 문의자에게 바로 답장됩니다.'
    ].join('\n');
    MailApp.sendEmail({ to: ADMIN_EMAIL, replyTo: email, name: 'ZerothBIO Website', subject: subject, body: body });

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() { return json_({ ok: true, service: 'zerothbio-contact' }); }

function clip_(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

/** 설정 확인용: Apps Script 편집기에서 한 번 실행해 권한 승인 + 테스트 메일 발송 */
function testSetup() {
  doPost({ parameter: { name: 'Setup Test', email: ADMIN_EMAIL, org: 'ZerothBIO', topic: 'Test',
    message: '설정 테스트 메일입니다.', consent: 'yes', elapsed_ms: '5000', lang: 'ko', page: 'https://www.zerothbio.com/' } });
}
