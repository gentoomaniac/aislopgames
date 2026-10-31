# Code Style

Applies to everyone writing or reviewing code here. The audience of the code is a human
reading it later, not the machine.

## Principles

The Zen of Python (`import this`) is the guiding text, also for JavaScript:

- Beautiful is better than ugly. Readability counts.
- Explicit is better than implicit.
- Simple is better than complex. Complex is better than complicated.
- Flat is better than nested. Sparse is better than dense.
- Errors should never pass silently, unless explicitly silenced.
- There should be one obvious way to do it.
- If the implementation is hard to explain, it's a bad idea.

## Naming

Naming matters more than anything else in this file.

- Names say what a thing is or does in the game's terms: `lockedCells`, `spawnPowerUp()`,
  `isGameOver`. Not `data`, `tmp`, `arr2`, `handle()`, `doStuff()`.
- Booleans read as questions: `isPaused`, `hasNotes`, `canMove`.
- Functions are verbs, values are nouns.
- Units go in the name when they're ambiguous: `delayMs`, `speedPxPerFrame`.
- Short names only for tiny scopes (`i`, `x`, `y` in a loop).
- Rename freely if a better name comes up. A wrong name is a bug waiting to happen.

## Comments

- Comments explain **why**: intent, decisions, trade-offs, browser quirks, non-obvious
  constraints. Never what the code does line by line.
- If a human can't follow the code without a comment, refactor first (better names,
  extract a well-named function, simpler flow). A comment is the last resort, for complexity
  that's inherent to the problem (e.g. collision math, a puzzle-generation algorithm).
- No commented-out code, no changelog comments. Git has the history.

## Simplicity

- **KISS.** Choose the simplest solution that works. No speculative features, options or
  abstraction layers "for later".
- **DRY only when it pays.** Extract shared code when the duplicates really are the same
  concept and will change together. Don't couple unrelated parts of the code because they
  happen to look alike today. A little duplication is cheaper than the wrong abstraction.
- **Don't follow "Clean Code" (Uncle Bob) dogma.** No splitting into dozens of tiny
  functions you have to jump between, no class per concept, no indirection for its own sake.
  A 40-line function that reads top to bottom beats eight 4-line ones scattered across the file.
  Split when a piece has its own clear name and purpose, not to meet a line count.
- Prefer plain data and functions. Use classes only when state plus behaviour clearly
  belong together (e.g. a `Ball` in Breakout).

## Formatting

Formatting matters. Code is read far more often than written.

- Consistent formatting within a file: indentation, quotes, semicolons, brace style.
  Match what's already there.
- Group related code into sections (state, rendering, input, persistence, …) in an
  order that reads top-down.
- Whitespace separates ideas: blank lines between logical blocks, not random ones.
- Keep lines a readable length. Break long expressions at meaningful points.
- Magic numbers become named constants at the top of the section, unless they're obvious
  (`0`, `1`, `2` for halving, …).
