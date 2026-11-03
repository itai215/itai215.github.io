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
const projects = [
  ['Hunter Worlds', 'https://hunterworld.space/'],
  ['Political World', 'https://discord.com/invite/6G7dU3k3Zc'],
  ['LexiGPT', 'https://discord.gg/t3WAAPPq2j'],
];
for (const [name, url] of projects) {
  assert.ok(html.includes(`href="${url}"`), name);
  assert.ok(html.includes(`${name} ↗`), name);
}
for (const removed of ['MultiTool', 'AHK-mw', 'Itzhak-navon', 'artix-bspwm-dotfiles', 'Кабилджон', 'track-title', 'badge-chip', 'badge-icon', 'HypeSquad', 'project-tag', 'Боты & Автоматизация', 'FastAPI', 'Redis', 'SQLite', 'SQLAlchemy']) {
  assert.ok(!html.includes(removed), `removed: ${removed}`);
}
assert.ok(html.includes('disnake, Discordeno, JavaScript'));
assert.ok(html.includes('SQL, MongoDB, PostgreSQL'));
assert.ok(html.includes('href="https://funpay.com/users/9685101/"'));
assert.ok(html.includes('-webkit-tap-highlight-color: transparent'));
assert.match(html, /:focus-visible\s*\{\s*outline: 2px solid/);
assert.ok(html.includes('id="audioTrack"'));
assert.ok(html.includes('id="playBtn"'));
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
    const cards = [...document.querySelectorAll('.project-card[href]')];
    check(cards.length === 3, 'three project links');
    check(JSON.stringify(cards.map(card => [card.querySelector('.project-name').textContent.replace(' ↗', ''), card.href])) === JSON.stringify(${JSON.stringify(projects)}), 'requested project links');
    const socials = [...document.querySelectorAll('#tab-main .social-btn')].map(link => link.href);
    check(socials.includes('https://funpay.com/users/9685101/'), 'FunPay in bio');
    check(socials.includes('https://github.com/itai215'), 'personal GitHub preserved');
    check(socials.includes('https://steamcommunity.com/id/mastyrbist'), 'personal Steam preserved');
    check(!socials.some(url => url.includes('discord')), 'server invite moved out of bio');
    const skills = [...document.querySelectorAll('.skill-desc')].map(card => card.textContent);
    check(skills.length === 3 && skills[0] === 'disnake, Discordeno, JavaScript' && skills[1] === 'SQL, MongoDB, PostgreSQL', 'requested stack only');
    check(document.getElementById('audioTrack') && document.getElementById('playBtn'), 'music retained');
    for (const control of document.querySelectorAll('a, button, input, .progress-bar-wrap')) {
      check(getComputedStyle(control).webkitTapHighlightColor === 'rgba(0, 0, 0, 0)', 'no blue tap highlights');
    }
    tabs[0].focus();
    // Synthetic keys do not reliably activate Chromium's :focus-visible modality.
    check(document.activeElement === tabs[0], 'tab remains keyboard focusable');
    for (const tab of tabs) check(tab.getBoundingClientRect().height >= 44, '44px touch targets');
    check(document.documentElement.scrollWidth <= innerWidth, 'no horizontal overflow');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      check(getComputedStyle(document.querySelector('.tab-indicator')).transitionDuration === '0s', 'reduced motion transitions disabled');
      check(getComputedStyle(document.querySelector('.project-card')).animationName === 'none', 'reduced motion entrance disabled');
      check(getComputedStyle(document.querySelector('.bg-image')).animationName === 'none', 'reduced motion background stopped');
    }
    const fx = document.getElementById('effectsBtn');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    check(fx.getAttribute('aria-pressed') === String(!reduced), 'effects respect motion preference');
    if (!reduced) check(getComputedStyle(document.querySelector('.rain')).animationName === 'rainfall-back', 'rain animates');
    fx.click();
    check(document.body.classList.contains('effects-off') === !reduced, 'effects toggle updates scene');
    fx.click();
    document.body.dataset.test = 'PASS';
  } catch (error) { document.body.dataset.test = 'FAIL: ' + error.message; }
});
</script>`;
try {
  const file = path.join(dir, 'test.html');
  // Avoid external dependencies/network in a deterministic interaction test.
  fs.writeFileSync(file, html.replace(/<link[^>]*>/g, '').replace(/<source[^>]*>/g, '').replace(/<img[^>]*>/g, '').replace('</body>', checks + '</body>'));
  for (const [width, height] of [[375, 667], [375, 900], [1024, 900]]) for (const reduced of [false, true]) {
    const result = spawnSync(browser, ['--headless', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', `--window-size=${width},${height}`, ...(reduced ? ['--force-prefers-reduced-motion=reduce'] : []), '--dump-dom', '--virtual-time-budget=1000', 'file://' + file], { encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes('data-test="PASS"'), result.stdout.match(/data-test="[^"]*"/)?.[0] || result.stderr);
    console.log(`PASS ${width}px, reduced-motion=${reduced}: entry, keyboard, rapid tabs, links, touch targets, overflow`);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}