# cost-budget

Cuánto cuesta cada turno, la sesión, el día y cada proyecto, con un presupuesto diario y aviso al superarlo.

Después de cada turno la línea de estado muestra `coste: turno $0.012 · sesión $0.48 · hoy $3.10 / $10.00`. El coste en USD sale del mismo contador que `/cost`; los tokens de entrada, caché y salida se suman por turno. Los totales por día (últimos 90) y por proyecto (carpeta raíz de la sesión) persisten entre sesiones. Si el host no informa coste en USD, se muestran solo tokens.

Al pasar el presupuesto diario aparece un aviso, y otro cada vez que el gasto crece otro 50 % del presupuesto.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install cost-budget --marketplace Jmezas/claude-mods
```

## Comandos

- `/budget` resumen: sesión, hoy, mes y proyecto actual.
- `/budget proyectos` los 15 proyectos con más gasto.
- `/budget dias` últimos 14 días.
- `/budget set 5` presupuesto diario de 5 USD. También en `/config`, campo Presupuesto diario.
- `/budget reset` borra el historial de días y proyectos.
