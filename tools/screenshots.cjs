// Playwright smoke test + screenshot tour.
// usage: NODE_PATH=$(npm root -g) node tools/screenshots.cjs [baseUrl] [outDir]
const { chromium } = require('playwright');
const fs = require('fs');

const base = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const out = process.argv[3] || 'screenshots';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 816 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base);
  await page.waitForFunction(() => window.SE && SE.sceneName === 'title', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const shot = async (name, wait = 1200) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };
  const go = (name, params) => page.evaluate(([n, p]) => { SE.fade.a = 0; SE.switchNow(n, p); SE.idleTime = 0; }, [name, params || {}]);
  const tour = process.env.TOUR ? process.env.TOUR.split(',') : null;
  const want = (n) => !tour || tour.includes(n);

  if (want('title')) await shot('01_title', 1500);
  if (want('cabin')) { await go('cabin'); await shot('02_cabin_room'); }
  if (want('couch')) { await go('cabin', { mode: 'couch' }); await shot('03_cabin_couch', 2000); }
  if (want('map')) { await go('map'); await shot('04_map'); }
  if (want('travel')) { await go('travel', { from: 'cabin', to: 'lake', dist: 2200 }); await shot('05_travel', 3000); }
  if (want('lake')) { await go('lake'); await shot('06_lake', 2000); }
  if (want('forest')) { await go('forest'); await page.evaluate(() => { SE.idleTime = 0; }); await shot('07_forest', 9000); }
  if (want('summit')) { await go('summit'); await shot('08_summit', 2000); }
  if (want('kitchen')) { await go('kitchen'); await shot('09_kitchen'); }
  if (want('yard')) { await go('yard', { mode: 'chop' }); await shot('10_yard_chop', 2000); }
  if (want('night')) {
    await page.evaluate(() => { SE.save.settings.time = 'night'; });
    await go('lake'); await shot('11_lake_night', 1500);
    await go('yard'); await shot('12_yard_night', 1500);
    await page.evaluate(() => { SE.save.settings.time = 'cycle'; });
  }
  if (want('storm')) {
    await page.evaluate(() => { SE.save.settings.weather = 'storm'; SE.weather.set('storm', true); });
    await go('cabin'); await shot('13_cabin_storm', 4000);
    await page.evaluate(() => { SE.save.settings.weather = 'auto'; SE.weather.set('calm', true); });
  }
  if (want('watch')) {
    await page.evaluate(() => { SE.save.settings.watch = true; SE.addFish('Arctic Char'); SE.save.stove = 1; });
    await go('kitchen'); await shot('14_kitchen_watch', 9000);
    await go('lake'); await shot('15_lake_watch', 16000);
    await page.evaluate(() => { SE.save.settings.watch = false; });
  }
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})();
