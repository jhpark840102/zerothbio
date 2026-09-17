(function(){
  var ko=(document.documentElement.lang||'').indexOf('ko')===0;
  var T=ko?{
    missing:'다음 필수 항목을 입력해 주세요: ', end:'.',
    subject:'[제로스바이오 홈페이지] ', name:'이름', org:'소속', email:'이메일', topic:'문의 유형',
    opened:'메일 앱에서 문의 내용이 작성된 메일이 열립니다. 열리지 않으면 zerothbio@gmail.com으로 직접 보내 주세요.'
  }:{
    missing:'Please complete the required fields: ', end:'.',
    subject:'[ZerothBIO website] ', name:'Name', org:'Organization', email:'Email', topic:'Topic',
    opened:'Your email app should open with this message. If it does not, email zerothbio@gmail.com directly.'
  };
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
  // contact form: validate, then open the visitor's email app
  var f=document.getElementById('cform'),msg=document.getElementById('form-msg');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var req=[].slice.call(f.querySelectorAll('[required]'));
    var missing=req.filter(function(el){return el.type==='checkbox'?!el.checked:!el.value.trim()});
    req.forEach(function(el){el.setAttribute('aria-invalid',missing.indexOf(el)>-1?'true':'false')});
    msg.hidden=false;
    if(missing.length){
      msg.textContent=T.missing+missing.map(function(el){
        if(el.type==='checkbox')return ko?'개인정보 수집·이용 동의':'consent to data use';
        var l=f.querySelector('label[for="'+el.id+'"]');
        return (l?l.textContent:el.name).replace(/\((required|필수)\)/g,'').trim().split(/[.。]/)[0].slice(0,40);
      }).join(', ')+T.end;
      missing[0].focus();return;
    }
    var g=function(id){return (document.getElementById(id).value||'').trim()};
    var subject=T.subject+g('f-topic')+' - '+g('f-name');
    var body=T.name+': '+g('f-name')+'\n'+T.org+': '+g('f-org')+'\n'+T.email+': '+g('f-email')+'\n'+T.topic+': '+g('f-topic')+'\n\n'+g('f-msg');
    window.location.href='mailto:zerothbio@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    msg.textContent=T.opened;
  });
})();
