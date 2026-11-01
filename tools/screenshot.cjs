// Regenerates the game card screenshots shown on index.html.
//
// Usage: node tools/screenshot.cjs [output-dir]   (default: screenshots/)
// Needs puppeteer-core in .tools/ (run `make setup`) and the system Chrome (CHROME_PATH overrides).
//
// index.html shows the images ~300-450px wide and 180px tall (object-fit: cover), so every shot is a
// 2:1 clip of the page (between the phone and desktop card shapes), rendered 600px wide for retina.

const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../.tools/node_modules/puppeteer-core'));

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const REPO_ROOT = path.join(__dirname, '..');
const CARD_ASPECT = 2;
const OUTPUT_WIDTH_PX = 600;
const SETTLE_MS = 1500;

// viewport: page size the game is laid out in.
// focus:    element the clip is built around, grown by paddingPx on every side.
// cover:    true crops the 2:1 clip to the element's width (a big, legible detail of a tall game);
//           false keeps the whole element visible and lets the page background fill the sides.
// anchor:   with cover, which part of the element the crop starts at: 'top' or 'center'.
const GAMES = [
    { name: 'breakout', viewport: { width: 900, height: 700 }, focus: '#gameCanvas', paddingPx: 0, cover: true, anchor: 'top', playsBreakout: true },
    { name: 'minesweeper', viewport: { width: 700, height: 900 }, focus: '.window', paddingPx: 30, cover: true, anchor: 'top' },
    { name: 'snake', viewport: { width: 700, height: 900 }, focus: '.lcd', paddingPx: 90, cover: true, anchor: 'center' },
    { name: 'star-swarm', viewport: { width: 700, height: 900 }, focus: '#screen', paddingPx: 0, cover: true, anchor: 'top', playsStarSwarm: true },
    { name: 'sudoku', viewport: { width: 700, height: 900 }, focus: '#sudoku-board', paddingPx: 30, cover: true, anchor: 'top' },
];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function cardClip(page, game) {
    const clip = await page.evaluate((game, aspect) => {
        const box = document.querySelector(game.focus).getBoundingClientRect();
        const boxWidth = box.width + 2 * game.paddingPx;
        const boxHeight = box.height + 2 * game.paddingPx;
        const width = game.cover ? boxWidth : Math.max(boxWidth, boxHeight * aspect);
        const height = width / aspect;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const y = game.cover && game.anchor === 'top' ? box.y - game.paddingPx : centerY - height / 2;
        return { x: centerX - width / 2, y, width, height };
    }, game, CARD_ASPECT);
    return { ...clip, scale: OUTPUT_WIDTH_PX / clip.width };
}

// Breakout: launch the ball and keep the paddle under it for a few seconds, so the shot
// shows a live game with bricks broken and the ball trail.
async function playBreakout(page) {
    await page.click('#start-btn');
    await wait(500);
    await page.keyboard.press('ArrowUp');
    const canvas = await page.evaluate(() => {
        const box = gameCanvas.getBoundingClientRect();
        return { left: box.left, top: box.top, scale: box.width / gameCanvas.width };
    });
    for (let tick = 0; tick < 100; tick++) {
        const ballX = await page.evaluate(() => balls[0].x);
        await page.mouse.move(canvas.left + ballX * canvas.scale, canvas.top);
        await wait(40);
    }
}

// Star Swarm: start a run and fast-forward the simulation until the formation is complete and the
// first enemies dive, so the shot shows the formation, a diver and the player's ship.
async function playStarSwarm(page) {
    await page.click('#start-btn');
    await page.evaluate(() => {
        for (let i = 0; i < 2000 && !enemies.some(enemy => enemy.state === 'DIVING'); i++) tick();
        for (let i = 0; i < 40; i++) tick();
    });
    await wait(300);
}

async function main() {
    const outDir = path.resolve(process.argv[2] || path.join(REPO_ROOT, 'screenshots'));
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
    for (const game of GAMES) {
        const page = await browser.newPage();
        await page.setViewport(game.viewport);
        await page.goto('file://' + path.join(REPO_ROOT, 'games', game.name + '.html'), { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await wait(SETTLE_MS);
        if (game.playsBreakout) await playBreakout(page);
        if (game.playsStarSwarm) await playStarSwarm(page);

        const file = path.join(outDir, game.name + '.png');
        await page.screenshot({ path: file, clip: await cardClip(page, game) });
        console.log('wrote', file);
        await page.close();
    }
    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
