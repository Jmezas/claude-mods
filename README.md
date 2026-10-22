# claude-mods

A Claude Code plugin marketplace with two mods written for day-to-day work and a mirror of one third-party plugin, plus a script that installs the whole plugin set of this setup in one go.

## Plugins hosted here

| Plugin | What it does |
| --- | --- |
| `model-router` | Classifies each prompt as simple, medium or complex with a small model, then routes the turn to Haiku (low effort), Sonnet (medium effort) or the session model. Probes the configured models at session start and never routes to one that does not answer. `/router` shows state, `/router off`, `/router simple|medium|complex`, `/router auto`, `/router probe`. |
| `task-timer` | Stopwatch for turns and named tasks. Live elapsed time and tool count above the prompt, `/timer` pane with per-turn duration, tools, model and tokens, `/timer start <name>` and `/timer stop` for tasks that span several turns. |
| `thermos` | Mirror of [Cursor's Thermos plugin](https://github.com/cursor/plugins/tree/main/thermos) (MIT) packaged for Claude Code: `/thermos`, `/thermo-nuclear-review`, `/thermo-nuclear-code-quality-review` and their two review subagents, with `disable-model-invocation` removed so the skills can fire on their own. |

Each plugin folder has its own README.

## Install everything with one command

Requires Claude Code and a GitHub credential that can read this repository (`gh auth login`, then `gh auth setup-git`).

```bash
gh repo clone OWNER/claude-mods && ./claude-mods/install.sh
```

Without cloning:

```bash
bash <(gh api repos/OWNER/claude-mods/contents/install.sh -H 'Accept: application/vnd.github.raw')
```

The script adds the marketplaces and installs, at the user scope, the three plugins above and the third-party plugins this setup uses: `antislop@anti-slop`, `caveman@caveman`, `mattpocock-skills@claude-plugins-official`, `frontend-design@claude-plugins-official`, `postman@claude-plugins-official`. Anything already installed is skipped, so the script can be run again after a change.

## Install one plugin

At the prompt of a terminal session:

```text
/plugin install model-router --marketplace OWNER/claude-mods
```

From a shell:

```bash
claude plugin install model-router --marketplace OWNER/claude-mods
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `OWNER/claude-mods`, then Add plugin.

Answer `y` to `Add marketplace?`, then pick the user scope. Replace `model-router` with `task-timer` or `thermos` for the others. A private repository installs only for people who can read it on GitHub and whose machine already holds a git credential for github.com; the install never prompts for one.

## Update

After a change is pushed here:

```bash
claude plugin marketplace update claude-mods
claude plugin update model-router@claude-mods
```

Then `/reload-plugins` in an open session, or start a new one.
