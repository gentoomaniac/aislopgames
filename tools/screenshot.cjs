// Regenerates the game card screenshots shown on index.html.
//
// Usage: node tools/screenshot.cjs [output-dir]   (default: screenshots/)
// Needs puppeteer-core in .tools/ (run `make setup`) and the system Chrome (CHROME_PATH overrides).
//
// index.html shows the images 5:3 (object-fit: cover). Games are shot as they open (menu or fresh
// board), except where START_BUTTON says otherwise.

const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../.tools/node_modules/puppeteer-core'));

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const REPO_ROOT = path.join(__dirname, '..');
const DEVICE_SCALE = 2; // sharp on retina screens, the card is only ~300px wide
const SETTLE_MS = 1500;

// Every game is shot in a 5:3 viewport, so the whole screenshot is exactly what the card
// shows. Games scale or reflow to fit; short viewports are what small laptops see too.
const VIEWPORT = { width: 900, height: 540, deviceScaleFactor: DEVICE_SCALE };
const GAME_NAMES = ['breakout', 'minesweeper', 'snake', 'sudoku'];

// Breakout's menu is just text; a started level, with the ball waiting on the paddle, shows the bricks.
const START_BUTTON = { breakout: '#start-btn' };

async function main() {
    const outDir = path.resolve(process.argv[2] || path.join(REPO_ROOT, 'screenshots'));
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
    for (const name of GAME_NAMES) {
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);
        await page.goto('file://' + path.join(REPO_ROOT, 'games', name + '.html'), { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await new Promise(resolve => setTimeout(resolve, SETTLE_MS));

        if (START_BUTTON[name]) {
            await page.click(START_BUTTON[name]);
            await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
        }

        const file = path.join(outDir, name + '.png');
        await page.screenshot({ path: file });
        console.log('wrote', file);
        await page.close();
    }
    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
