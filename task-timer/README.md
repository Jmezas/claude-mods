# task-timer

A stopwatch for Claude Code turns and named tasks.

While a turn runs, the band above the prompt and the status line show the elapsed time and the number of tool calls. When the turn ends, the band shows its duration, tool count and the model that answered. The `/timer` pane lists every turn of the session with duration, tools, model and the prompt it answered, plus session totals.

Named tasks span several turns: `/timer start <name>` opens a task, each turn adds its active time, and `/timer stop` closes it and reports wall time, active time and turns. Finished tasks persist across sessions.

## Install

At the prompt of a terminal session:

```text
/plugin install task-timer --marketplace OWNER/claude-mods
```

From a shell: `claude plugin install task-timer --marketplace OWNER/claude-mods`. Answer `y` to `Add marketplace?`, then pick the user scope.

## Commands

- `/timer` opens the pane.
- `/timer start <name>` starts a named task.
- `/timer stop` ends the running task.
- `/timer hide` and `/timer show` toggle the band above the prompt.
- `/timer reset` clears the session history and the stored tasks.
