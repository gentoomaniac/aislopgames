# AI SlopGames — Orchestrator Notes

This is the main instruction file for the orchestrating agent (the main Claude Code session).
Read [README.md](../README.md) for the project intent and [code-style.md](code-style.md)
for how code here is written and reviewed.

## Project in short

- A collection of small browser games, each one a **single, self-contained HTML file** in `games/`.
- Plain JavaScript, inline CSS and JS. No build step, no bundler, no package.json.
- Public CDN libraries are allowed (cdnjs, jsDelivr, unpkg, code.jquery.com, Google Fonts).
  Everything else (code, images, sounds) must be inline (data: URIs, canvas drawing, WebAudio),
  so a game file can be copied anywhere and still work.
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

## Integration criteria (all must hold)

- Reviewer verdict is `APPROVED` against the current task brief.
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

- `node` is available (use it for syntax checks); there is no headless browser installed,
  so runtime testing in a real browser is up to the user. Mention this in the report.
