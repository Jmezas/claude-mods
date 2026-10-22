# api-contract

Mantiene el contrato de una API NestJS al día con el código. `/api-contract` lee los controladores que cambiaron en la rama, extrae cada endpoint con su ruta, DTO, guards y código de respuesta, y con eso:

- actualiza la colección Postman del repositorio (una carpeta por controlador, una petición por endpoint, pruebas de estado y de cuerpo inválido), apoyándose en el plugin `postman`;
- genera o completa las pruebas e2e en `test/<modulo>.e2e-spec.ts` con `supertest`: caso feliz, 401 si hay guard, 400 si el DTO valida, 404 en `GET /:id`.

Antes de escribir muestra la tabla de endpoints. Al final informa de archivos tocados, casos pendientes y el comando para correr las pruebas. No hace commit ni modifica el código de la aplicación.

## Uso

```text
/api-contract                              controladores cambiados respecto a main
/api-contract develop                      otra base de comparación
/api-contract src/ventas/ventas.controller.ts
/api-contract --todo                       todos los controladores
/api-contract --sin-tests                  solo Postman
/api-contract --sin-postman                solo pruebas e2e
```

## Requisitos

- Plugin `postman@claude-plugins-official` instalado (lo instala `install.sh`).
- Proyecto NestJS con `nest-cli.json`; la API puede estar en una subcarpeta del repositorio.
- `supertest` en `devDependencies` para las pruebas e2e; si falta, la skill indica el comando y no lo instala.

## Instalación

En el prompt de una sesión de terminal:

```text
/plugin install api-contract --marketplace Jmezas/claude-mods
```
