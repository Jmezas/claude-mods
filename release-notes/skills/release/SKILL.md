---
name: release
description: Genera notas de versión en español a partir de los commits del repositorio y las escribe en CHANGELOG.md. Úsala cuando el usuario pida changelog, notas de versión, release notes, "qué cambió desde", o invoque /release. Nunca hace commit, tag ni push.
argument-hint: "[desde-ref] [--version x.y.z] [--solo-mostrar]"
---

# Notas de versión

Produce una sección de CHANGELOG en español con los cambios del repositorio actual. Trabaja solo con git de lectura y con la escritura de `CHANGELOG.md`. Commit, tag y push los hace el usuario.

## Argumentos

- `desde-ref`: commit, etiqueta o rama desde la que contar (exclusiva). Sin él, usa la última etiqueta alcanzable (`git describe --tags --abbrev=0`). Sin etiquetas, usa los últimos 30 días (`--since="30 days ago"`); si eso da menos de 3 commits, usa los últimos 50 commits.
- `--version x.y.z`: título de la sección. Sin él, propone la siguiente versión semántica a partir de la última etiqueta: mayor si hay cambios rompientes, menor si hay `feat`, parche en otro caso. Si no hay etiquetas, usa `Sin publicar`.
- `--solo-mostrar`: muestra la sección sin tocar `CHANGELOG.md`.

## Pasos

1. Confirma que el directorio es un repositorio git. Si no, dilo y para.
2. Obtén el rango. Ejecuta:
   ```bash
   git log <desde>..HEAD --no-merges --date=short --pretty=format:'%h%x09%ad%x09%an%x09%s%x09%b%x1e'
   ```
   Si el rango está vacío, informa de que no hay cambios y para.
3. Clasifica cada commit en una de estas secciones, en este orden. Usa el prefijo Conventional Commits cuando exista (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`, `chore:`), y si no existe, deduce la sección por el mensaje:
   - **Cambios rompientes**: cuerpo con `BREAKING CHANGE` o `!` tras el tipo.
   - **Novedades**: `feat`, "agrega", "añade", "nuevo", "implementa".
   - **Correcciones**: `fix`, "corrige", "arregla", "soluciona", "bug".
   - **Rendimiento**: `perf`, "optimiza", "mejora el tiempo".
   - **Refactorización**: `refactor`, "reorganiza", "renombra", "limpia".
   - **Documentación**: `docs`, cambios solo en `.md`.
   - **Mantenimiento**: `chore`, `build`, `ci`, `test`, dependencias, configuración.
   Omite commits de mezcla automática, `wip`, `tmp` y commits que solo cambian formato sin decir qué.
4. Redacta cada entrada en español, en una línea, verbo en pasado o sustantivo, sin el prefijo de tipo, sin punto final, con el ámbito entre paréntesis si el commit lo trae (`feat(ventas): ...` pasa a `(ventas) ...`). Termina la línea con el hash corto entre paréntesis. Agrupa commits que describen el mismo cambio en una sola entrada con varios hashes. Si un mensaje no dice nada útil ("fix", "cambios"), mira `git show --stat <hash>` y describe el cambio por los archivos tocados.
5. Arma la sección:
   ```markdown
   ## [x.y.z] - AAAA-MM-DD

   ### Cambios rompientes
   - ...

   ### Novedades
   - ...
   ```
   Incluye solo las subsecciones con entradas. Fecha de hoy. Si hubo cambios rompientes, añade una línea al final de esa subsección que diga qué debe hacer quien actualiza.
6. Si no se pidió `--solo-mostrar`: si `CHANGELOG.md` existe, inserta la sección después del título principal y antes de la primera sección `##` existente. Si no existe, créalo con `# Registro de cambios` y una línea que diga que sigue el formato Keep a Changelog, y luego la sección.
7. Muestra la sección completa al usuario y, en una línea, la versión propuesta y el rango usado. Recuerda que el commit y la etiqueta los hace él. No ejecutes `git commit`, `git tag` ni `git push`, aunque el changelog quede escrito.

## Ejemplo de entrada

Commit `feat(facturas): permitir anular factura emitida (closes #41)` pasa a:

```markdown
- (facturas) Permite anular una factura ya emitida, cierra #41 (a1b2c3d)
```
