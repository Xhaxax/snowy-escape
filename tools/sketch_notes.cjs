// Adds the handwriting to the sketch progression stills (run after build_sketch_stages.py, with
// the game served on :8123): the animal's name at the top of the page and a few field notes, one
// more line as the sketch comes along. Uses the game's own font so it matches the notebook.
//   NODE_PATH=$(npm root -g) node tools/sketch_notes.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const TRIPS = { fox: 4, hare: 3, deer: 4, elk: 5, bird: 3, owl: 6, bear: 7 };
const NOTES = {
  fox: ['Red fox', 'listens for mice', 'under the snow,', 'then pounces!'],
  hare: ['Snowshoe hare', 'white all winter', 'freezes, then bolts', 'huge hind feet'],
  deer: ['Deer', 'browses young pines', 'tail up = alarm', 'comes if I wait'],
  elk: ['Bull elk', 'bugles at dawn', 'paws for grass', 'the herd follows'],
  bird: ['Cardinal', 'rowan berries', 'pairs in winter', 'hides in storms'],
  owl: ['Great grey owl', 'hunts by ear', 'silent wings', 'night only'],
  bear: ['Grizzly bear', 'on the deer trail', 'keep your distance', 'dens in storms'],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8123/index.html');
  await p.waitForFunction(() => document.fonts && document.fonts.check('8px "Pixelify Sans"'), null, { timeout: 15000 });
  for (const [kind, n] of Object.entries(TRIPS)) {
    for (let k = 1; k <= n; k++) {
      const file = `assets/img/cut/sketch_${kind}_${k}.png`;
      const src = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
      const lines = NOTES[kind].slice(0, 1 + Math.ceil((NOTES[kind].length - 1) * k / n));
      const out = await p.evaluate(async ([src, lines]) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        // the page leans: write along its top edge
        x.save(); x.translate(100, 33); x.rotate(-0.2);
        x.fillStyle = 'rgba(70,60,56,0.92)'; x.textBaseline = 'top';
        x.font = '8px "Pixelify Sans"'; x.fillText(lines[0], 0, -6);
        x.fillRect(0, 3, Math.min(52, x.measureText(lines[0]).width), 1); // underlined
        x.font = '6px "Pixelify Sans"'; x.fillStyle = 'rgba(86,76,70,0.85)';
        lines.slice(1).forEach((t, i) => x.fillText(t, 1, 6 + i * 6));
        x.restore();
        // a tiny pixel-art canvas: keep only solid pixels so the text stays crisp, no grey smudge
        const d = x.getImageData(0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      }, [src, lines]);
      fs.writeFileSync(file, Buffer.from(out.split(',')[1], 'base64'));
    }
  }
  console.log('notes written');
  process.exit(0);
})();
