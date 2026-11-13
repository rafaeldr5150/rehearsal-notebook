/* Ligação do Rehearsal Notebook com o Supabase.
   Oferece a mesma interface de banco que a página já usa (doc/collection/onSnapshot),
   com cópia local para funcionar sem internet e fila de gravações pendentes. */
(function(){
'use strict';
var CFG=window.CE_CONFIG;
if(!CFG||window.claude)return;

var band='';
try{
  var qs=new URLSearchParams(location.search);
  band=qs.get('b')||localStorage.getItem('ce-band')||'';
  if(qs.get('b')){localStorage.setItem('ce-band',band);history.replaceState(null,'',location.pathname+location.hash)}
}catch(e){}
window.CE_BAND=band;

/* ---------- tela de entrada: colar o código de convite ---------- */
function parseCode(txt){
  txt=String(txt||'').trim();
  var m=txt.match(/[?&#]b=([A-Za-z0-9-]+)/);
  if(m)return m[1].toLowerCase();
  return txt.toLowerCase().replace(/[^a-z0-9-]/g,'');
}
function joinCss(){
  if(document.getElementById('join-css'))return;
  var css=document.createElement('style');css.id='join-css';
  css.textContent='#join{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(900px 520px at 10% -10%,rgba(255,61,139,.28),transparent 60%),radial-gradient(800px 520px at 100% 100%,rgba(255,154,61,.2),transparent 60%),#0b0b10;color:#f4f4f9;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;overflow:auto}'+
   '#join .jbox{width:min(440px,100%);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:28px 24px 22px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.5)}'+
   '#join h1{margin:0 0 6px;font-size:30px;font-weight:900;letter-spacing:-.02em;line-height:1.05}'+
   '#join p{margin:0 0 18px;color:#b4b4c8;font-size:16px;line-height:1.45}'+
   '#join input{width:100%;box-sizing:border-box;padding:15px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.4);color:#fff;font:600 17px/1.2 Inter,system-ui,sans-serif;letter-spacing:.02em;outline:none}'+
   '#join input:focus{border-color:#ff3d8b;box-shadow:0 0 0 3px rgba(255,61,139,.25)}'+
   '#join button[type=submit]{width:100%;margin-top:12px;padding:15px 16px;border-radius:14px;border:0;background:linear-gradient(135deg,#ff3d8b,#ff9a3d);color:#fff;font:800 17px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(255,61,139,.35)}'+
   '#join button[disabled]{opacity:.6;cursor:default}'+
   '#join #join-msg{min-height:22px;margin-top:12px;color:#ff9a9a;font-size:15px}'+
   '#join .jhint{margin:14px 0 0;font-size:14px;color:#9a9ab2}'+
   '#join .jor{display:flex;align-items:center;gap:10px;margin:18px 0 12px;color:#8c8ca6;font-size:13px}#join .jor:before,#join .jor:after{content:"";flex:1;height:1px;background:rgba(255,255,255,.14)}'+
   '#join #join-new{width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff;font:700 16px/1 Inter,system-ui,sans-serif;cursor:pointer}'+
   '#join .jnew{margin-top:10px}'+
   '#join .gbtn{width:100%;padding:15px 16px;border-radius:14px;border:0;background:#fff;color:#1b1b22;font:800 17px/1 Inter,system-ui,sans-serif;cursor:pointer}'+
   '#join #a-go,#join #b-go{width:100%;margin-top:12px;padding:15px 16px;border-radius:14px;border:0;background:linear-gradient(135deg,#ff3d8b,#ff9a3d);color:#fff;font:800 17px/1 Inter,system-ui,sans-serif;cursor:pointer}'+
   '#join #a-code,#join #b-new{width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff;font:700 16px/1 Inter,system-ui,sans-serif;cursor:pointer}'+
   '#join .jlabel{margin:6px 0 8px;font:700 13px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9a9ab2}'+
   '#join .bandbtn{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;padding:15px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font:700 17px/1.2 Inter,sans-serif;cursor:pointer;text-align:left}#join .bandbtn small{font:600 12px Inter,sans-serif;color:#b4b4c8;text-transform:uppercase;letter-spacing:.05em}'+
   '#join .jlang{display:flex;gap:8px;justify-content:center;margin-top:16px}'+
   '#join .jlang button{background:transparent;border:1px solid rgba(255,255,255,.2);color:#cfcfe0;border-radius:999px;padding:6px 12px;font:600 13px Inter,sans-serif;cursor:pointer}'+
   '#join .jlang button.on{background:rgba(255,255,255,.14);color:#fff}';
  document.head.appendChild(css);
}
function showJoin(msg){
  var old=document.getElementById('join');if(old)old.remove();
  joinCss();
  var box=document.createElement('div');box.id='join';
  box.innerHTML='<div class="jbox"><h1>Rehearsal Notebook</h1><p>Cole o código de convite da sua banda para entrar.</p>'+
    '<form id="join-form" autocomplete="off"><input id="join-code" type="text" inputmode="text" placeholder="Código ou link de convite" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Código ou link de convite"><button type="submit" id="join-go">Entrar na banda</button></form>'+
    '<div id="join-msg" role="status" aria-live="polite"></div>'+
    '<p class="jhint">Não tem um código? Peça o link ou o código a alguém da banda.</p>'+
    '<div class="jor"><span>ou</span></div><button type="button" id="join-new">Criar uma banda nova</button><p class="jhint jnew">Primeira vez por aqui? Crie a sua banda, cadastre o pessoal e envie o convite.</p>'+
    '<p class="jhint"><a href="#" id="join-acct" style="color:#ffb3d0">Entrar com uma conta</a></p>'+
    '<div class="jlang">'+['pt','en','es'].map(function(l){return '<button type="button" data-l="'+l+'" class="'+((window.CE_LANG||'pt')===l?'on':'')+'">'+{pt:'Português',en:'English',es:'Español'}[l]+'</button>'}).join('')+'</div><p class="jhint" style="text-align:center"><a href="privacy.html" style="color:#9a9ab2">Política de privacidade</a></p></div>';
  document.body.appendChild(box);
  var msgEl=box.querySelector('#join-msg'),inp=box.querySelector('#join-code'),go=box.querySelector('#join-go');
  function say(t){msgEl.textContent=t||''}
  if(msg)say(msg);
  box.querySelector('.jlang').addEventListener('click',function(e){var b=e.target.closest('button[data-l]');if(b&&window.CE_SET_LANG)window.CE_SET_LANG(b.dataset.l)});
  box.querySelector('#join-acct').addEventListener('click',function(e){e.preventDefault();showEntry()});
  box.querySelector('#join-form').addEventListener('submit',function(e){
    e.preventDefault();
    var code=parseCode(inp.value);
    if(!code){say('Digite o código ou cole o link de convite.');return}
    go.disabled=true;say('Verificando…');
    fetch(CFG.url+'/rest/v1/rpc/ce_band_exists',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify({p_code:code})})
      .then(function(r){if(!r.ok)throw new Error('http');return r.json()})
      .then(function(ok){
        if(ok===true){try{localStorage.setItem('ce-band',code)}catch(e){}location.href=location.pathname}
        else{go.disabled=false;say('Código não encontrado. Confira e tente de novo.')}
      })
      .catch(function(){go.disabled=false;say('Sem internet para verificar o código.')});
  });
  box.querySelector('#join-new').addEventListener('click',function(){
    var nb=this;nb.disabled=true;go.disabled=true;say('Criando…');
    fetch(CFG.url+'/rest/v1/rpc/ce_band_create',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:'{}'})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
      .then(function(r){
        if(r.ok&&typeof r.j==='string'){try{localStorage.setItem('ce-band',r.j)}catch(e){}location.href=location.pathname}
        else{nb.disabled=false;go.disabled=false;say(/rate/i.test(JSON.stringify(r.j))?'Muitas bandas criadas deste aparelho. Tente de novo mais tarde.':'Não foi possível criar a banda agora. Tente de novo.')}
      })
      .catch(function(){nb.disabled=false;go.disabled=false;say('Sem internet para criar a banda.')});
  });
  setTimeout(function(){try{inp.focus()}catch(e){}},50);
}

/* ---------- contas: Google ou e-mail e senha, e a lista "Minhas bandas" ---------- */
var AUTH=null;
function authClient(){
  if(AUTH)return AUTH;
  AUTH=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ce-auth',flowType:'pkce'}});
  AUTH.auth.onAuthStateChange(function(ev){if(ev==='PASSWORD_RECOVERY')showNewPass()});
  return AUTH;
}
function sess(){return authClient().auth.getSession().then(function(r){return r.data&&r.data.session||null})}
function arpc(fn,args){
  return sess().then(function(s){
    if(!s)throw new Error('auth');
    return fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:CFG.key,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify(args||{})})
      .then(function(r){return r.ok?r.json():r.text().then(function(t){throw new Error(t)})});
  });
}
function uname(s){var u=s.user||{},m=u.user_metadata||{};return {email:u.email||'',name:m.full_name||m.name||''}}
window.CE_AUTH={
  user:null,role:'',
  openEntry:function(){try{sessionStorage.setItem('ce-entry','1')}catch(e){}location.href=location.pathname},
  signOut:function(){return authClient().auth.signOut().then(function(){try{sessionStorage.removeItem('ce-entry');localStorage.removeItem('ce-band');localStorage.removeItem('ce-me')}catch(e){}location.href=location.pathname})},
  accounts:function(){return arpc('ce_band_accounts',{p_code:band})},
  setRole:function(u,r){return arpc('ce_band_set_role',{p_code:band,p_user:u,p_role:r})},
  setMe:function(mid){if(window.CE_AUTH.user&&band)arpc('ce_set_me',{p_code:band,p_mid:mid||''}).catch(function(){})}
};
function pickBand(code,mid){
  try{localStorage.setItem('ce-band',code);sessionStorage.removeItem('ce-entry');if(mid)localStorage.setItem('ce-me',mid);else localStorage.removeItem('ce-me')}catch(e){}
  location.href=location.pathname;
}
function mountScreen(inner){
  var old=document.getElementById('join');if(old)old.remove();
  joinCss();
  var box=document.createElement('div');box.id='join';
  box.innerHTML='<div class="jbox">'+inner+'<div class="jlang">'+['pt','en','es'].map(function(l){return '<button type="button" data-l="'+l+'" class="'+((window.CE_LANG||'pt')===l?'on':'')+'">'+{pt:'Português',en:'English',es:'Español'}[l]+'</button>'}).join('')+'</div><p class="jhint" style="text-align:center"><a href="privacy.html" style="color:#9a9ab2">Política de privacidade</a></p></div>';
  document.body.appendChild(box);
  box.querySelector('.jlang').addEventListener('click',function(e){var b=e.target.closest('button[data-l]');if(b&&window.CE_SET_LANG)window.CE_SET_LANG(b.dataset.l)});
  return box;
}
function errTxt(e){
  var m=String(e&&e.message||e||'');
  if(/Invalid login/i.test(m))return 'E-mail ou senha incorretos.';
  if(/already registered|already been registered/i.test(m))return 'Esse e-mail já tem conta. Toque em Entrar.';
  if(/at least|weak|short/i.test(m))return 'A senha precisa ter pelo menos 8 caracteres.';
  if(/not confirmed/i.test(m))return 'Confirme o seu e-mail pelo link que enviamos e depois entre.';
  if(/rate limit|too many|after \d+ seconds/i.test(m))return 'Muitas tentativas agora. Espere um pouco e tente de novo.';
  if(/valid email|invalid format/i.test(m))return 'Digite um e-mail válido.';
  if(/network|fetch/i.test(m))return 'Sem internet agora.';
  return 'Não foi possível agora. Tente de novo.';
}
function showEntry(msg){
  mountScreen('<h1>Rehearsal Notebook</h1><p>Carregando…</p>');
  if(!window.supabase||!navigator.onLine){showJoin(navigator.onLine?'':'Sem internet agora.');return}
  sess().then(function(s){if(s)showBands();else showLogin(msg)}).catch(function(){showJoin()});
}
function showLogin(msg){
  var mode='in';
  var box=mountScreen('<h1>Rehearsal Notebook</h1><p>Entre para ver as suas bandas em qualquer aparelho.</p>'+
    '<button type="button" id="a-google" class="gbtn">Continuar com o Google</button>'+
    '<div class="jor"><span>ou</span></div>'+
    '<form id="a-form" autocomplete="on"><input id="a-mail" type="email" inputmode="email" placeholder="E-mail" autocomplete="email" aria-label="E-mail" style="margin-bottom:10px"><input id="a-pass" type="password" placeholder="Senha (mínimo 8 caracteres)" autocomplete="current-password" aria-label="Senha"><button type="submit" id="a-go">Entrar</button></form>'+
    '<p class="jhint"><a href="#" id="a-toggle" style="color:#ffb3d0">Não tem conta? Criar conta</a> · <a href="#" id="a-forgot" style="color:#ffb3d0">Esqueci a senha</a></p>'+
    '<div id="join-msg" role="status" aria-live="polite"></div>'+
    '<div class="jor"><span>ou</span></div><button type="button" id="a-code">Só tenho um código de convite</button>');
  var msgEl=box.querySelector('#join-msg'),go=box.querySelector('#a-go');
  function say(t){msgEl.textContent=t||''}if(msg)say(msg);
  box.querySelector('#a-code').addEventListener('click',function(){showJoin()});
  box.querySelector('#a-google').addEventListener('click',function(){
    say('Abrindo o Google…');
    authClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}).then(function(r){if(r.error)say(errTxt(r.error))});
  });
  box.querySelector('#a-toggle').addEventListener('click',function(e){
    e.preventDefault();mode=mode==='in'?'up':'in';
    go.textContent=mode==='in'?'Entrar':'Criar conta';
    this.textContent=mode==='in'?'Não tem conta? Criar conta':'Já tem conta? Entrar';
    box.querySelector('#a-pass').autocomplete=mode==='in'?'current-password':'new-password';say('');
  });
  box.querySelector('#a-forgot').addEventListener('click',function(e){
    e.preventDefault();var em=box.querySelector('#a-mail').value.trim();
    if(!em){say('Digite o seu e-mail acima.');return}
    authClient().auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname}).then(function(r){say(r.error?errTxt(r.error):'Se esse e-mail tiver conta, enviamos um link para criar uma senha nova.')});
  });
  box.querySelector('#a-form').addEventListener('submit',function(e){
    e.preventDefault();
    var em=box.querySelector('#a-mail').value.trim(),pw=box.querySelector('#a-pass').value;
    if(!em||!pw){say('Digite o e-mail e a senha.');return}
    if(mode==='up'&&pw.length<8){say('A senha precisa ter pelo menos 8 caracteres.');return}
    go.disabled=true;say(mode==='in'?'Entrando…':'Criando a conta…');
    var A=authClient().auth;
    (mode==='in'?A.signInWithPassword({email:em,password:pw}):A.signUp({email:em,password:pw,options:{emailRedirectTo:location.origin+location.pathname}})).then(function(r){
      go.disabled=false;
      if(r.error){say(errTxt(r.error));return}
      if(r.data&&r.data.session){showBands();return}
      say('Enviamos um e-mail de confirmação. Abra o link dele e depois volte aqui para entrar.');
    }).catch(function(err){go.disabled=false;say(errTxt(err))});
  });
}
function showNewPass(){
  var box=mountScreen('<h1>Rehearsal Notebook</h1><p>Escolha uma senha nova.</p><form id="a-form"><input id="a-pass" type="password" placeholder="Senha nova (mínimo 8 caracteres)" autocomplete="new-password"><button type="submit" id="a-go">Salvar senha</button></form><div id="join-msg" role="status"></div>');
  var msgEl=box.querySelector('#join-msg');
  box.querySelector('#a-form').addEventListener('submit',function(e){
    e.preventDefault();var pw=box.querySelector('#a-pass').value;
    if(pw.length<8){msgEl.textContent='A senha precisa ter pelo menos 8 caracteres.';return}
    authClient().auth.updateUser({password:pw}).then(function(r){if(r.error)msgEl.textContent=errTxt(r.error);else showBands()});
  });
}
function showBands(){
  var box=mountScreen('<h1>Rehearsal Notebook</h1><p id="b-hello">Carregando…</p><div id="b-list"></div>');
  sess().then(function(s){
    if(!s){showLogin();return}
    var u=uname(s);
    var pre=band?arpc('ce_band_join',{p_code:band}).catch(function(){}):Promise.resolve();
    return pre.then(function(){return arpc('ce_my_bands')}).then(function(list){
      var b=mountScreen('<h1>Rehearsal Notebook</h1><p>'+esc(u.name||u.email)+'</p>'+
        '<div class="jlabel">Suas bandas</div><div id="b-list">'+
        (list.length?list.map(function(x){return '<button type="button" class="bandbtn" data-c="'+esc(x.code)+'" data-m="'+esc(x.mid||'')+'"><b>'+esc(x.name||'Banda sem nome')+'</b><small>'+(x.role==='owner'?'dono':'integrante')+'</small></button>'}).join(''):'<p class="jhint">Você ainda não está em nenhuma banda. Crie uma ou entre com um código.</p>')+'</div>'+
        '<div class="jor"><span>ou</span></div>'+
        '<form id="b-join" autocomplete="off"><input id="b-code" type="text" placeholder="Código ou link de convite" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Código ou link de convite"><button type="submit" id="b-go">Entrar na banda</button></form>'+
        '<button type="button" id="b-new" style="margin-top:12px">Criar uma banda nova</button>'+
        '<div id="join-msg" role="status" aria-live="polite"></div>'+
        '<p class="jhint">'+(band?'<a href="#" id="b-back" style="color:#ffb3d0">Voltar para a banda atual</a> · ':'')+'<a href="#" id="b-out" style="color:#ffb3d0">Sair da conta</a></p>');
      var msgEl=b.querySelector('#join-msg');function say(t){msgEl.textContent=t||''}
      b.querySelector('#b-list').addEventListener('click',function(e){var x=e.target.closest('.bandbtn');if(x)pickBand(x.dataset.c,x.dataset.m)});
      b.querySelector('#b-out').addEventListener('click',function(e){e.preventDefault();window.CE_AUTH.signOut()});
      var bk=b.querySelector('#b-back');if(bk)bk.addEventListener('click',function(e){e.preventDefault();try{sessionStorage.removeItem('ce-entry')}catch(x){}location.href=location.pathname});
      b.querySelector('#b-join').addEventListener('submit',function(e){
        e.preventDefault();var code=parseCode(b.querySelector('#b-code').value);
        if(!code){say('Digite o código ou cole o link de convite.');return}
        say('Verificando…');
        arpc('ce_band_join',{p_code:code}).then(function(){var hit=null;return arpc('ce_my_bands').then(function(l){hit=l.filter(function(y){return y.code===code})[0];pickBand(code,hit&&hit.mid)})})
          .catch(function(err){say(/unknown/i.test(String(err&&err.message))?'Código não encontrado. Confira e tente de novo.':errTxt(err))});
      });
      b.querySelector('#b-new').addEventListener('click',function(){
        this.disabled=true;say('Criando…');
        arpc('ce_band_create').then(function(code){pickBand(code,'')}).catch(function(err){b.querySelector('#b-new').disabled=false;say(/rate/i.test(String(err&&err.message))?'Muitas bandas criadas deste aparelho. Tente de novo mais tarde.':'Não foi possível criar a banda agora. Tente de novo.')});
      });
    });
  }).catch(function(){showJoin()});
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
/* quem está logado na banda aberta */
if(band&&window.supabase){
  sess().then(function(s){
    if(!s)return;var u=uname(s);window.CE_AUTH.user=u;
    return arpc('ce_band_join',{p_code:band}).catch(function(){}).then(function(){return arpc('ce_my_bands')}).then(function(l){
      var me=l.filter(function(x){return x.code===band})[0];if(me){window.CE_AUTH.role=me.role;window.CE_AUTH.mid=me.mid||''}
      window.dispatchEvent(new Event('ce-auth'));
    });
  }).catch(function(){});
}
window.CE_SHOW_JOIN=showJoin;
var forceEntry=false;try{forceEntry=sessionStorage.getItem('ce-entry')==='1'}catch(e){}
if(!band||forceEntry){showEntry();window.claude={use:function(){return Promise.resolve(null)}};window.CE_STANDALONE=true;return}
/* se o código salvo não existir mais, volta para a tela de entrada */
if(navigator.onLine){
  fetch(CFG.url+'/rest/v1/rpc/ce_band_exists',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify({p_code:band})})
    .then(function(r){return r.ok?r.json():true}).then(function(ok){
      if(ok===false){try{localStorage.removeItem('ce-band');localStorage.removeItem('ce-me');localStorage.removeItem('ce-cache-'+band)}catch(e){}showJoin('Essa banda não existe mais. Peça um novo código.')}
    }).catch(function(){});
}


var CK='ce-cache-'+band, QK='ce-queue-'+band;
var cache={}, queue=[], listeners=[], loaded=false, flushing=false, client=null, channel=null, liveHandlers=[];
function ld(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
cache=ld(CK,{});queue=ld(QK,[]);
if(Object.keys(cache).length)loaded=true;

function rpc(fn,args){
  return fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify(args)})
    .then(function(r){if(!r.ok)return r.text().then(function(t){var e=new Error(t);e.status=r.status;throw e});return r.json()});
}
/* Lembretes do ensaio (web push). Só existe quando o navegador suporta. */
(function(){
  var ok='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&!!CFG.vapid;
  function b64(s){var p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}
  function reg(){return navigator.serviceWorker.ready}
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),standalone=window.matchMedia&&matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  window.CE_PUSH={
    supported:ok,
    needsInstall:!ok&&ios&&!standalone,
    state:function(){
      if(!ok)return Promise.resolve('unsupported');
      if(Notification.permission==='denied')return Promise.resolve('denied');
      return reg().then(function(r){return r.pushManager.getSubscription()}).then(function(s){return s?'on':'off'}).catch(function(){return 'off'});
    },
    enable:function(mid){
      if(!ok)return Promise.reject(new Error('unsupported'));
      return Notification.requestPermission().then(function(p){
        if(p!=='granted')throw new Error('denied');
        return reg()}).then(function(r){
          return r.pushManager.getSubscription().then(function(s){return s||r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(CFG.vapid)})})})
        .then(function(s){
          var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
          return rpc('ce_push_save',{p_band:band,p_sub:s.toJSON(),p_mid:mid||null,p_tz:tz,p_lang:window.CE_LANG||'pt'}).then(function(){return s})});
    },
    disable:function(){
      return reg().then(function(r){return r.pushManager.getSubscription()}).then(function(s){
        if(!s)return;var ep=s.endpoint;return s.unsubscribe().then(function(){return rpc('ce_push_remove',{p_band:band,p_endpoint:ep})})});
    },
    test:function(){
      return reg().then(function(r){return r.pushManager.getSubscription()}).then(function(s){
        if(!s)throw new Error('off');
        return fetch(CFG.url+'/functions/v1/reminders',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify({action:'test',band:band,endpoint:s.endpoint})}).then(function(r){return r.json()})});
    }
  };
})();
/* Google Drive da banda: gravações enviadas para setlist/<música>/ (o servidor guarda o acesso). */
(function(){
  var FN=CFG.url+'/functions/v1/drive-oauth';
  function call(action,extra){
    return fetch(FN,{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action:action,band:band},extra||{}))}).then(function(r){return r.json()});
  }
  function idb(){return new Promise(function(res,rej){var q=indexedDB.open('ce-rec',1);q.onupgradeneeded=function(){q.result.createObjectStore('q',{keyPath:'id'})};q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}
  function tx(mode,fn){return idb().then(function(d){return new Promise(function(res,rej){var t=d.transaction('q',mode),r=fn(t.objectStore('q'));t.oncomplete=function(){res(r&&r.result)};t.onerror=function(){rej(t.error)}})})}
  function put(it){return tx('readwrite',function(s){return s.put(it)})}
  function del(id){return tx('readwrite',function(s){return s.delete(id)})}
  function all(){return tx('readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).filter(function(x){return x.band===band})}).catch(function(){return []})}
  function send(it,onProg){
    return call('upload',{songId:it.songId,title:it.title,name:it.name,mime:it.mime,origin:location.origin}).then(function(r){
      if(!r||!r.ok){var e=new Error(r&&r.error||'upload');e.code=r&&r.error;throw e}
      return new Promise(function(res,rej){
        var x=new XMLHttpRequest();x.open('PUT',r.url);x.setRequestHeader('Content-Type',it.mime);
        x.upload.onprogress=function(e){if(onProg&&e.lengthComputable)onProg(e.loaded/e.total)};
        x.onload=function(){if(x.status>=200&&x.status<300){var j={};try{j=JSON.parse(x.responseText)}catch(e){}res(j)}else rej(new Error('put '+x.status))};
        x.onerror=function(){rej(new Error('network'))};x.send(it.blob);
      });
    });
  }
  var flushing=false;
  function flush(){
    if(flushing)return Promise.resolve(0);flushing=true;
    return all().then(function(list){
      return list.reduce(function(p,it){return p.then(function(){return send(it).then(function(){return del(it.id)}).catch(function(){})})},Promise.resolve());
    }).then(function(){flushing=false;return all().then(function(l){return l.length})},function(){flushing=false;return 0});
  }
  window.CE_DRIVE={
    status:function(){return call('status').catch(function(){return null})},
    connect:function(){location.href=FN+'?start=1&band='+encodeURIComponent(band)+'&ret='+encodeURIComponent(location.origin)},
    disconnect:function(){return call('disconnect')},
    list:function(songId){return call('list',{songId:songId})},
    remove:function(fileId){return call('delete',{fileId:fileId})},
    blob:function(fileId){
      return call('picker-token').then(function(t){
        if(!t||!t.ok)throw new Error('token');
        return fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media',{headers:{Authorization:'Bearer '+t.token}});
      }).then(function(r){if(!r.ok)throw new Error('get '+r.status);return r.blob()});
    },
    canPick:!!CFG.pickerKey,
    pickFolder:function(){
      function loadGapi(){return new Promise(function(res,rej){
        if(window.gapi&&window.google&&window.google.picker)return res();
        function ready(){window.gapi.load('picker',{callback:res,onerror:rej})}
        if(window.gapi)return ready();
        var s=document.createElement('script');s.src='https://apis.google.com/js/api.js';s.onload=ready;s.onerror=rej;document.head.appendChild(s);
      })}
      return Promise.all([call('picker-token'),loadGapi()]).then(function(r){
        var t=r[0];if(!t||!t.ok)throw new Error('token');
        return new Promise(function(res){
          var view=new google.picker.DocsView(google.picker.ViewId.FOLDERS).setSelectFolderEnabled(true).setIncludeFolders(true).setMimeTypes('application/vnd.google-apps.folder');
          new google.picker.PickerBuilder().addView(view).setOAuthToken(t.token).setDeveloperKey(CFG.pickerKey).setAppId(t.appId).setLocale(window.CE_LANG||'pt')
            .setCallback(function(d){
              if(d.action==='picked'&&d.docs&&d.docs[0])res(call('set-folder',{folderId:d.docs[0].id}));
              else if(d.action==='cancel')res({cancelled:true});
            }).build().setVisible(true);
        });
      });
    },
    pending:function(){return all().then(function(l){return l.length})},
    flush:flush,
    upload:function(blob,meta,onProg){
      var it={id:Math.random().toString(36).slice(2)+Date.now(),band:band,songId:meta.songId,title:meta.title,name:meta.name,mime:meta.mime,blob:blob,at:Date.now()};
      return send(it,onProg).then(function(f){return {sent:true,file:f}},function(e){
        return put(it).then(function(){return {sent:false,queued:true,error:e&&e.code}},function(){throw e});
      });
    }
  };
  window.addEventListener('online',function(){flush()});
  window.CE_PLAYLIST=function(playlist){
    return fetch(CFG.url+'/functions/v1/spotify-playlist',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify({band:band,playlist:playlist})}).then(function(r){return r.json()});
  };
  setTimeout(function(){if(navigator.onLine)flush()},6000);
})();
function applyOp(o){
  var c=cache[o.coll]||(cache[o.coll]={});
  if(o.op==='delete')delete c[o.id];
  else if(o.op==='set')c[o.id]=o.data;
  else c[o.id]=Object.assign({},c[o.id],o.data);
}
function docSnap(coll,id){var d=cache[coll]&&cache[coll][id];return {id:id,exists:!!d,data:function(){return d},metadata:{}}}
function collSnap(coll){var c=cache[coll]||{};return {docs:Object.keys(c).sort().map(function(id){return docSnap(coll,id)})}}
function notify(coll){
  listeners.forEach(function(l){
    if(l.coll!==coll)return;
    try{l.cb(l.id?docSnap(coll,l.id):collSnap(coll))}catch(e){console.error(e)}
  });
}
function notifyAll(){var seen={};listeners.forEach(function(l){if(!seen[l.coll]){seen[l.coll]=1;notify(l.coll)}})}
function setStatus(){window.CE_SYNC={pending:queue.length,online:navigator.onLine};window.dispatchEvent(new Event('ce-sync'))}

function refresh(){
  if(!band)return Promise.resolve();
  return rpc('ce_list',{p_band:band}).then(function(rows){
    var next={};
    rows.forEach(function(r){(next[r.coll]||(next[r.coll]={}))[r.id]=r.data});
    cache=next;queue.forEach(applyOp);
    sv(CK,cache);loaded=true;notifyAll();
  }).catch(function(){if(loaded)notifyAll()});
}
var rT=0;function refreshSoon(){clearTimeout(rT);rT=setTimeout(refresh,400)}

function flush(){
  if(flushing||!queue.length||!band)return;
  flushing=true;
  var o=queue[0];
  rpc('ce_write',{p_band:band,p_op:o.op,p_coll:o.coll,p_id:o.id,p_data:o.data||{}}).then(function(){
    queue.shift();sv(QK,queue);flushing=false;setStatus();
    if(channel)channel.send({type:'broadcast',event:'changed',payload:{coll:o.coll}});
    flush();
  }).catch(function(e){
    flushing=false;
    if(e.status&&e.status>=400&&e.status<500){queue.shift();sv(QK,queue);console.error('gravação recusada',e.message);refreshSoon()}
    setStatus();
  });
}
function write(o){applyOp(o);sv(CK,cache);queue.push(o);sv(QK,queue);notify(o.coll);setStatus();flush();return Promise.resolve()}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}

function docRef(coll,id){
  return {id:id,
    set:function(d){return write({op:'set',coll:coll,id:id,data:d})},
    update:function(d){return write({op:'update',coll:coll,id:id,data:d})},
    delete:function(){return write({op:'delete',coll:coll,id:id})},
    get:function(){return Promise.resolve(docSnap(coll,id))},
    onSnapshot:function(cb){var l={coll:coll,id:id,cb:cb};listeners.push(l);if(loaded)setTimeout(function(){cb(docSnap(coll,id))},0);return function(){listeners=listeners.filter(function(x){return x!==l})}}
  };
}
var db={
  doc:function(path){var s=path.split('/');return docRef(s[0],s[1])},
  collection:function(coll){return {
    doc:function(id){return docRef(coll,id||newId())},
    add:function(d){var r=docRef(coll,newId());return r.set(d).then(function(){return r})},
    onSnapshot:function(cb){var l={coll:coll,cb:cb};listeners.push(l);if(loaded)setTimeout(function(){cb(collSnap(coll))},0);return function(){listeners=listeners.filter(function(x){return x!==l})}}
  }}
};

/* tempo real: avisa os outros aparelhos quando algo muda, e leva o "ensaio ao vivo" */
function connect(){
  if(!band||!window.supabase||client)return;
  try{
    client=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:false,autoRefreshToken:false}});
    channel=client.channel('ce-'+band,{config:{broadcast:{self:false}}});
    channel.on('broadcast',{event:'changed'},refreshSoon);
    channel.on('broadcast',{event:'live'},function(m){liveHandlers.forEach(function(h){try{h(m.payload)}catch(e){}})});
    channel.subscribe();
  }catch(e){console.error(e)}
}
window.CE_LIVE={
  send:function(p){if(channel)channel.send({type:'broadcast',event:'live',payload:p})},
  on:function(h){liveHandlers.push(h)}
};

window.addEventListener('online',function(){setStatus();flush();refresh()});
window.addEventListener('offline',setStatus);
document.addEventListener('visibilitychange',function(){if(!document.hidden){flush();refresh()}});
setInterval(function(){flush();if(!document.hidden&&navigator.onLine)refresh()},45000);

window.claude={use:function(name){return Promise.resolve(name==='db'&&band?db:null)}};
window.CE_STANDALONE=true;
setStatus();
if(band){refresh().then(flush);connect()}
})();
