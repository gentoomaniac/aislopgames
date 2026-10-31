// Loads a page in headless Chrome, reports console errors, uncaught exceptions and failed
// requests, and saves a screenshot. Optional actions simulate play.
//
// Usage: node .claude/tools/check-page.cjs <html-file> [screenshot.png] [actions.json]
//   actions.json: [{"key":"ArrowUp"}, {"click":[x,y]}, {"tap":[x,y]}, {"wait":500}, {"eval":"js expr"}]
// Exit code 1 if any error was seen.
//
// Setup (once, git-ignored): cd .tools && npm i puppeteer-core@24
// Uses the system Chrome, so no browser download is needed.

const path = require('path');
const puppeteer = require(path.join(__dirname, '../../.tools/node_modules/puppeteer-core'));

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const SETTLE_MS = 1500;

async function main() {
    const [htmlFile, screenshotFile, actionsFile] = process.argv.slice(2);
    if (!htmlFile) {
        console.error('usage: check-page.cjs <html-file> [screenshot.png] [actions.json]');
        process.exit(2);
    }
    const actions = actionsFile ? require(path.resolve(actionsFile)) : [];

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 900 });

    const problems = [];
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warn') {
            problems.push(`console.${msg.type()}: ${msg.text()}`);
        }
    });
    page.on('pageerror', err => problems.push(`uncaught: ${err.message}`));
    page.on('requestfailed', req => problems.push(`request failed: ${req.url()} (${req.failure().errorText})`));

    await page.goto('file://' + path.resolve(htmlFile), { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));

    for (const action of actions) {
        if (action.key) await page.keyboard.press(action.key);
        if (action.click) await page.mouse.click(...action.click);
        if (action.tap) await page.touchscreen.tap(...action.tap);
        if (action.wait) await new Promise(resolve => setTimeout(resolve, action.wait));
        if (action.eval) console.log('eval:', JSON.stringify(await page.evaluate(action.eval)));
    }

    if (screenshotFile) await page.screenshot({ path: screenshotFile });
    await browser.close();

    console.log(problems.length ? problems.join('\n') : 'no errors');
    process.exitCode = problems.length ? 1 : 0;
}

main().catch(err => {
    console.error(err);
    process.exit(2);
});
