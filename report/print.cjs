// Print an HTML file to PDF (A4, top-left page numbers) via Chrome DevTools Protocol.
// Usage: node print.js <input.html> <output.pdf>
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const input = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const fileUrl = 'file:///' + input.replace(/\\/g, '/');
const port = 9333;
const userDir = path.join(require('os').tmpdir(), 'lexprint_' + Date.now());

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + userDir,
    '--hide-scrollbars', fileUrl,
  ], { stdio: 'ignore' });

  // Wait for the page target to be available.
  let target = null;
  for (let i = 0; i < 60; i++) {
    await sleep(300);
    try {
      const list = await getJSON(`http://127.0.0.1:${port}/json`);
      target = list.find(t => t.type === 'page' && t.url.includes('report'));
      if (target && target.webSocketDebuggerUrl) break;
    } catch (e) { /* not ready */ }
  }
  if (!target) { console.error('No page target'); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  let id = 0;
  const pending = {};
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = ++id;
    pending[mid] = resolve;
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise(r => ws.on('open', r));
  let loaded = false;
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && pending[msg.id]) { pending[msg.id](msg.result); delete pending[msg.id]; }
    if (msg.method === 'Page.loadEventFired') loaded = true;
  });

  await send('Page.enable');
  // give it time to finish loading images/fonts
  for (let i = 0; i < 20 && !loaded; i++) await sleep(200);
  await sleep(1200);

  const header = `<div style="font-family:'Times New Roman',serif;font-size:9pt;width:100%;margin:0;padding:0 0 0 25.4mm;-webkit-print-color-adjust:exact;color:#000;"><span class="pageNumber"></span></div>`;
  const footer = `<div style="font-family:'Times New Roman',serif;font-size:8pt;width:100%;text-align:center;color:#666;padding:0 18mm;">LexManage — BTech Software Engineering Project Report</div>`;

  const res = await send('Page.printToPDF', {
    landscape: false,
    printBackground: true,
    paperWidth: 8.27, paperHeight: 11.69,         // A4
    // Comfortable, balanced academic margins (~2.5 cm sides) so text is not flush to the edges.
    marginTop: 1.0, marginBottom: 0.9, marginLeft: 1.0, marginRight: 1.0,
    displayHeaderFooter: true,
    headerTemplate: header,
    footerTemplate: footer,
    preferCSSPageSize: false,
  });

  fs.writeFileSync(output, Buffer.from(res.data, 'base64'));
  ws.close();
  chrome.kill();
  try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
  console.log('PDF written:', output);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
