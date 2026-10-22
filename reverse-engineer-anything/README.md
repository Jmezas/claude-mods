# reverse-engineer-anything

La skill `reverse-engineer-anything`, movida de `~/.claude/skills/` a un plugin para que se instale junto con el resto de este conjunto.

La skill guía la ingeniería inversa de objetivos nativos, gestionados, Electron y JavaScript, empaquetados, firmware y navegador, mediante las herramientas del servidor MCP de REA (`mcp__rea__*`). Sin ese servidor no hace nada: configura `rea` como servidor MCP en Claude Code antes de usarla.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install reverse-engineer-anything --marketplace Jmezas/claude-mods
```

Desde una shell: `claude plugin install reverse-engineer-anything --marketplace Jmezas/claude-mods`.

Si la misma skill sigue en `~/.claude/skills/reverse-engineer-anything`, elimina esa carpeta tras instalar el plugin para que no aparezca dos veces.
