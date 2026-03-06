# SprintBoard Playwright E2E Framework

## 1. Install
1. From project root:
```bash
npm install
npx playwright install
```
2. Copy env template:
```bash
copy e2e\\.env.e2e.example .env.e2e
```
3. Update `.env.e2e` with valid credentials.

## 2. Folder Structure
```text
e2e/
  pages/                  # Page Object Model classes
  tests/                  # Test specs
  utils/                  # Test data + API helpers
  .env.e2e.example        # Environment template
playwright.config.js
package.json              # Playwright scripts/deps (root)
```

## 3. Run Tests
- Headless:
```bash
npm run test:e2e
```
- Headed:
```bash
npm run test:e2e:headed
```
- UI Mode:
```bash
npm run test:e2e:ui
```
- Open HTML report:
```bash
npm run test:e2e:report
```

## 4. Scenarios Covered
1. Admin Authentication
2. Employee Authentication
3. Admin Adds Employee (CSV import flow + API verification)
4. Admin Creates Project
5. Employee Project Workflow (view + progress update via drag/drop)
6. Navigation Testing
7. Form Validation
8. Security Testing (unauthenticated redirect)
9. Logout Test
10. Basic UI Smoke Test

## 5. Notes
1. Some workflows depend on data existing in local DB.
2. Tests include conditional skips when required seed data is unavailable.
3. Screenshots/videos/traces are captured on failures.
