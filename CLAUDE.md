# TaskRadar — Instrucciones para Claude

## Gestión del repo
Claude maneja este repositorio de forma autónoma: commits, push, creación de branches, PRs. No hace falta pedirle confirmación para operaciones de git rutinarias.

## Entorno
- Node.js y gh CLI están en `/opt/homebrew/bin/` — siempre usar `PATH="/opt/homebrew/bin:$PATH"` en los comandos bash
- Servidor: `PATH="/opt/homebrew/bin:$PATH" node server.js` → corre en `http://localhost:3000`
- Dependencias: `PATH="/opt/homebrew/bin:$PATH" npm install`

## Stack
- Frontend: HTML + CSS + JS vanilla (sin frameworks)
- Backend: `server.js` — proxy Express para Notion API y Anthropic API (resuelve CORS)
- Sin base de datos

## Archivos clave
- `app.js` — estado global + lógica completa del wizard
- `notion.js` — integración Notion (leer backlog, crear páginas)
- `ai.js` — llamadas a Anthropic (próximo paso + user story)
- `server.js` — proxy local, endpoints POST /notion y POST /anthropic
- `config.js` — API keys, en .gitignore, nunca subir al repo

## Especificación
La especificación completa del producto está en `~/Desktop/Proceso_Proactivo.md`. Cualquier duda de comportamiento del wizard, consultarla ahí.

## Idioma y tono
Todo el texto de la UI en español rioplatense. Mismo tono en mensajes de error y estados vacíos.

## Git
- Branch principal: `main`
- Repo: https://github.com/nbermudez94/TaskRadar (privado)
- Hacer push después de cada cambio significativo
