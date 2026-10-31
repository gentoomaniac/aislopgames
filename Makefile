# Developer helpers. Run `make` to list targets.

CHROME_PATH ?= /usr/bin/google-chrome-stable
OUT ?= screenshots
PUPPETEER := .tools/node_modules/puppeteer-core

.PHONY: help setup screenshots

help:
	@echo "make setup        install puppeteer-core into .tools/ (git-ignored)"
	@echo "make screenshots  regenerate the index.html card screenshots"
	@echo "                  OUT=<dir> writes elsewhere (default: screenshots/)"
	@echo "                  CHROME_PATH=<bin> picks the Chrome binary"

setup: $(PUPPETEER)

$(PUPPETEER):
	mkdir -p .tools
	cd .tools && { [ -f package.json ] || echo '{"private": true}' > package.json; } && npm i puppeteer-core@24

screenshots: setup
	CHROME_PATH=$(CHROME_PATH) node tools/screenshot.cjs $(OUT)
