# model-router

Envía cada turno al modelo adecuado según la dificultad de la tarea, para que las peticiones simples no gasten los tokens de un modelo grande.

Antes de cada prompt, un modelo pequeño de clasificación (Haiku por defecto) lo etiqueta como `simple`, `medium` o `complex`, o como `same` para mantener el nivel anterior en una continuación corta. Las peticiones del turno se envían después al modelo configurado para ese nivel: Haiku para prompts simples (saludos, confirmaciones, recordar lo ya dicho en el chat), Sonnet con esfuerzo medio para tareas sencillas, y el modelo de la sesión para código complejo, análisis y razonamiento. Solo lo simple va al modelo barato; código, análisis y razonamiento nunca. Si un turno simple llega a un paso con herramientas, los pasos siguientes suben al nivel medio. Los subagentes nunca se reenrutan.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install model-router --marketplace Jmezas/claude-mods
```

Desde una shell: `claude plugin install model-router --marketplace Jmezas/claude-mods`. Responde `y` a `Add marketplace?` y elige el ámbito de usuario.

## Comandos

- `/router` muestra el estado, el mapa de niveles, los modelos inutilizables y la última decisión.
- `/router on` y `/router off` activan o desactivan el enrutado.
- `/router simple|medium|complex` fuerza todos los prompts a un nivel.
- `/router auto` vuelve al clasificador.
- `/router log` muestra las últimas 20 decisiones con el prompt recortado.
- `/router probe` vuelve a sondear los modelos configurados.

## Configuración

`simpleModel`, `mediumModel`, `complexModel` (vacío mantiene el modelo de la sesión) y `classifierModel` se definen en `/config` o en `pluginConfigs.model-router.options` de la configuración. Los alias `haiku`, `sonnet`, `opus` y `fable` se resuelven a ids completos; un id completo se usa tal cual.

## Cadena de respaldo

Cada nivel es una cadena que termina en el modelo de la sesión. Simple prueba el modelo simple, luego el medio y después el modelo de la sesión; medium prueba Sonnet y después el modelo de la sesión.

Al iniciar la sesión, cada modelo configurado recibe una petición de un token. Un modelo que no responde se omite. Si un modelo no da respuesta durante un turno, el router lo marca como inutilizable, muestra un aviso y reenvía la misma petición al siguiente modelo de la cadena. El turno continúa sin que nadie ejecute `/model`.

## Advertencias

Cambiar de modelo entre turnos invalida la caché de prompts del modelo anterior, así que una conversación larga que alterna niveles paga algunas reescrituras de caché. El clasificador añade una petición pequeña antes de cada prompt.
