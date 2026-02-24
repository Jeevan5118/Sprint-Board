# Rollback SOP (Standard Operating Procedure)

## Trigger Conditions
- Auth failures spike after release.
- Permission/access regressions affect member/admin workflows.
- Critical API errors on task/sprint/project paths.
- Migration failure or data integrity issue.

## Ownership
- Incident owner: release engineer on duty.
- DB owner: backend engineer.
- Communication owner: product/ops contact.

## Rollback Steps
1. Announce rollback start in release channel.
2. Disable new deployment pipeline temporarily.
3. Re-route traffic to previous stable backend/frontend version.
4. If migration introduced incompatible schema:
   - restore DB backup snapshot, or
   - run approved down-migration script (if available).
5. Restart application services.
6. Validate health:
   - `/api/health`
   - admin login
   - member login
   - sprint board status update
7. Announce rollback completion and system status.

## Data Safety Rules
- Never run destructive SQL manually without backup confirmation.
- Prefer restoring from verified backup for urgent recovery.
- Capture failing request samples before rollback (for RCA).

## Post-Rollback Actions
- Open incident ticket.
- Attach logs, failing endpoints, and timestamps.
- Create hotfix plan and test in staging first.
- Re-run full release checklist before next deployment.
