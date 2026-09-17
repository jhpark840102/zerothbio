(function(){
  var ko=(document.documentElement.lang||'').indexOf('ko')===0;
  var b=document.getElementById('menu-btn'),m=document.getElementById('mnav');
  b.addEventListener('click',function(){var o=m.hidden;m.hidden=!o;b.setAttribute('aria-expanded',String(o));});
  m.addEventListener('click',function(e){if(e.target.tagName==='A'){m.hidden=true;b.setAttribute('aria-expanded','false');}});
  // active nav
  var links=[].slice.call(document.querySelectorAll('nav.primary a'));
  var ids=links.map(function(a){return a.getAttribute('href').slice(1)});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.removeAttribute('aria-current')});var a=links[ids.indexOf(e.target.id)];if(a)a.setAttribute('aria-current','true');}})},{rootMargin:'-40% 0px -55% 0px'});
    ids.forEach(function(id){var s=document.getElementById(id);if(s)io.observe(s)});
  }
  // contact form: EmailJS (default) → custom endpoint → visitor's email app
  var f=document.getElementById('cform'),msg=document.getElementById('form-msg');
  if(!f)return;
  var C=window.ZBIO_FORM||{};
  var ADMIN=C.adminEmail||'zerothbio@gmail.com';
  var MIN_FILL=typeof C.minFillMs==='number'?C.minFillMs:3000, THROTTLE=typeof C.throttleMs==='number'?C.throttleMs:10000;
  var M=ko?{
    missing:'다음 필수 항목을 입력해 주세요: ', consent:'개인정보 수집·이용 동의',
    sending:'전송 중…', ok:'문의가 접수되었습니다. 입력하신 이메일로 답변드리겠습니다.',
    err:'전송에 실패했습니다. 잠시 후 다시 시도하시거나 ', errLink:'메일 앱으로 보내기', errTail:'를 이용해 주세요.',
    rate:'짧은 시간에 여러 번 제출되었습니다. 잠시 후 다시 시도해 주세요.',
    opened:'메일 앱에서 문의 내용이 작성된 메일이 열립니다. 열리지 않으면 '+ADMIN+'으로 직접 보내 주세요.',
    subject:'[제로스바이오 홈페이지] ', name:'이름', org:'소속', email:'이메일', topic:'문의 유형'
  }:{
    missing:'Please complete the required fields: ', consent:'consent to data use',
    sending:'Sending…', ok:'Thank you — your inquiry has been received. We will reply to the email you provided.',
    err:'Sending failed. Please try again later or ', errLink:'send it from your email app', errTail:'.',
    rate:'Too many submissions in a short time. Please try again later.',
    opened:'Your email app should open with this message. If it does not, email '+ADMIN+' directly.',
    subject:'[ZerothBIO website] ', name:'Name', org:'Organization', email:'Email', topic:'Topic'
  };
  var started=Date.now(), lastSent=0;
  var btn=document.getElementById('f-submit');
  var g=function(id){var el=document.getElementById(id);return el?(el.value||'').trim():''};
  function mailtoHref(){
    var subject=M.subject+g('f-topic')+' - '+g('f-name');
    var body=M.name+': '+g('f-name')+'\n'+M.org+': '+g('f-org')+'\n'+M.email+': '+g('f-email')+'\n'+M.topic+': '+g('f-topic')+'\n\n'+g('f-msg');
    return 'mailto:'+ADMIN+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  }
  function show(text,cls){msg.hidden=false;msg.className='form-msg'+(cls?' '+cls:'');msg.textContent=text;}
  function fail(){
    msg.hidden=false;msg.className='form-msg err';msg.textContent=M.err;
    var a=document.createElement('a');a.href=mailtoHref();a.textContent=M.errLink;msg.appendChild(a);
    msg.appendChild(document.createTextNode(M.errTail));
  }
  function kst(){
    try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'medium'}).format(new Date())+' KST'}catch(_){return new Date().toISOString()}
  }
  var ej=C.emailjs||{};
  var useEmailJS=C.provider==='emailjs'&&ej.publicKey&&ej.serviceId&&ej.templateId;
  var ejReady=false;
  function initEJ(){
    if(ejReady||!useEmailJS||!window.emailjs)return ejReady;
    window.emailjs.init({publicKey:ej.publicKey,blockHeadless:true,limitRate:{id:'zbio-contact',throttle:THROTTLE}});
    return ejReady=true;
  }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var req=[].slice.call(f.querySelectorAll('[required]'));
    var missing=req.filter(function(el){return el.type==='checkbox'?!el.checked:!el.value.trim()});
    var emailEl=document.getElementById('f-email');
    if(emailEl&&emailEl.value.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())&&missing.indexOf(emailEl)<0)missing.push(emailEl);
    req.forEach(function(el){el.setAttribute('aria-invalid',missing.indexOf(el)>-1?'true':'false')});
    if(missing.length){
      show(M.missing+missing.map(function(el){
        if(el.type==='checkbox')return M.consent;
        var l=f.querySelector('label[for="'+el.id+'"]');
        return (l?l.textContent:el.name).replace(/\((required|필수)\)/g,'').trim();
      }).join(', ')+'.','err');
      missing[0].focus();return;
    }
    // bot checks: honeypot filled or too fast → pretend success, send nothing
    if(g('f-website')||Date.now()-started<MIN_FILL){show(M.ok,'ok');f.reset();return;}
    if(Date.now()-lastSent<THROTTLE){show(M.rate,'err');return;}

    var params={
      name:g('f-name'), org:g('f-org')||'-', email:g('f-email'), reply_to:g('f-email'),
      topic:g('f-topic'), message:g('f-msg'), lang:ko?'KR':'EN', page:location.href,
      submitted_at:kst(), consent:'yes'
    };
    var endpoint=(C.endpoint||'').trim();
    var job=null;
    if(useEmailJS&&initEJ()){
      job=window.emailjs.send(ej.serviceId,ej.templateId,params).then(function(r){
        if(!r||r.status!==200)throw {status:r&&r.status};
      });
    }else if(C.provider==='endpoint'&&endpoint){
      var data=new URLSearchParams();Object.keys(params).forEach(function(k){data.append(k,params[k])});
      data.append('elapsed_ms',String(Date.now()-started));data.append('website','');
      job=fetch(endpoint,{method:'POST',body:data,headers:{'Accept':'application/json'}})
        .then(function(r){return r.text().then(function(t){var j={};try{j=JSON.parse(t)}catch(_){}
          if(j.error==='rate_limited')throw {status:429};
          if(!r.ok||j.ok===false||j.success===false)throw {status:r.status};});});
    }else{
      window.location.href=mailtoHref();show(M.opened);return;
    }
    if(btn){btn.disabled=true;btn.setAttribute('data-label',btn.innerHTML);btn.textContent=M.sending;}
    show(M.sending);
    job.then(function(){lastSent=Date.now();show(M.ok,'ok');f.reset();started=Date.now();})
      .catch(function(err){if(err&&err.status===429)show(M.rate,'err');else fail();})
      .then(function(){if(btn){btn.disabled=false;btn.innerHTML=btn.getAttribute('data-label');}});
  });
})();
