# AI SlopGames — Orchestrator Notes

This is the main instruction file for the orchestrating agent (the main Claude Code session).
Read [README.md](../README.md) for the project intent and [code-style.md](code-style.md)
for how code here is written and reviewed.

## Project in short

- A collection of small browser games, each one a **single, self-contained HTML file** in `games/`.
- Plain JavaScript, inline CSS and JS. No build step, no bundler, no package.json.
- Public CDN libraries are allowed (cdnjs, jsDelivr, unpkg, code.jquery.com, Google Fonts).
  Fewer dependencies is better: prefer plain JS/CSS and browser built-ins (e.g.
  `<input type="color">`, `<dialog>`) over a library. **No unmaintained dependencies.**
  Every CDN script/stylesheet is pinned to an exact version **and** carries a Subresource
  Integrity hash (`integrity="sha384-…" crossorigin="anonymous"`). Exception: Google Fonts CSS
  is generated per browser and can't be hashed.
  Everything else (code, images, sounds) must be inline (data: URIs, canvas drawing, WebAudio),
  so a game file can be copied anywhere and still work.

## Game conventions (owner decisions, apply to every game)

- **Auto-pause:** every game that runs in real time, including games with a running time
  counter (e.g. the Minesweeper clock), pauses when the tab is hidden or the window loses
  focus, and only resumes on an explicit player action. Elapsed time while paused doesn't count.
- **Confirm before losing something:** any action that drops data (e.g. an unsaved high score)
  or ends a running game asks for confirmation first, with an in-page dialog styled like the
  game. No blocking `alert`/`confirm`/`prompt`.
- **Physics are the rules:** e.g. Breakout lasers pass through the gaps between bricks. That's
  how the game works; don't "fix" it.
- **Saved data (high scores, settings, saved games)** — lessons from the first review round:
  - Read from `localStorage` on every access, so two open tabs don't overwrite each other.
    Keep an in-memory copy only as the fallback when storage is blocked or a write failed.
  - Validate per entry: drop only malformed entries, never a whole table because one entry is bad.
  - Never write on read (migrations of legacy keys excepted). Only an actual save writes.
  - All storage access in try/catch; the game stays playable without storage.
  - Render stored strings with `textContent`, never `innerHTML`.
- **Pinch zoom stays possible:** no `user-scalable=no`/`maximum-scale=1`; lock touch gestures
  only on the play area.
- **Polish without complexity:** small visual fixes are welcome when they're simple; if a fix
  needs extra machinery, leave it.

## We don't break userspace

No regressions. Players are the userspace: anything that works for them today must keep
working after a change. That includes controls (keyboard, mouse, touch), game rules and
difficulty, settings, saved games and high scores in `localStorage`, and links into the
game files. A change that fixes one thing but breaks another isn't integrated. If breaking
something is truly unavoidable (e.g. a saved-state format change), it needs a migration,
or the user's explicit OK before it lands.
- `index.html` is the landing page: lists every game as a card (screenshot from `screenshots/`)
  and explains the project intent. It may reference local assets (`logo.png`, `screenshots/`).
- Persistent settings/state go in `localStorage` under a key unique to the game.
- Static hosting only, no backend. License: MIT.
- Commit message style: `<Game>: <short description>` (e.g. `Sudoku: notes feature`);
  repo-wide changes use a plain description.

## Roles

| Role | Who | Definition |
|------|-----|------------|
| Orchestrator | main session (you) | this file |
| Developer | subagent `developer` (Sonnet) | [agents/developer.md](agents/developer.md) |
| Reviewer | subagent `reviewer` (Sonnet) | [agents/reviewer.md](agents/reviewer.md) |

## Workflow

1. **Plan.** Break the user's request into tasks that touch as few shared files as possible.
   One task per game is the natural unit. Changes to `index.html` (new card, wording) are
   best done by the orchestrator during integration, to avoid merge conflicts between
   parallel developers.
2. **Delegate.** Spawn one `developer` per task with `isolation: "worktree"`, so each works
   in its own git worktree and branch. Independent tasks run in parallel (single message,
   multiple Agent calls). The brief must contain: goal, target file(s), acceptance criteria,
   and anything already known or ruled out. Developers commit on their branch; they never
   push and never touch `main`.
3. **Review.** For each finished developer branch, spawn a `reviewer` with the branch name
   and the original task brief. Give it the task, not the developer's summary, so the
   review is not anchored on the developer's claims.
4. **Iterate.** If the reviewer returns `CHANGES REQUIRED`, send the findings back to the same
   developer (SendMessage) and re-review. Stop after 3 rounds and ask the user.
5. **Integrate.** Only on `APPROVED`:
   - rebase the branch onto current `main` (or merge if a rebase is messy), resolve conflicts,
   - make the orchestrator-owned edits (e.g. `index.html` card for a new game),
   - fast-forward `main`, push, then remove the worktree and branch.
6. **Report** to the user what landed, what was rejected, and what needs their input
   (e.g. a new screenshot, which needs a real browser).

## `main` is production

The owner deploys `main` to the server manually, at any time. So `main` must always be
in a runnable, shippable state:

- Only reviewed, complete work lands on `main`. No work-in-progress, no half-finished
  features, no "fix in the next commit".
- Check the merged result, not just the branch: after rebasing onto `main`, run
  `.claude/tools/check-all.sh <worktree>` (syntax check + browser check of `index.html` and
  every game) and only fast-forward if it passes.
- Every commit on `main` should be runnable on its own (developers commit in working steps).
- Nothing secret or private ever goes into the repo (e.g. `deploy_key` stays git-ignored).
- If something broken does reach `main`, fix it forward right away (revert commit or fix),
  never by rewriting history, and tell the owner so they don't deploy it.

## Integration criteria (all must hold)

- Reviewer verdict is `APPROVED` against the current task brief.
- No regressions (see "We don't break userspace"); the game loads without console errors
  in the browser check.
- Game files are still single-file and self-contained (see reviewer checklist).
- Inline scripts pass a syntax check (see reviewer for the command).
- Rebased cleanly on `main`; no unrelated changes slipped in.
- New game → card in `index.html`; a screenshot in `screenshots/` is requested from the user
  if none could be made.

## Git / push access

- Remote: `git@github.com:gentoomaniac/aislopgames.git`, branch `main`.
- Use the repo's write deploy key directly. Shell env doesn't persist between Bash calls,
  so prefix every remote git command:
  `GIT_SSH_COMMAND="ssh -i /home/marco/git-private/slopdoku/deploy_key -o IdentitiesOnly=yes" git push origin main`
  (absolute path, so it also works from inside a worktree).
- The private key `deploy_key` in the repo root is git-ignored and must never be committed.
- The user has authorised the orchestrator to push approved work to `main` without asking
  each time.

### Never force-push

- **Never force-push, to any branch, under any circumstances, even if the user asks.**
  This includes `--force`, `-f`, `--force-with-lease` and `+refspec`.
- Never rewrite published history. Fix mistakes with new commits (`git revert`, follow-up fix).
- If a situation really seems to need a force push, stop and ask the user to do it themselves.
- Rebasing a developer branch locally before merging is fine as long as that branch was
  never pushed.
- `.claude/settings.json` denies force-push commands as a safety net; don't work around it.

## Environment notes

- `node` is available (use it for syntax checks).
- Headless Chrome: `/usr/bin/google-chrome-stable`, driven by `puppeteer-core` installed in the
  git-ignored `.tools/` folder (`cd .tools && npm i puppeteer-core@24` if missing).
  `node .claude/tools/check-page.cjs <game.html> [shot.png] [actions.json]` loads a page,
  reports console errors, uncaught exceptions and failed requests, and saves a screenshot.
  Agents can write their own throwaway puppeteer scripts (outside the repo) for deeper play-tests.
- Scratch files: every agent uses its own directory, `/tmp/claude-1000/<role>-<game>/`
  (e.g. `/tmp/claude-1000/dev-snake/`), never a shared one. Parallel agents overwrote
  each other's test scripts once. Say the directory in every brief.
  Fine feel (game speed, touch on a real phone) still needs a human; mention it in the report.

## Audits

For a review of existing code (no diff), spawn a `reviewer` in audit mode on a game file.
Triage the findings, then turn the ones worth fixing into developer tasks through the normal
workflow. Bigger or risky changes go to the user first.
