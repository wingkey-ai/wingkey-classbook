// 윙키클래스북 앱(PWA) 서비스 워커: 페이지는 인터넷 우선(실패 시 저장본), 그림은 저장본 우선. 음성(mp3)·신청 접수는 저장하지 않음.
const V='wkcb-mwd1cref';
const CORE=['/','/app.html','/icon-192.png','/icon-512.png','/app-icon.svg','/favicon.png','/og-classbook.jpg','/manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('.mp3')||r.headers.has('range'))return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(u.pathname==='/'?'/':r,cp));return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('/'))));return;}
 if(/\.(webp|jpg|png|svg|ico)$/.test(u.pathname)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;})));}
});
