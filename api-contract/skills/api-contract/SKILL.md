---
name: api-contract
description: Mantiene el contrato de una API NestJS al día con el código. Lee los controladores cambiados en la rama, extrae los endpoints, actualiza la colección Postman del repositorio y genera o actualiza pruebas e2e con supertest. Úsala cuando el usuario pida actualizar Postman, documentar endpoints nuevos, generar tests de la API, sincronizar el contrato, o invoque /api-contract. No hace commit.
argument-hint: "[base-ref | ruta/al/controller.ts] [--todo] [--sin-tests] [--sin-postman]"
---

# Contrato de API NestJS

Objetivo: que cada endpoint que cambió en la rama quede reflejado en la colección Postman del repositorio y cubierto por una prueba e2e. El usuario revisa y hace el commit.

## Argumentos

- Sin argumentos: controladores cambiados respecto a `main` (`git diff --name-only main...HEAD -- '*.controller.ts'`), más los sin commit (`git status --porcelain`). Si `main` no existe, usa `master`, y si tampoco, `origin/HEAD`.
- `base-ref`: otra rama o commit como base de la comparación.
- Ruta a un `*.controller.ts`: trabaja solo ese archivo.
- `--todo`: todos los controladores del proyecto.
- `--sin-tests` / `--sin-postman`: omite esa mitad.

## Pasos

### 1. Localiza el proyecto NestJS

Busca `nest-cli.json` desde el directorio actual hacia abajo (máximo 3 niveles; tus repos suelen tener la API en una subcarpeta como `erp-acid-api/`). Si hay varios, pregunta cuál. Si no hay ninguno, dilo y para. Lee `package.json` para saber el gestor de paquetes, si existe `@nestjs/swagger`, `class-validator`, `supertest` y el script de e2e (`test:e2e`). Lee `main.ts` para el prefijo global (`setGlobalPrefix`), versionado y `ValidationPipe`.

### 2. Extrae los endpoints

Para cada controlador del alcance, lee el archivo y los DTO que importa. Construye una tabla con, por endpoint:

- método HTTP y ruta completa: prefijo global + `@Controller('x')` + `@Get(':id')`, con versión si aplica
- parámetros de ruta, query y cabeceras (`@Param`, `@Query`, `@Headers`)
- cuerpo: clase DTO y sus campos con tipo, obligatoriedad y decoradores de `class-validator`
- autenticación: `@UseGuards(...)`, `@Public()`, `@Roles(...)` a nivel de clase o método
- código de respuesta (`@HttpCode`) y tipo de retorno del método o `@ApiResponse`
- si el endpoint es nuevo, modificado o eliminado respecto a la base (compara con `git show <base>:<ruta>`)

Muestra la tabla antes de escribir nada. Si el alcance supera 40 endpoints, pide confirmación.

### 3. Actualiza la colección Postman (salvo `--sin-postman`)

Carga la skill `postman:api-engineer` y síguela; ella decide entre `postman:collection-schema-v3`, `postman:api-documentation` y `postman:api-testing`. Reglas de este proyecto:

- La colección vive en el repositorio, en la carpeta que el plugin Postman ya use (`postman/` o `.postman/`). Si no existe, crea la estructura mínima con `postman:bootstrap` sin vincular workspace remoto salvo que el usuario lo pida.
- Una carpeta por controlador, una petición por endpoint, nombre `METODO ruta` y descripción con el resumen del endpoint.
- URL con `{{baseUrl}}` y variables para ids (`{{facturaId}}`). Cuerpo de ejemplo generado desde el DTO, con valores plausibles del dominio.
- Autenticación heredada de la colección (`{{token}}`); los endpoints con `@Public()` la desactivan.
- Pruebas en la petición: código de estado esperado y, si el DTO tiene validaciones, una segunda petición "400 cuerpo inválido" en la misma carpeta.
- Endpoints eliminados del código se eliminan de la colección y se listan en el informe.
- Si existe un entorno (`environments/`), añade las variables nuevas sin valores secretos.

Valida la colección con el lint del plugin Postman si está disponible.

### 4. Genera pruebas e2e (salvo `--sin-tests`)

Una por controlador en `test/<modulo>.e2e-spec.ts`, junto a `test/jest-e2e.json` si existe. Si ya hay un archivo, añade solo los casos de endpoints nuevos o modificados y respeta su estilo. Para cada endpoint:

- caso feliz con el código esperado y comprobación de la forma de la respuesta
- `401` si tiene guard de autenticación y no es público
- `400` si el DTO tiene validaciones y hay `ValidationPipe`
- `404` en `GET /:id` con un id inexistente, si el servicio lanza `NotFoundException`

Usa `supertest` sobre `app.getHttpServer()`, `Test.createTestingModule({ imports: [AppModule] })`, y el mismo prefijo global que `main.ts`. Si la API necesita base de datos, usa la configuración de e2e existente; si no hay ninguna, deja los casos de datos como `it.todo` con una nota de qué falta, en vez de inventar una conexión. No mezcles `describe` de módulos distintos en un archivo.

Si `supertest` no está en `devDependencies`, indícalo con el comando de instalación; no lo instales tú.

### 5. Informe

Cierra con:

- la tabla de endpoints con la columna estado (nuevo, modificado, eliminado, sin cambios)
- archivos escritos o modificados, con ruta
- qué quedó como `it.todo` y por qué
- el comando para correr las pruebas (`npm run test:e2e` o el del proyecto)

No ejecutes `git commit` ni `git push`. No cambies código de la aplicación: si un endpoint tiene un error evidente (ruta duplicada, DTO sin validaciones donde el resto las tiene), dilo en el informe.
