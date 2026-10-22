# task-timer

Cronómetro para turnos y tareas con nombre en Claude Code.

Mientras un turno se ejecuta, la banda encima del prompt y la línea de estado muestran el tiempo transcurrido y el número de herramientas usadas. Al terminar el turno, la banda muestra su duración, el número de herramientas y el modelo que respondió. El panel `/timer` lista cada turno de la sesión con duración, herramientas, modelo y el prompt al que respondió, además de los totales de la sesión.

Las tareas con nombre abarcan varios turnos: `/timer start <nombre>` abre una tarea, cada turno suma su tiempo activo, y `/timer stop` la cierra e informa del tiempo de reloj, el tiempo activo y el número de turnos. Las tareas terminadas persisten entre sesiones.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install task-timer --marketplace Jmezas/claude-mods
```

Desde una shell: `claude plugin install task-timer --marketplace Jmezas/claude-mods`. Responde `y` a `Add marketplace?` y elige el ámbito de usuario.

## Comandos

- `/timer` abre el panel.
- `/timer start <nombre>` inicia una tarea con nombre.
- `/timer stop` termina la tarea en curso.
- `/timer hide` y `/timer show` alternan la banda encima del prompt.
- `/timer reset` borra el historial de la sesión y las tareas guardadas.
