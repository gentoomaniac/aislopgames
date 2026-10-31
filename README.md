# 🕹️ AI SlopGames

AI Slop Games is a private, educational sandbox built to explore modern web development workflows. 

## 🎯 Project Intent & Scope
* **Vibe Coding & AI:** Experimenting with AI-assisted software development (vibe coding) to learn its practical processes, workflows, and current limitations.
* **Hosting Preparation:** Gaining hands-on experience with end-to-end static deployment, server management, and web infrastructure.
* **Just for Fun:** Building and playing classic, lightweight browser mini-games in a clean, single-file format.

This project is strictly non-commercial and serves purely as a personal learning environment.

## 🛠️ Development
`make` lists the helper targets. `make screenshots` regenerates the game card images in `screenshots/` with headless Chrome (installs puppeteer-core into `.tools/` on first run; `OUT=<dir>` writes elsewhere, `CHROME_PATH=<bin>` picks the browser).

`make dist` collects exactly the files to deploy into `dist/` (`DIST=<dir>` changes it) and checks that nothing referenced is missing; upload that folder.

## 📄 License
All games and source code in this repository are provided "as is" and released under the **MIT License**.

