# claude-mods

Un marketplace de plugins para Claude Code con mods y skills de uso diario, un espejo de un plugin de terceros y un script que instala todo el conjunto de este entorno con un solo comando.

Regla de todo el conjunto: Claude no hace commit, push, tag ni ningún otro cambio de historial por su cuenta. Eso lo hace el usuario cuando lo pide; `guard-rails` lo garantiza.

## Plugins alojados aquí

| Plugin | Qué hace |
| --- | --- |
| `model-router` | Clasifica cada prompt como simple, medium o complex con un modelo pequeño y envía el turno a Haiku (esfuerzo bajo), Sonnet (esfuerzo medio) o al modelo de la sesión. Sondea los modelos configurados al iniciar la sesión y nunca enruta a uno que no responde. `/router` muestra el estado; `/router off`, `/router simple|medium|complex`, `/router auto` y `/router probe` lo controlan. |
| `task-timer` | Cronómetro de turnos y tareas con nombre. Tiempo transcurrido y número de herramientas en vivo encima del prompt, panel `/timer` con duración, herramientas, modelo y tokens por turno, y `/timer start <nombre>` / `/timer stop` para tareas que abarcan varios turnos. |
| `thermos` | Espejo del [plugin Thermos de Cursor](https://github.com/cursor/plugins/tree/main/thermos) (MIT) adaptado a Claude Code: `/thermos`, `/thermo-nuclear-review`, `/thermo-nuclear-code-quality-review` y sus dos subagentes de revisión, con `disable-model-invocation` quitado para que las skills se activen solas. |
| `reverse-engineer-anything` | La skill `reverse-engineer-anything` empaquetada como plugin. Requiere configurar aparte el servidor MCP de REA. |
| `guard-rails` | Bloquea lo que Claude no debe hacer por su cuenta en sesiones con `--dangerously-skip-permissions`: commit, push y otras escrituras de git que el mensaje del usuario no pidió, `rm -r` fuera del repo, edición de `.env` y claves, `kubectl`/`helm` en producción, `DROP`/`TRUNCATE`. Añade al prompt del sistema una regla de alcance estricto: solo lo que el mensaje pide, sin código extra. `/guard`, `/guard allow`, `/guard off`. |
| `cost-budget` | Coste en USD y tokens por turno, sesión, día y proyecto, con presupuesto diario y aviso al superarlo. `/budget`, `/budget proyectos`, `/budget dias`, `/budget set <usd>`. |
| `release-notes` | `/release` escribe la sección de `CHANGELOG.md` en español desde los commits (última etiqueta o referencia dada), agrupada por tipo. Nunca hace commit, tag ni push. |
| `api-contract` | `/api-contract` lee los controladores NestJS cambiados, actualiza la colección Postman del repo y genera pruebas e2e con supertest. No hace commit. |

Cada carpeta de plugin tiene su propio README.

## Plugins instalados desde su origen

`install.sh` también instala estos desde sus marketplaces originales, así que no se copian aquí: `antislop@anti-slop` (6 skills), `caveman@caveman`, `mattpocock-skills@claude-plugins-official`, `frontend-design@claude-plugins-official` y `postman@claude-plugins-official`. Las skills que claude.ai sincroniza en `~/.claude/skills/synced/` (docs, pdf, xlsx, pptx, deep-research, etc.) dependen de tu cuenta y no forman parte de este repositorio.

## Instalar todo con un comando

Requiere Claude Code y una credencial de GitHub que pueda leer este repositorio (`gh auth login`, luego `gh auth setup-git`).

```bash
gh repo clone Jmezas/claude-mods && ./claude-mods/install.sh
```

Sin clonar:

```bash
bash <(gh api repos/Jmezas/claude-mods/contents/install.sh -H 'Accept: application/vnd.github.raw')
```

El script añade los marketplaces e instala, a nivel de usuario, los ocho plugins de arriba y los plugins de terceros que usa este entorno. Lo que ya esté instalado se omite, así que puedes volver a ejecutarlo tras un cambio.

## Instalar un plugin

En el prompt de una sesión de terminal:

```text
/plugin install model-router --marketplace Jmezas/claude-mods
```

Desde una shell:

```bash
claude plugin install model-router --marketplace Jmezas/claude-mods
```

En la app de escritorio, donde `/plugin` no funciona: pulsa + junto al cuadro de prompt, luego Plugins, Añadir marketplace con `Jmezas/claude-mods` y después Añadir plugin.

Responde `y` a `Add marketplace?` y elige el ámbito de usuario. Cambia `model-router` por `task-timer`, `thermos`, `reverse-engineer-anything`, `guard-rails`, `cost-budget`, `release-notes` o `api-contract` para instalar los demás. Un repositorio privado solo se instala para quien pueda leerlo en GitHub y tenga ya una credencial de git para github.com en su equipo; la instalación nunca pide una.

## Actualizar

Tras subir un cambio a este repositorio:

```bash
claude plugin marketplace update claude-mods
claude plugin update model-router@claude-mods
```

Después ejecuta `/reload-plugins` en una sesión abierta, o inicia una nueva.
