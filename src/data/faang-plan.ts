export interface YearPhase {
  id: string
  weeks: [number, number]
  title: string
  goal: string
  dsa: string[]
  career: string[]
  exitGate: string[]
}

export const YEAR_PHASES: YearPhase[] = [
  {
    id: 'foundation',
    weeks: [1, 8],
    title: 'Build reliable foundations',
    goal: 'Stop guessing at syntax and complexity so all attention can move to reasoning.',
    dsa: ['Python collections and complexity', 'Arrays, hashing, two pointers', 'Stacks, queues, binary search', '25 independent Easy solves'],
    career: ['Choose one strong project', 'Refresh Git, OOP, DBMS basics', 'Write one concise resume draft'],
    exitGate: ['70% recognition on foundation patterns', 'Explain five solutions without notes', 'Re-solve five problems after 72 hours'],
  },
  {
    id: 'core-medium',
    weeks: [9, 22],
    title: 'Cross the Medium barrier',
    goal: 'Learn one-pattern Mediums through controlled ladders instead of random problem selection.',
    dsa: ['Sliding window and prefix sums', 'Linked lists, intervals, trees', 'Heaps, backtracking, graph traversal', '15 independent Medium solves'],
    career: ['Finish one deployable project', 'Study OS, networking, DBMS weekly', 'Practice explaining tradeoffs aloud'],
    exitGate: ['Recognize 8 core patterns from unseen prompts', 'Complete 10 blind re-solves', 'Solve a familiar Medium in 35 minutes'],
  },
  {
    id: 'independence',
    weeks: [23, 38],
    title: 'Build independent Medium strength',
    goal: 'Move from single patterns to combinations while reducing hint use and implementation errors.',
    dsa: ['Greedy and 1D/2D DP', 'Topological sort and union-find', 'Tries, monotonic structures, advanced graphs', '40 independent Medium solves total'],
    career: ['Polish two project stories', 'Start system-design fundamentals', 'Begin referrals and targeted applications'],
    exitGate: ['75% recognition accuracy', 'Eight patterns at measured mastery', 'Three scored mocks above 65'],
  },
  {
    id: 'interview',
    weeks: [39, 52],
    title: 'Convert skill into interview performance',
    goal: 'Practice unfamiliar timed problems, communication, OAs, and recovery after being stuck.',
    dsa: ['Mixed unseen Medium sets', 'Selective Hard problems', 'Two mock interviews per week', 'Blind revision of recurring failures'],
    career: ['Company-specific preparation', 'Behavioral STAR stories', 'Resume iteration, referrals, and applications', 'CS fundamentals rapid revision'],
    exitGate: ['Five recent mocks averaging 70+', '25 timed Medium solves', 'Clear approach and complexity discussion under pressure'],
  },
]

export interface MonthPlan {
  month: number
  title: string
  dsaFocus: string
  target: string
  parallelTrack: string
}

export const MONTH_PLANS: MonthPlan[] = [
  { month: 1, title: 'Reasoning baseline', dsaFocus: 'Python, Big-O, arrays, dictionaries, sets', target: '15 Easy, 10 recognition drills, 4 blind recalls', parallelTrack: 'Resume baseline and Git fluency' },
  { month: 2, title: 'Linear invariants', dsaFocus: 'Two pointers, stack, queue, binary search', target: '20 Easy with at least 70% independent', parallelTrack: 'OOP and DBMS foundations' },
  { month: 3, title: 'Contiguous ranges', dsaFocus: 'Sliding window and prefix sums', target: '8 Easy plus 6 scaffolded Mediums', parallelTrack: 'Project architecture and clean README' },
  { month: 4, title: 'Pointers and ranges', dsaFocus: 'Linked lists and intervals', target: '10 independent solves and 6 blind recalls', parallelTrack: 'OS processes, threads, and memory' },
  { month: 5, title: 'Tree thinking', dsaFocus: 'Trees, BSTs, recursion contracts, heaps', target: '10 tree problems and 5 timed Mediums', parallelTrack: 'Networking and HTTP fundamentals' },
  { month: 6, title: 'Search spaces', dsaFocus: 'Backtracking, graph DFS, graph BFS', target: '12 Medium attempts with written derivations', parallelTrack: 'Deploy and measure the primary project' },
  { month: 7, title: 'Optimization states', dsaFocus: 'Greedy and 1D dynamic programming', target: '8 DP ladders and 4 independent Mediums', parallelTrack: 'SQL practice and database tradeoffs' },
  { month: 8, title: 'Structured graphs', dsaFocus: 'Topological sort, union-find, tries', target: '10 graph problems and 2 mock interviews', parallelTrack: 'System design: APIs, caching, queues' },
  { month: 9, title: 'DP depth', dsaFocus: '2D DP, knapsack, subsequences', target: '12 DP problems with state definitions', parallelTrack: 'Prepare project and leadership stories' },
  { month: 10, title: 'Mixed Mediums', dsaFocus: 'Unseen pattern combinations under 45 minutes', target: '12 timed Mediums and 4 mocks', parallelTrack: 'Begin referrals and targeted applications' },
  { month: 11, title: 'Interview conversion', dsaFocus: 'Company-tagged sets, OAs, selective Hards', target: 'Two mocks weekly and failure review', parallelTrack: 'Behavioral practice and resume iteration' },
  { month: 12, title: 'Peak and maintain', dsaFocus: 'Weak-pattern repair and recall, not new-volume panic', target: 'Five recent mocks averaging 70+', parallelTrack: 'Applications, referrals, CS revision, sleep' },
]

export const WEEKLY_RHYTHM = [
  { day: 'Monday', work: 'Learn one concept, trace two examples, solve one Easy.' },
  { day: 'Tuesday', work: 'Attempt one ladder problem; derive brute force before hints.' },
  { day: 'Wednesday', work: 'Recognition drill plus two blind revisions.' },
  { day: 'Thursday', work: 'Attempt one Medium and explain it aloud.' },
  { day: 'Friday', work: 'CS fundamentals or project work; only light DSA revision.' },
  { day: 'Saturday', work: 'Timed set or mock interview, then a written postmortem.' },
  { day: 'Sunday', work: 'Review mistakes, plan next week, and take real recovery time.' },
]

export const INTERVIEW_RULES = [
  'Spend 15 to 20 minutes deriving before using a pattern reveal.',
  'After any solution view, close it and re-implement from a blank editor.',
  'Re-solve assisted problems after 1, 3, 7, and 21 days.',
  'Track independent Mediums, not total submissions, as the main DSA outcome.',
  'Say the brute force, bottleneck, invariant, and complexity out loud.',
  'Keep one primary project deep enough to discuss architecture and tradeoffs.',
  'Study OS, DBMS, networking, OOP, and basic system design every week.',
  'Start applications before feeling perfectly ready; interview skill also needs interviews.',
  'Protect sleep and consistency. Exhaustion damages recall and reasoning.',
]

export function monthForWeek(week: number) {
  return Math.min(12, Math.max(1, Math.ceil(week / (52 / 12))))
}