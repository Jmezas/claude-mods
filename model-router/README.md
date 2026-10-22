# model-router

Routes each prompt to a model tier so simple requests do not spend the tokens of a large model.

Before every user prompt, a small classifier model (Haiku by default) labels the prompt as `simple`, `medium` or `complex`, or `same` to keep the previous tier for a short follow-up. The turn's requests are then sent to the configured model for that tier: Haiku with low effort for simple prompts, Sonnet with medium effort for medium prompts, and the session's own model for complex prompts. Subagents are never rerouted.

## Install

At the prompt of a terminal session:

```text
/plugin install model-router --marketplace OWNER/claude-mods
```

From a shell: `claude plugin install model-router --marketplace OWNER/claude-mods`. Answer `y` to `Add marketplace?`, then pick the user scope.

## Commands

- `/router` shows the current state, the tier mapping and the last decision.
- `/router on` and `/router off` enable or disable routing.
- `/router simple|medium|complex` forces every prompt to one tier.
- `/router auto` returns to the classifier.

## Configuration

`simpleModel`, `mediumModel`, `complexModel` (empty keeps the session model) and `classifierModel` are set in `/config` or under `pluginConfigs.model-router.options` in settings.

## Caveats

Switching models between turns invalidates the prompt cache of the previous model, so a long conversation that alternates tiers pays some cache rewrites. The classifier adds one small request before each prompt.
