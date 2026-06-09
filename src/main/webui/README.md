# JOL Web UI

React, TypeScript, Vite, and Tailwind frontend for the JOL Quarkus application.

## Commands

Run commands from `src/main/webui/`.

```bash
npm install
npm run dev
npm run build
npm run lint
npm run storybook
```

- `npm run dev` starts the Vite dev server on port 5173 and proxies API/WebSocket traffic to the Quarkus backend.
- `npm run build` runs the TypeScript check and writes the production bundle to `dist/`.
- `npm run lint` runs ESLint.
- `npm run storybook` starts Storybook on port 6006.

## Backend

For normal full-stack development, start Quarkus from the repository root:

```bash
./mvnw quarkus:dev
```

Quarkus serves the integrated frontend through Quinoa for packaged builds. Running Vite separately is useful for frontend HMR while the backend remains on port 8080.

## Structure

- `src/features/` contains domain feature modules such as game, deck, chat, and tournament UI.
- `src/shared/` contains reusable components and cross-feature helpers.
- `src/hooks/` contains shared React hooks.
- `src/stories/` and `*.stories.tsx` files provide Storybook coverage for UI states.

## Conventions

- Keep the TypeScript command and DTO mirrors aligned with the Java command and DTO classes.
- Add or update tests/stories when changing reusable components or visible UI states.
- Keep raw game-state manipulation hidden in rules-enforced mode; use protocol commands and panels for enforced flows.
- Update the implementation docs when command surfaces, game mechanics, or frontend behaviour changes.
