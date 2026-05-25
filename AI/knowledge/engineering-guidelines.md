# Engineering Guidelines

**Department:** Engineering  
**Tags:** engineering, deployment, git

## Deployment steps

Production deployments follow this pipeline:

1. Open PR against `main` with passing CI (lint, unit tests, typecheck)
2. Obtain 1 approval from code owner
3. Merge to `main` — triggers staging deploy automatically
4. Run smoke tests on staging (`https://staging.insightflow.internal`)
5. Promote to production via GitHub Actions workflow `deploy-prod` (requires release manager role)
6. Monitor dashboards for 30 minutes post-deploy

## Branch naming

- `feature/<ticket>-short-description`
- `fix/<ticket>-short-description`
- `chore/<description>`

## Code review

- All production code requires review
- Security-sensitive changes require security team review

## On-call

Engineering on-call rotation is 1 week. Primary handles pages; secondary backs up within 15 minutes.

## Local development

- Node 20+, pnpm preferred
- Copy `.env.example` to `.env` — never commit secrets
- Run `pnpm test` before pushing
