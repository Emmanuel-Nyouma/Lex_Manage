// Capture LexManage UI dialogs to report/figures/*.png via Chrome DevTools Protocol.
// Logs in once (admin@demo.com), then for each target navigates, opens the dialog,
// fills sample data and screenshots the viewport.
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const FIG = path.join(__dirname, 'figures');
const port = 9344;
const userDir = path.join(require('os').tmpdir(), 'lexcap_' + Date.now());
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(e)}}); }).on('error', reject);
});

// Sample-data fillers run in the page. Each finds the open dialog and sets fields.
const FILLS = {
  caseFill: `(() => { const D=document.querySelector('[role=dialog]')||document.querySelector('.fixed.inset-0'); if(!D)return 'no-dialog';
    const setV=(el,v)=>{const p=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
    const ins=[...D.querySelectorAll('input')].filter(i=>i.type!=='file'); const ta=D.querySelector('textarea');
    if(ins[0])setV(ins[0],'Globale SARL v. Martin — Breach of Contract'); if(ins[1])setV(ins[1],'RG-2026-0142'); if(ins[2])setV(ins[2],'Tribunal de Grande Instance, Douala');
    if(ta)setV(ta,'Dispute over non-performance of a commercial supply agreement; prepare the summons and gather documentary evidence before the first hearing.'); return 'ok'; })()`,
  clientFill: `(() => { const D=document.querySelector('[role=dialog]')||document.querySelector('.fixed.inset-0'); if(!D)return 'no-dialog';
    const setV=(el,v)=>{const p=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
    const ins=[...D.querySelectorAll('input')].filter(i=>i.type!=='file'&&i.type!=='radio'&&i.type!=='checkbox'); const ta=D.querySelector('textarea');
    const vals=['Société Globale SARL','contact@globale.cm','+237 6 99 00 11 22','12 Avenue de la Liberté, Akwa, Douala'];
    ins.slice(0,4).forEach((el,i)=>{ if(vals[i])setV(el,vals[i]); }); if(ta)setV(ta,'Key commercial client — manufacturing sector. Primary contact: Mr. A. Globale.'); return 'ok'; })()`,
  eventFill: `(() => { const D=document.querySelector('[role=dialog]')||document.querySelector('.fixed.inset-0'); if(!D)return 'no-dialog';
    const setV=(el,v)=>{const p=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
    const txt=[...D.querySelectorAll('input')].filter(i=>['text','search',''].includes(i.type)); const ta=D.querySelector('textarea');
    if(txt[0])setV(txt[0],'First hearing — Globale SARL v. Martin'); if(txt[1])setV(txt[1],'Court Room 3, TGI Douala');
    if(ta)setV(ta,'Bring three certified copies of the summons and the evidence bundle.'); return 'ok'; })()`,
  notifFill: `(() => { const D=document.querySelector('[role=dialog]')||document.querySelector('.fixed.inset-0'); if(!D)return 'no-dialog';
    const setV=(el,v)=>{const p=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
    const ins=[...D.querySelectorAll('input')].filter(i=>['text','search',''].includes(i.type)); const ta=D.querySelector('textarea');
    if(ins[0])setV(ins[0],'Hearing reminder — Globale SARL v. Martin'); if(ta)setV(ta,'Reminder: the first hearing is scheduled for 15 June at 9:00 AM in Court Room 3. Please confirm attendance and prepare the evidence bundle.'); return 'ok'; })()`,
  noFill: `'ok'`,
};

const TARGETS = [
  { name: 'dlg-add-case',         url: '/cases',            trigger: 'New Case',            fill: 'caseFill' },
  { name: 'dlg-add-client',       url: '/clients',          trigger: 'New Client',          fill: 'clientFill' },
  { name: 'dlg-add-event',        url: '/calendar',         trigger: 'Ajouter',             fill: 'eventFill' },
  { name: 'dlg-upload-document',  url: '/documents',        trigger: 'Importer Documents',  fill: 'noFill', inline: true },
  { name: 'dlg-send-notification',url: '/company-settings', trigger: 'Send Notification',   fill: 'notifFill' },
];

(async () => {
  const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--remote-debugging-port='+port,'--user-data-dir='+userDir,'--hide-scrollbars','--window-size=1300,900', BASE+'/login'],
    { stdio: 'ignore' });

  let target=null;
  for (let i=0;i<60;i++){ await sleep(300); try{ const l=await getJSON(`http://127.0.0.1:${port}/json`); target=l.find(t=>t.type==='page'); if(target&&target.webSocketDebuggerUrl)break; }catch(e){} }
  if(!target){ console.error('no target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate:false, maxPayload:256*1024*1024 });
  let id=0; const pending={};
  const send=(method,params={})=>new Promise((res)=>{ const mid=++id; pending[mid]=res; ws.send(JSON.stringify({id:mid,method,params})); });
  await new Promise(r=>ws.on('open',r));
  ws.on('message',(data)=>{ const m=JSON.parse(data); if(m.id&&pending[m.id]){pending[m.id](m.result);delete pending[m.id];} });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:820,deviceScaleFactor:2,mobile:false});

  const evalJS = async (expr) => { const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true}); return r&&r.result?r.result.value:undefined; };
  // In-SPA navigation (keeps the in-memory access token; a hard reload would log us out).
  const navigate = async (url) => { await evalJS(`(()=>{history.pushState({},'',${JSON.stringify(url)});dispatchEvent(new PopStateEvent('popstate'));})()`); await sleep(400); };
  const waitFor = async (expr,tries=40,gap=250)=>{ for(let i=0;i<tries;i++){ const ok=await evalJS(expr); if(ok)return true; await sleep(gap);} return false; };

  // ---- Login ----
  await navigate('/login');
  await waitFor(`!!document.querySelector('input[name=email]')`);
  await evalJS(`(()=>{const set=(s,v)=>{const el=document.querySelector(s);Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};set('input[name=email]','admin@demo.com');set('input[name=password]','password123');})()`);
  await sleep(200);
  await evalJS(`(()=>{const b=document.querySelector('button[type=submit]')||[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Login');b&&b.click();})()`);
  const logged = await waitFor(`location.pathname!=='/login' && !!document.querySelector('a[href="/dashboard"]')`,60,300);
  console.log('login:', logged?'ok':'FAILED');
  // Force a full profile load so currentUser.role = CABINET_ADMIN (unlocks role-gated UI).
  await waitFor(`!!(window.__lexStore)`, 20, 200);
  await evalJS(`(async()=>{ if(window.__lexStore){ await window.__lexStore.getState().fetchMe(); } return true; })()`);
  const role = await evalJS(`window.__lexStore ? window.__lexStore.getState().currentUser?.role : 'no-store'`);
  console.log('role after fetchMe:', role);
  await sleep(600);

  // ---- Targets ----
  const hasTrigger = (trg) => `[...document.querySelectorAll('button')].some(x=>x.textContent.trim().includes(${JSON.stringify(trg)}))`;
  for (const t of TARGETS) {
    await navigate(t.url);
    await waitFor(`location.pathname==='${t.url}'`, 40, 200);
    const appeared = await waitFor(hasTrigger(t.trigger), 60, 300);  // wait for view + data to render the trigger
    await sleep(400);
    const clicked = await evalJS(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes(${JSON.stringify(t.trigger)}));if(b){b.click();return true;}return false;})()`);
    const dlgSel = t.inline ? `input[type=file], [class*=ropzone], [data-testid=upload]` : `[role=dialog], .fixed.inset-0`;
    const dlgOpen = await waitFor(`!!document.querySelector('${dlgSel}')`, 40, 200);
    await sleep(700);
    const filled = await evalJS(FILLS[t.fill]);
    await sleep(800);
    const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(path.join(FIG, t.name+'.png'), Buffer.from(shot.data,'base64'));
    console.log(`${t.name}: appeared=${appeared} trigger=${clicked} dialog=${dlgOpen} fill=${filled}`);
    // close any open dialog before next
    await evalJS(`(()=>{const x=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Close'||b.textContent.trim()==='Cancel'||b.textContent.trim()==='Fermer');x&&x.click();const e=new KeyboardEvent('keydown',{key:'Escape',keyCode:27,bubbles:true});document.dispatchEvent(e);})()`);
    await sleep(500);
  }

  ws.close(); chrome.kill();
  try{ fs.rmSync(userDir,{recursive:true,force:true}); }catch(e){}
  console.log('DONE');
  process.exit(0);
})().catch(e=>{ console.error(e); process.exit(1); });
