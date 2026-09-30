# API Sentinel Agent Guide

- Read `docs/01-PRD.md`, `docs/02-TECHNICAL-SPEC.md`, `docs/03-UI-UX.md`, and `docs/04-IMPLEMENTATION-PLAN.md` before significant implementation. Treat them as the source of truth.
- Follow the phase order in `docs/04-IMPLEMENTATION-PLAN.md`; do not pull later-phase behavior forward for convenience.
- Follow `docs/03-UI-UX.md` for visual work and preserve all security requirements in the specifications.
- Never replace real functionality with mocks or fabricate API results, history, or analytics.
- Keep dependencies minimal and justified. Avoid unrelated refactors.
- Run lint, type checking, relevant tests, and production builds as appropriate for each phase.
- Report blockers instead of silently changing the architecture.
- Never commit credentials, tokens, private keys, or other secrets.
