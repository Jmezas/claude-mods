# guard-rails

Barreras para sesiones que corren con `--dangerously-skip-permissions`: bloquea las acciones que Claude no debe ejecutar por su cuenta y deja pasar las que el usuario pidió en su mensaje.

La comprobación se hace sobre el texto del mensaje del usuario que inició el turno, nunca sobre lo que el modelo escribe, así que el modelo no puede convencerse a sí mismo de que tenía permiso. Una acción bloqueada devuelve al modelo una explicación y la instrucción de dejar el trabajo preparado para que el usuario la ejecute.

## Reglas

| Regla | Qué bloquea | Pasa cuando |
| --- | --- | --- |
| `git-write` | `git commit`, `push`, `merge`, `tag`, `revert`, `cherry-pick`, `restore`, `clean`, borrar ramas | el mensaje del usuario pide esa acción (commit, push, sube, mergea, tag, publica...) |
| `git-history` | `reset --hard`, `rebase`, `clean -f`, `checkout --`, `stash drop` | el mensaje pide descartar, resetear o limpiar |
| `git-force` | `push --force`, `-f`, `--force-with-lease`, `push +rama` | solo con `/guard allow` |
| `rm-outside` | `rm -r` sobre `/`, `~`, `$HOME`, `..` o `*` | solo con `/guard allow` |
| `disk` | `mkfs`, `dd if=`, escritura en `/dev/sd*`, `chmod -R 777 /`, `diskutil erase` | solo con `/guard allow` |
| `k8s-prod` | `kubectl`, `helm` u `oc` que cambian algo con `prod` en el comando o el contexto | el mensaje menciona prod |
| `sql-drop` | `DROP TABLE/DATABASE/SCHEMA`, `TRUNCATE`, `DELETE FROM` sin `WHERE` | el mensaje pide drop, truncate o vaciar |
| `secret-file` | `Edit` o `Write` sobre `.env*` (menos `.env.example`), claves `.pem`, `.key`, `id_rsa`, `credentials.json` | el mensaje nombra el archivo |

`git add` y `git status` nunca se bloquean. Los subagentes pasan por las mismas reglas.

## Alcance estricto

Con guard-rails activo, cada prompt del sistema lleva una sección `guard-rails:scope` que obliga al modelo a hacer solo lo que el mensaje pide: sin código, archivos, funciones, tests, comentarios, refactorizaciones, manejo de errores ni dependencias que nadie pidió, y sin tocar código que funciona fuera de la petición. Si detecta algo que convendría cambiar, lo dice en una línea y no lo toca. Entre una versión mínima y una amplia, entrega la mínima. `/guard off` quita la sección junto con las reglas.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install guard-rails --marketplace Jmezas/claude-mods
```

## Comandos

- `/guard` estado, reglas y número de bloqueos.
- `/guard allow` deja pasar una vez la próxima acción bloqueada. Después vuelve a pedirla.
- `/guard off` y `/guard on` desactivan o activan todas las reglas en esta sesión y las siguientes.
- `/guard log` últimos bloqueos de la sesión.
