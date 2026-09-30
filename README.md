# API Sentinel

API Sentinel is a focused developer tool for testing, validating, saving, and analyzing HTTP APIs. This repository currently contains the Phase 0 application foundation: a Next.js App Router project, a responsive developer-tool shell, and reusable interface primitives.

The product requirements and implementation sequence live in [`docs/`](./docs). Read all four specification documents before beginning significant implementation.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Copy `.env.example` to an ignored local environment file only when a later phase requires configuration. Never commit real secrets.
