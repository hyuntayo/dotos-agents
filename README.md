# DotOS frontend

The React interface for [DotOS](https://dotos.si): a workspace for read-only Robinhood Chain monitoring, with four original animated companions.

[Live site](https://dotos.si) · [User documentation](https://dotos.si/docs) · [Official X](https://x.com/dotmates)

## What is included

- The responsive landing page, original mascot rendering code, scroll animations and introductory video.
- Workspace screens for responsibilities, skills, activity, settings and AI conversations.
- Searchable user documentation and the access/privacy page.
- Shared chain definitions, catalog and monitoring types.
- Public images, models, fonts and icons with attribution notices.

This is the **frontend source**, not the hosted service. It does not include the backend, production deployment configuration, credentials, databases, user records or private project documents. The `/app` screens need a compatible API to save data, authenticate wallets, read chain observations, send notifications or generate AI replies. The frontend alone does not provide those services. Static landing content and Docs can be explored without an API; live network statistics will be unavailable.

## Run locally

Use Node.js 24 or newer and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

```sh
npm run build
npm run preview
```

Vite writes the production frontend to `dist/`. Configure your web host to serve `index.html` for application routes such as `/docs` and `/app/tasks`. Serve `/api/*` through your own compatible backend; Vite preview is a static preview, not an API server.

## API integration

Development requests to `/api` are proxied to `http://127.0.0.1:8787`. Override the target in the process environment if needed:

```sh
DOTOS_API_TARGET=http://127.0.0.1:9000 npm run dev
```

PowerShell:

```powershell
$env:DOTOS_API_TARGET = 'http://127.0.0.1:9000'
npm.cmd run dev
```

The request/response contract lives in `src/app/api/client.ts` and `src/app/api/types.ts`. The client uses same-origin session cookies, so your backend must implement authentication, origin checks, authorization, rate limiting and validation. Do not point a development proxy at the production service to create test data. Never put provider credentials into `VITE_*` variables or browser code.

## Source map

| Path | Purpose |
| --- | --- |
| `src/landing/visual/` | Landing scenes and interactive background |
| `src/components/dotmate/` | Original mascot models, rendering and animation |
| `src/app/` | Workspace UI and API client |
| `src/pages/DocsPage.tsx` | Searchable documentation UI |
| `src/content/docs.ts` | Documentation content |
| `shared/` | Shared network definitions and types |
| `public/` | Public static assets and asset notices |

The current interface targets Robinhood Chain Mainnet (4663). It does not implement trading, custody, fee claims or a public developer API. Deployment-specific limits described in the user documentation refer to the official hosted service, not guarantees made by this source distribution.

## Contributions

Keep changes focused and explain the behavior they improve. Run `npm run build` and `npm run lint`. For visual changes, check phone and desktop layouts, keyboard navigation and reduced-motion settings. Do not add real wallet records, screenshots of private workspaces, credentials or production test calls.

## Assets and licensing

Third-party assets retain their own licenses. Font license files are in `public/fonts/`; icon and other credits are in `public/asset-credits.txt`. Brand names, logos and project images are not a grant to impersonate the official service.

Original source code is licensed under the [MIT License](LICENSE), copyright 2026 hyuntayo. The MIT grant excludes the DotOS name, logos, branding images, rendered mascot images, models distributed as asset files, videos and background artwork. Those project assets are included for viewing and running this interface; their inclusion does not grant a separate license to redistribute or reuse them. Third-party fonts, icons and other assets remain subject to their original licenses. The original procedural mascot source code is covered by MIT.
