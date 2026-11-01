// Run: node test.cjs [path-to-chromium]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const syntax = spawnSync(process.execPath, ['--check'], { input: script, encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr);
for (const name of ['MultiTool', 'AHK-mw', 'Itzhak-navon', 'artix-bspwm-dotfiles']) {
  assert.ok(html.includes(`href="https://github.com/itai215/${name}"`));
}
assert.ok(!html.includes('title="Online"'));
const browser = process.argv[2];
if (!browser) {
  console.log('PASS syntax and verified project links. Pass Chromium path for interaction tests.');
  process.exit(0);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mamont1k-test-'));
const checks = `<script>
window.addEventListener('load', async () => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  try {
    check(document.querySelector('main').inert, 'entry must isolate underlying content');
    document.getElementById('enterScreen').click();
    check(!document.querySelector('main').inert, 'entry must unlock content');
    check(document.activeElement.id === 'button-main', 'entry must focus first tab');
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', {key: 'End', bubbles: true}));
    check(document.activeElement === tabs[2], 'End must focus last tab');
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
    check(document.activeElement === tabs[0], 'ArrowRight must wrap');
    for (let i = 0; i < 30; i++) tabs[i % 3].click();
    check(document.querySelectorAll('[aria-selected="true"]').length === 1, 'one selected tab');
    check(document.querySelectorAll('[role="tabpanel"]:not([hidden])').length === 1, 'one visible panel');
    check(!document.getElementById('tab-projects').hidden, 'rapid selection ends on projects');
    check(document.querySelectorAll('.project-card[href]').length === 4, 'four project links');
    for (const tab of tabs) check(tab.getBoundingClientRect().height >= 44, '44px touch targets');
    check(document.documentElement.scrollWidth <= innerWidth, 'no horizontal overflow');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      check(getComputedStyle(document.querySelector('.tab-indicator')).transitionDuration === '0s', 'reduced motion transitions disabled');
      check(getComputedStyle(document.querySelector('.project-card')).animationName === 'none', 'reduced motion entrance disabled');
      check(document.getElementById('bgVideo').paused, 'reduced motion video paused');
    }
    document.body.dataset.test = 'PASS';
  } catch (error) { document.body.dataset.test = 'FAIL: ' + error.message; }
});
</script>`;
try {
  const file = path.join(dir, 'test.html');
  // Avoid external dependencies/network in a deterministic interaction test.
  fs.writeFileSync(file, html.replace(/<link[^>]*>/g, '').replace(/<source[^>]*>/g, '').replace(/<img[^>]*>/g, '').replace('</body>', checks + '</body>'));
  for (const width of [375, 1024]) for (const reduced of [false, true]) {
    const result = spawnSync(browser, ['--headless', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', `--window-size=${width},900`, ...(reduced ? ['--force-prefers-reduced-motion=reduce'] : []), '--dump-dom', '--virtual-time-budget=1000', 'file://' + file], { encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes('data-test="PASS"'), result.stdout.match(/data-test="[^"]*"/)?.[0] || result.stderr);
    console.log(`PASS ${width}px, reduced-motion=${reduced}: entry, keyboard, rapid tabs, links, touch targets, overflow`);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}