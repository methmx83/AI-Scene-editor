# AI Scene Editor (Scaffold)

Dieses Repository enthält ein Grundgerüst für eine Desktop-App mit Electron + React + TypeScript (strict), inkl. Shared Types, JSON-Schema und Save/Load.

## Voraussetzungen

- Node.js 20+
- npm oder pnpm
- Windows 10/11 (Entwicklung und Start getestet auf Desktop-Flow)

## Start (Windows)

```bash
npm install
npm run dev
```

oder

```bash
pnpm install
pnpm dev
```

Die App startet mit einem **Hello Project**. Über die Buttons kann ein neues Dummy-Projekt erzeugt, als JSON gespeichert und wieder geladen werden.

## Skripte

- `npm run dev` / `pnpm dev` – startet die Electron-App
- `npm run lint` – ESLint über Workspaces
- `npm run typecheck` – TypeScript Typechecks über Workspaces
- `npm run format` – Prettier Check
- `npm run format:write` – Prettier Fix

## Struktur

- `apps/desktop` – Electron + React App
- `packages/shared` – gemeinsame TypeScript-Typen und `project.schema.json`

## Out of scope

- Keine Timeline-Canvas
- Kein ComfyUI
- Kein FFmpeg
