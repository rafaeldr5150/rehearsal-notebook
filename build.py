"""Build the standalone site (public/) from src/app.html plus the adapter, i18n and Supabase client."""
import os,shutil,hashlib,json
ROOT=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(ROOT,'src','app.html')
PUB=os.path.join(ROOT,'public'); os.makedirs(PUB,exist_ok=True)
cfg=json.load(open(os.path.join(ROOT,'src','config.json')))
page=open(SRC,encoding='utf8').read()
adapter=open(os.path.join(ROOT,'src','adapter.js'),encoding='utf8').read()
i18n=open(os.path.join(ROOT,'src','i18n.js'),encoding='utf8').read()
shutil.copy(os.path.join(ROOT,'src','supabase.js'),os.path.join(PUB,'supabase.js'))
i=page.index('<script>\n(function(){')
inject=('<script>\n'+i18n+'\n</script>\n<script src="supabase.js"></script>\n<script>window.CE_CONFIG='+json.dumps(cfg)+';</script>\n<script>\n'+adapter+'\n</script>\n')
page=page[:i]+inject+page[i:]
page=page.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
head=('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
 '<meta name="theme-color" content="#17181a">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
 '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
 '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-192.png">\n<link rel="icon" href="icon-192.png">\n'
 '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
 '<style>html:not(.ce-ready) body>*{visibility:hidden}html:not(.ce-ready) #join{visibility:visible}html[data-skin=neon] body,html[data-skin=custom] body{background:#08080d!important}html[data-skin=estudio] body{background:#f2f3f5!important}html[data-skin=cartaz] body{background:#17181a!important}</style>\n'
 '<script>(function(){var d=document.documentElement,s="neon";try{s=localStorage.getItem("ce-skin")||"neon";if(!localStorage.getItem("ce-band")&&!/[?&]b=/.test(location.search))s="neon"}catch(e){}d.dataset.skin=s;setTimeout(function(){d.classList.add("ce-ready")},4000)})()</script>\n'
 '</head>\n<body>\n')
tail=('\n<script>if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}</script>\n</body>\n</html>\n')
html=head+page+tail
open(os.path.join(PUB,'index.html'),'w',encoding='utf8').write(html)
open(os.path.join(PUB,'privacy.html'),'w',encoding='utf8').write(open(os.path.join(ROOT,'src','privacy.html'),encoding='utf8').read().replace('__CONTACT__',cfg.get('contact','')))
ver=hashlib.sha1(html.encode()).hexdigest()[:10]
sw='''const V="ce-%s";const CORE=["./","index.html","supabase.js","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(_){}
  e.waitUntil(self.registration.showNotification(d.title||"Rehearsal Notebook",{body:d.body||"",icon:"icon-192.png",badge:"icon-192.png",tag:d.tag,data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncached:true}).then(l=>{for(const c of l){if("focus" in c)return c.focus()}return clients.openWindow(e.notification.data.url||"./")}))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put("index.html",cp));return r}).catch(()=>caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r})));
});
'''%ver
open(os.path.join(PUB,'sw.js'),'w').write(sw)
man={"name":cfg.get("appName","Rehearsal Notebook"),"short_name":"Rehearsal","start_url":"./","display":"standalone","background_color":"#17181a","theme_color":"#17181a","lang":"pt-BR",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]}
json.dump(man,open(os.path.join(PUB,'manifest.webmanifest'),'w'),ensure_ascii=False)
for n in ('icon-192.png','icon-512.png'): shutil.copy(os.path.join(ROOT,'src',n),os.path.join(PUB,n))
print('ok',len(html),ver)
