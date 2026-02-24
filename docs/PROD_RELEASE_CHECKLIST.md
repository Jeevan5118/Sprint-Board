# Production Release Checklist

## 1. Security Gate (Must Pass)
- [ ] `JWT_SECRET` is set in production environment and is at least 32 chars.
- [ ] Production DB credentials are not committed to git.
- [ ] CORS `CLIENT_URL` matches the production frontend domain.
- [ ] Public register path is member-only and admin creation is restricted.
- [ ] Auth rate limiting is enabled and verified.

## 2. Data Gate
- [ ] Production database backup completed and validated.
- [ ] Migration dry-run completed on staging.
- [ ] `npm run migrate` succeeds on target environment.
- [ ] Seed scripts are **not** run on production unless explicitly planned.

## 3. Build and Test Gate
- [ ] Backend install: `cd backend && npm ci`
- [ ] Backend authz smoke: `cd backend && npm run test:authz`
- [ ] Frontend install: `cd frontend && npm ci`
- [ ] Frontend build: `cd frontend && npm run build`
- [ ] CI workflow `.github/workflows/ci.yml` is green on target commit.

## 4. Deployment Gate
- [ ] Deploy backend and frontend from the same tested commit/tag.
- [ ] Run migrations before opening traffic.
- [ ] Restart backend process after deploy and verify startup logs.
- [ ] Verify `/api/health` after deploy.

## 5. Post-Deploy Validation
- [ ] Admin login works.
- [ ] Member login works.
- [ ] Team/project visibility rules work for members.
- [ ] Sprint board status update works for member.
- [ ] Timeline page loads.
- [ ] Notifications endpoint for member works.

## 6. Rollback Readiness
- [ ] Rollback owner assigned.
- [ ] Previous stable build artifact available.
- [ ] Previous schema state / backup available.
- [ ] Rollback SOP reviewed: `docs/ROLLBACK_SOP.md`
