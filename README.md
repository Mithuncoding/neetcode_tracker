# NeetCode 250 Tracker

An offline-first personal progress tracker for the complete NeetCode 250 roadmap. It includes target-aware planning, quick solve logging, persisted timers, adaptive spaced repetition, focus sessions, scored mock interviews, fine-grained pattern diagnostics, calendar activity, achievements, encrypted backups, and source-data analytics.

All progress stays in the browser through `localStorage`. The application has no backend, account, or runtime API dependency.

## Installation

Requirements: Node.js 22 or newer and npm.

```bash
git clone <repository-url>
cd neetcode-250-tracker
npm install
```

## Development

```bash
npm run dev
```

Vite prints the local URL. Progress written during development is scoped to that browser origin.

Useful checks:

```bash
npm run lint
npm run test
npm run build
npm run check
```

## Production Build

```bash
npm run build
npm run preview
```

The static production site is generated in `dist/`. The service worker precaches the application, roadmap, fonts, and route chunks for offline use after the first successful load.

## GitHub Pages Deployment

The workflow in `.github/workflows/deploy.yml` deploys every push to `main`.

1. Push the repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` or run **Deploy to GitHub Pages** manually from the Actions tab.

The workflow defaults to `/<repository-name>/`, which is correct for a normal project site.

For a user or organization site such as `username.github.io`, create an Actions repository variable named `VITE_BASE_PATH` with the value `/`.

## Changing the Base Path

Vite reads `VITE_BASE_PATH` at build time. Always include the leading slash; the trailing slash is added automatically.

PowerShell:

```powershell
$env:VITE_BASE_PATH='/my-repository/'
npm run build
```

Bash:

```bash
VITE_BASE_PATH=/my-repository/ npm run build
```

Hash-based navigation keeps direct refreshes working on GitHub Pages without a custom `404.html` redirect.

## Data Safety

- The current state is stored under `neetcode-250-tracker:v2`; valid v1 data migrates automatically.
- Up to 10 rotating recovery points can be retained locally.
- Invalid primary data falls back through rotating snapshots and the legacy backup.
- JSON imports are schema-validated and checked against the 250 known problem IDs before replacement.
- Encrypted `.nc250` files use PBKDF2-SHA256 and AES-GCM; passphrases never leave the browser.
- One-click solves provide a 10-second undo action.
- Export a JSON backup periodically, especially before clearing browser storage.

The roadmap metadata is bundled at build time. The application never fetches problem data to provide core functionality.

## Study Intelligence

- **Study plan** calculates the required workload from a target date, selected study days, and current completion.
- **Adaptive queue** balances overdue revisions, weak patterns, recent help dependency, active topic, target risk, difficulty mode, and variety.
- **Pattern taxonomy** adds searchable skills such as monotonic stack, topological sort, union-find, interval DP, prefix sum, and fast/slow pointers.
- **Adaptive revision** updates recall ease, interval length, lapse count, and mastery from real review outcomes.
- **Mock interview** hides pattern hints, prioritizes unseen problems, times attempts, and scores coding, explanation, communication, and independence.

## Automated Tests

Vitest and Testing Library cover migration, corruption fallback, rotating recovery, encrypted round trips, timer math, planner priority, adaptive revision intervals, interview scoring, quick-solve undo, reset semantics, and modal keyboard behavior.
