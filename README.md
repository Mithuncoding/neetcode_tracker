# Mithun DSA Academy

An offline-first personal DSA mentor built on the NeetCode 250 tracker. The roadmap remains the problem backbone, while the product measures pattern recognition, implementation, recall, explanation, and independent problem solving instead of treating a solved checkbox as mastery.

All learning evidence stays in the browser through `localStorage`. The application has no backend, account, or runtime API dependency.

## Mentor Mode

- **Reasoning diagnostic** places the learner at a capability level from programming foundation through the Easy-to-Medium transition.
- **Guided solve workspace** enforces Understand → Think → Hint → Implement → Explain → Revisit.
- **Six hint levels** move from a conceptual question to observation, pattern, algorithm, pseudocode, and Python implementation.
- **All 250 roadmap problems** resolve a six-level deterministic guide, derivation, algorithm, Python scaffold, line-by-line walkthrough, mistakes, clues, variations, and related-problem ladder. Six guides are handcrafted; the rest are transparently derived from verified pattern metadata rather than presented as exact editorials.
- **Pattern recognition training** covers the full roadmap and records committed choices and confidence before showing feedback.
- **Mastery profiles** separate recognition, implementation, recall, and independence and cap low-evidence scores.
- **Mastery-gated levels** require sequential first-party evidence; public LeetCode totals cannot earn promotion.
- **Daily missions** combine a concept, recognition drill, guided warm-up, Medium bridge, blind re-solve, and explanation task.
- **Medium trainer** moves through Easy concept, Easy implementation, variation, guided Medium, and unseen Medium.
- **Failure memory** records or infers why an attempt failed, supports repair practice, and can be resolved or reopened.
- **Blind re-solves** update the adaptive spaced-repetition schedule instead of being counted as new solves.
- **Decision explorer** asks structural questions when the learner does not know what to try next.
- **Python-first curriculum** teaches collection costs, Big-O, recursion, the Medium transition, core interview patterns, advanced combinations, and interview execution.
- **Local Python workbench** uses a real parser, transparent static checks, and sandboxed Pyodide execution in a Web Worker with a timeout. Six handcrafted guides include curated assertions; other problems support user-written assertions.
- **Knowledge graph** links Problem → Pattern → Curriculum concept → Fine-grained taxonomy → Related problems → Mistakes → Revision.
- **Visual learning** provides step traces for all 19 core patterns.
- **3D Algorithm Lab** provides 37 interactive Three.js worlds with orbit controls, autoplay, speed control, frame scrubbing, invariants, code lenses, prediction checkpoints, complexity tradeoffs, and persistent completion evidence.
- **One-year FAANG plan** tracks 52 weekly reviews alongside DSA, CS fundamentals, projects, communication, referrals, and mock interviews.
- **Expanded interview mode** scores understanding, recognition, approach, coding, complexity, explanation, communication, and no-hint independence with at most two conceptual hints.

Mentor content is deterministic and inspectable in `src/data/mentor-content.ts`; no opaque AI output is required for the learning workflow.

## 3D Algorithm Lab

Open `#/mentor/lab` or press `V` from the main workspace.

The visual curriculum covers:

- **Foundations:** Big-O growth, hash-map buckets, bitwise XOR
- **Searching:** linear search and binary search
- **Sorting:** bubble, selection, insertion, merge, quick, heap, counting, radix, and Python Timsort
- **Core patterns:** two pointers, sliding window, prefix sum, monotonic stack, and interval merging
- **Structures:** stack, queue, and linked-list reversal
- **Trees:** DFS traversal, BST search, heap operations, and tries
- **Graphs:** BFS, DFS, topological sort, Dijkstra, union-find, and Kruskal MST
- **Recursion and DP:** call stacks, backtracking trees, 1D DP, 2D grid DP, and 0/1 knapsack

Scene frames are generated from structured algorithm state, not prerecorded videos. Completion and prediction accuracy are stored in the v3 Mentor state and exported to Excel, but they do not inflate problem mastery.

Browsers without WebGL receive an accessible frame-by-frame state map with the same narration, invariants, code lens, predictions, and controls instead of an error screen.

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

Refresh the bundled public LeetCode profile snapshot:

```bash
npm run sync:leetcode
```

## Production Build

```bash
npm run build
npm run preview
```

The static production site is generated in `dist/`. The service worker precaches the application, roadmap, fonts, and route chunks for offline use after the first successful load.

The first Python execution downloads Pyodide from jsDelivr. The PWA caches that runtime for later use. Core tracking and teaching remain available without it.

## GitHub Pages Deployment

The workflow in `.github/workflows/deploy.yml` deploys every push to `main`, supports manual deployment, and refreshes the public LeetCode profile on a daily schedule.

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

- The current state is stored under `neetcode-250-tracker:v3`; valid v1 and v2 data migrates automatically.
- Up to 10 rotating recovery points can be retained locally.
- Invalid primary data falls back through rotating snapshots and the legacy backup.
- JSON imports are schema-validated, including Mentor evidence, and checked against the 250 known problem IDs before replacement.
- Encrypted `.nc250` files use PBKDF2-SHA256 and AES-GCM; passphrases never leave the browser.
- JSON, encrypted, and Excel exports include Mentor learning evidence.
- Export a JSON backup periodically, especially before clearing browser storage.

The roadmap metadata is bundled at build time. The application never fetches problem data to provide core functionality.

## Study Intelligence

- **Study plan** calculates the required workload from a target date, selected study days, and current completion.
- **Adaptive queue** balances overdue revisions, weak patterns, recent help dependency, active topic, target risk, difficulty mode, and variety.
- **Pattern taxonomy** adds searchable skills such as monotonic stack, topological sort, union-find, interval DP, prefix sum, and fast/slow pointers.
- **Adaptive revision** uses Forgot, Struggled, Partial, Strong, and Mastered feedback to update recall ease, interval length, and lapses.
- **Mock interview** hides pattern hints, prioritizes unseen problems, times attempts, and scores coding, explanation, communication, and independence.

## LeetCode Profile Sync

LeetCode does not allow its public GraphQL endpoint to be called cross-origin from a GitHub Pages app. `scripts/sync-leetcode.mjs` therefore fetches the public `Mithuncoding` profile at build time and writes `public/leetcode-profile.json`, which the deployed app reads from its own origin.

The snapshot includes public solve totals, difficulty counts, ranking, activity, streak, primary language, and recent accepted titles. Imported totals are exposure signals only and never create independent attempts or raise mastery/readiness scores.

For complete accepted-history coverage, Mentor includes a local reconciliation importer for pasted titles, slugs, LeetCode URLs, CSV-like rows, or JSON. It also records exposure only and requires no LeetCode credentials.

## Automated Tests

Vitest and Testing Library cover v1/v2 migration, corruption fallback, rotating recovery, encrypted round trips, timer math, planner priority, adaptive revision intervals, full interview scoring, Mentor mastery, sequential progression, all-problem guide coverage, knowledge-graph links, reasoning/code rubrics, Python harnesses, evidence persistence, LeetCode snapshot/reconciliation validation, Excel export, undo, reset semantics, and modal keyboard behavior.
