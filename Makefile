# Developer helpers. Run `make` to list targets.

CHROME_PATH ?= /usr/bin/google-chrome-stable
OUT ?= screenshots
DIST ?= dist
PUPPETEER := .tools/node_modules/puppeteer-core

.PHONY: help setup screenshots dist

help:
	@echo "make setup        install puppeteer-core into .tools/ (git-ignored)"
	@echo "make screenshots  regenerate the index.html card screenshots"
	@echo "                  OUT=<dir> writes elsewhere (default: screenshots/)"
	@echo "                  CHROME_PATH=<bin> picks the Chrome binary"
	@echo "make dist         collect the files to deploy into dist/ (DIST=<dir> to change)"

setup: $(PUPPETEER)

$(PUPPETEER):
	mkdir -p .tools
	cd .tools && { [ -f package.json ] || echo '{"private": true}' > package.json; } && npm i puppeteer-core@24

screenshots: setup
	CHROME_PATH=$(CHROME_PATH) node tools/screenshot.cjs $(OUT)

# Everything the site serves, nothing else (no base.png, tools, docs, ...).
# Refuses to wipe a DIST that is empty, the repo root or a parent of it.
dist:
	@case "$(DIST)" in ""|.|..|/|"$(CURDIR)") echo "refusing DIST='$(DIST)'"; exit 1;; esac
	rm -rf "$(DIST)"
	mkdir -p "$(DIST)/games" "$(DIST)/screenshots"
	cp index.html logo.png divider.png LICENSE "$(DIST)/"
	cp games/*.html "$(DIST)/games/"
	cp screenshots/*.png "$(DIST)/screenshots/"
	node tools/check-dist.cjs "$(DIST)"
