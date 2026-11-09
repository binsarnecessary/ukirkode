// Ambil screenshot tiap demo portfolio -> public/portfolio/<slug>.webp
// Jalankan ulang kalau tampilan demo berubah: node scripts/portfolio-shots.mjs [slug ...]
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "portfolio");
const only = process.argv.slice(2);

// data portfolio dibaca langsung dari lib/data.ts supaya tidak dobel
const data = readFileSync(join(root, "lib", "data.ts"), "utf8");
const block = data.slice(data.indexOf("export const portfolio"));
const items = [...block.slice(0, block.indexOf("];")).matchAll(/slug:\s*"([^"]+)"[^}]*?url:\s*"([^"]+)"/g)]
  .map(([, slug, url]) => ({ slug, url }))
  .filter((p) => !only.length || only.includes(p.slug));
if (!items.length) { console.error("Tidak ada item portfolio yang cocok (cek lib/data.ts / slug)"); process.exit(1); }
for (const s of only) if (!items.some((p) => p.slug === s)) console.warn(`slug tidak dikenal: ${s}`);

const chromePath = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync);
if (!chromePath) { console.error("Chrome tidak ditemukan; set env CHROME"); process.exit(1); }

const profile = mkdtempSync(join(tmpdir(), "portfolio-shots-"));
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    const f = join(profile, "DevToolsActivePort");
    if (existsSync(f)) port = readFileSync(f, "utf8").split("\n")[0].trim();
    else await sleep(100);
  }
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(pages.find((p) => p.type === "page").webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) listeners.forEach((l) => l(m));
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result ?? {})));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const once = (method) => new Promise((r) => listeners.push((m) => m.method === method && r()));

  // viewport sama dengan preview lama (1280x800), disimpan 960x600 supaya ringan
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.enable");
  mkdirSync(outDir, { recursive: true });
  let failed = 0;
  for (const p of items) try {
    const loaded = once("Page.loadEventFired");
    const nav = await send("Page.navigate", { url: p.url });
    await Promise.race([loaded, sleep(20000)]);
    const status = (await send("Runtime.evaluate", { returnByValue: true,
      expression: "performance.getEntriesByType('navigation')[0]?.responseStatus ?? 0" })).result?.value;
    // demo error/down: jangan timpa screenshot lama
    if (nav.errorText || status >= 400) throw new Error(nav.errorText || `HTTP ${status}`);
    // scroll dulu supaya animasi reveal & lazy image jalan
    await send("Runtime.evaluate", { awaitPromise: true, expression:
      "(async()=>{for(let y=0;y<2400;y+=400){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,150));}scrollTo({top:0,behavior:'instant'});})()" });
    // tunggu animasi masuk selesai (default 4 detik, bisa diubah via WAIT_MS)
    await sleep(Number(process.env.WAIT_MS ?? 4000));
    const shot = await send("Page.captureScreenshot",
      { format: "webp", quality: 78, clip: { x: 0, y: 0, width: 1280, height: 800, scale: 0.75 } });
    const file = join(outDir, `${p.slug}.webp`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`${p.slug.padEnd(16)} ${Math.round(Buffer.byteLength(shot.data, "base64") / 1024)} KB`);
  } catch (e) {
    failed++;
    console.error(`${p.slug.padEnd(16)} DILEWATI (${e.message}) — screenshot lama dipertahankan`);
  }
  ws.close();
  if (failed) process.exitCode = 1;
} finally {
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
