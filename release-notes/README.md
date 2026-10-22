# release-notes

`/release` lee los commits del repositorio actual y escribe la sección correspondiente en `CHANGELOG.md`, en español y agrupada por tipo de cambio. El commit, la etiqueta y el push quedan para el usuario.

## Uso

```text
/release                      desde la última etiqueta hasta HEAD
/release v1.4.0               desde esa etiqueta o commit
/release --version 2.0.0      fuerza el título de la sección
/release --solo-mostrar       muestra la sección sin tocar CHANGELOG.md
```

Sin etiquetas en el repositorio usa los últimos 30 días, o los últimos 50 commits si hay menos de 3 en ese periodo. Propone la siguiente versión semántica según haya cambios rompientes, novedades o solo correcciones.

Reconoce prefijos Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `docs`, `chore`...) y, cuando no los hay, deduce la sección por el texto del commit o por los archivos tocados.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install release-notes --marketplace Jmezas/claude-mods
```

La skill también se activa sola cuando pides "changelog", "notas de versión" o "qué cambió desde".
