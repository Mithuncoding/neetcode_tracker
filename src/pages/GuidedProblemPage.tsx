import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  Lightbulb,
  MessageSquareText,
  Network,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SolutionTeaching } from '../components/SolutionTeaching'
import { Badge, Button, DifficultyBadge, PageHeader } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  CORE_PATTERNS,
  PATTERN_LESSONS,
  type CorePattern,
} from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
import { evaluateExplanation, getCorePattern, getSolveLadder } from '../lib/mentor'
import { getProblemTeachingGuide } from '../lib/problem-guides'
import { analyzePythonCode } from '../lib/python-analysis'
import { hasBuiltInPythonTests, runPythonCode, type PythonRunResult } from '../lib/python-runtime'
import { analyzeReasoning } from '../lib/reasoning-analysis'
import { formatTimer } from '../lib/utils'
import type { FailureReason, HintLevel, LearningMode } from '../types'

const HINT_LABELS = [
  'Conceptual question',
  'Key observation',
  'Pattern reveal',
  'Algorithm',
  'Pseudocode',
  'Python implementation',
] as const

const FAILURE_OPTIONS: Array<{ value: FailureReason; label: string }> = [
  { value: 'problem-understanding', label: 'I did not understand the problem' },
  { value: 'pattern-recognition', label: 'I did not recognize the pattern' },
  { value: 'wrong-approach', label: 'I committed to the wrong approach' },
  { value: 'implementation', label: 'I knew the idea but could not implement it' },
  { value: 'edge-case', label: 'I missed an edge case' },
  { value: 'complexity', label: 'My approach was too slow' },
  { value: 'time', label: 'I ran out of time' },
]

function modeFromQuery(value: string | null): LearningMode {
  if (value === 'blind') return 'blind'
  if (value === 'medium-trainer') return 'medium-trainer'
  return 'guided'
}

function currentLadder(
  persisted: ReturnType<typeof getSolveLadder>,
  understanding: string,
  bruteForce: string,
  hintLevel: HintLevel,
  implementationCompleted: boolean,
  explanationScore: number,
) {
  return persisted.map((step) => ({
    ...step,
    complete: step.complete ||
      (step.id === 'understand' && understanding.trim().length >= 20) ||
      (step.id === 'think' && bruteForce.trim().length >= 20) ||
      (step.id === 'hint' && hintLevel > 0) ||
      (step.id === 'solution' && hintLevel === 5) ||
      (step.id === 'reimplement' && implementationCompleted) ||
      (step.id === 'explain' && explanationScore >= 3),
  }))
}

export function GuidedProblemPage() {
  const { problemId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state, logAttempt, markRevision, recordGuidedSession, recordRecognition } = useTracker()
  const problem = ROADMAP_PROBLEMS.find((item) => item.id === problemId)
  const mode = modeFromQuery(searchParams.get('mode'))
  const [startedAt] = useState(() => new Date().toISOString())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [understanding, setUnderstanding] = useState('')
  const [bruteForce, setBruteForce] = useState('')
  const [patternGuess, setPatternGuess] = useState<CorePattern | ''>('')
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)
  const [implementationStatus, setImplementationStatus] = useState<'completed' | 'blocked' | null>(null)
  const [code, setCode] = useState('')
  const [runningCode, setRunningCode] = useState(false)
  const [runResult, setRunResult] = useState<PythonRunResult | null>(null)
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [explanation, setExplanation] = useState('')
  const [failureReason, setFailureReason] = useState<FailureReason | null>(null)
  const [reflection, setReflection] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (saved) return
    const interval = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [saved])

  if (!problem) {
    return <div className="page-content"><PageHeader title="Problem not found" description="This roadmap problem is unavailable." /><Button onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Return to Mentor</Button></div>
  }

  const pattern = getCorePattern(problem)
  const lesson = PATTERN_LESSONS[pattern]
  const resolvedGuide = getProblemTeachingGuide(problem)
  const hints = resolvedGuide.guide.hints
  const codeAnalysis = analyzePythonCode(code, pattern)
  const reasoningAnalysis = analyzeReasoning(understanding, bruteForce)
  const explanationEvaluation = evaluateExplanation(explanation, pattern)
  const persistedLadder = getSolveLadder(state, problem.id)
  const ladder = currentLadder(
    persistedLadder,
    understanding,
    bruteForce,
    hintLevel,
    implementationStatus === 'completed',
    explanation.trim() ? explanationEvaluation.score : 0,
  )
  const recognizedPattern = patternGuess ? patternGuess === pattern : null
  const canComplete = understanding.trim().length >= 20 &&
    bruteForce.trim().length >= 20 &&
    Boolean(patternGuess) &&
    Boolean(implementationStatus) &&
    (implementationStatus === 'blocked'
      ? Boolean(failureReason) && reflection.trim().length >= 10
      : explanation.trim().length >= 80)
  const outcome = implementationStatus === 'blocked'
    ? 'unable'
    : hintLevel === 0
      ? 'independent'
      : hintLevel === 5
        ? 'solution'
        : 'hint'

  const saveSession = () => {
    if (!canComplete || saved || !patternGuess || !implementationStatus) return
    recordRecognition({
      problemId: problem.id,
      selectedPattern: patternGuess,
      expectedPattern: pattern,
      correct: patternGuess === pattern,
      confidence,
    })
    recordGuidedSession({
      problemId: problem.id,
      mode,
      startedAt,
      hintLevelReached: hintLevel,
      recognizedPattern: patternGuess === pattern,
      bruteForceCaptured: true,
      understandingScore: reasoningAnalysis.understandingScore,
      derivationScore: reasoningAnalysis.derivationScore,
      implementationCompleted: implementationStatus === 'completed',
      code: code.trim(),
      codeScore: code.trim() ? codeAnalysis.score : null,
      explanation: explanation.trim(),
      explanationScore: implementationStatus === 'completed' ? explanationEvaluation.score : null,
      failureReason: implementationStatus === 'blocked' ? failureReason : null,
      reflection: reflection.trim(),
    })
    if (mode === 'blind') {
      markRevision({
        problemId: problem.id,
        result: implementationStatus === 'completed' && hintLevel === 0 ? 'recalled' : 'weak',
        confidence,
        durationSeconds: elapsedSeconds,
        sessionId: null,
      })
    } else {
      logAttempt({
        problemId: problem.id,
        outcome,
        attempts: 1,
        confidence,
        notes: reflection.trim() || `Mentor session: ${mode}. Explanation score ${explanationEvaluation.score}/5.`,
        revisionNeeded: outcome !== 'independent' || explanationEvaluation.score < 4,
        durationSeconds: elapsedSeconds,
        startedAt,
        sessionId: null,
      })
    }
    setSaved(true)
  }

  const runCode = async () => {
    if (!code.trim() || runningCode) return
    setRunningCode(true)
    setRunResult(null)
    try {
      setRunResult(await runPythonCode(code, problem.id))
    } catch (error) {
      setRunResult({ ok: false, output: error instanceof Error ? error.message : 'Python execution failed.', usedBuiltInTests: false })
    } finally {
      setRunningCode(false)
    }
  }

  if (saved) {
    return (
      <div className="page-content">
        <div className="mx-auto max-w-3xl">
          <section className="panel overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--accent-soft)] px-6 py-8 text-center"><CheckCircle2 size={36} className="mx-auto text-[var(--accent)]" /><p className="mt-3 text-[10px] font-extrabold uppercase text-[var(--accent-strong)]">Learning evidence saved</p><h1 className="mt-2 text-2xl font-bold">{problem.title}</h1></div>
            <div className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-5"><div className="bg-[var(--surface)] p-4 text-center"><p className="metric-number text-xl font-extrabold">{recognizedPattern ? 'Yes' : 'No'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Recognized</p></div><div className="bg-[var(--surface)] p-4 text-center"><p className="metric-number text-xl font-extrabold">{hintLevel}/5</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Hint reached</p></div><div className="bg-[var(--surface)] p-4 text-center"><p className="metric-number text-xl font-extrabold">{implementationStatus === 'completed' ? 'Done' : 'Blocked'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Implementation</p></div><div className="bg-[var(--surface)] p-4 text-center"><p className="metric-number text-xl font-extrabold">{code.trim() ? `${codeAnalysis.score}%` : '-'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Static code</p></div><div className="bg-[var(--surface)] p-4 text-center"><p className="metric-number text-xl font-extrabold">{implementationStatus === 'completed' ? `${explanationEvaluation.score}/5` : '-'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Explanation</p></div></div>
            <div className="p-6"><h2 className="text-sm font-bold">What this means</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{outcome === 'independent' && explanationEvaluation.score >= 4 ? 'Strong first-pass evidence. The scheduled blind re-solve will test whether this was durable understanding.' : outcome === 'unable' ? 'This is useful failure data, not a completed skill. Your classification will influence future teaching and revision.' : 'You made progress, but this is not independent mastery yet. The problem will return sooner for a blind re-solve.'}</p><div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => navigate('/mentor')}>Return to Mentor</Button><Button onClick={() => navigate('/mentor/recognition')}>Recognition drill <ArrowRight size={15} /></Button></div></div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <PageHeader title={problem.title} description={mode === 'blind' ? 'Blind re-solve: prior help stays hidden until you explicitly ask.' : mode === 'medium-trainer' ? 'Medium bridge: derive the simple approach before optimizing.' : 'Guided solve: think first, reveal only what you need.'} actions={<><div className="metric-number flex h-10 items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-xs font-bold"><Clock3 size={15} /> {formatTimer(elapsedSeconds)}</div><Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Exit</Button></>} />

      <section className="mb-4 overflow-x-auto rounded-[7px] border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex min-w-[760px] items-center px-4 py-3">{ladder.map((step, index) => <div key={step.id} className="flex flex-1 items-center"><div className={`flex items-center gap-2 ${step.complete ? 'text-[var(--accent-strong)]' : 'text-[var(--text-faint)]'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step.complete ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{step.complete ? <Check size={12} /> : <span className="font-mono text-[9px]">{index + 1}</span>}</span><span className="whitespace-nowrap text-[10px] font-bold uppercase">{step.label}</span></div>{index < ladder.length - 1 && <div className={`mx-2 h-px flex-1 ${step.complete ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />}</div>)}</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-4">
          <section className="panel p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="metric-number flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[var(--text)] font-mono text-[10px] font-bold text-[var(--surface)]">01</span><div><h2 className="text-sm font-bold">Understand before solving</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Restate the goal, inputs, outputs, and one edge case in your own words.</p></div></div>
            <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-raised)] text-sm font-bold hover:border-[var(--accent)]">Open problem statement on LeetCode <ExternalLink size={15} /></a>
            <textarea aria-label="Problem understanding" value={understanding} onChange={(event) => setUnderstanding(event.target.value)} className="input mt-4 min-h-32 resize-y px-3 py-3 text-sm leading-6" placeholder="The problem gives me... I need to return... An edge case is..." />
            {understanding.trim() && <div className="mt-3 grid gap-2 sm:grid-cols-2">{reasoningAnalysis.understandingChecks.map((check) => <div key={check.label} className={`flex items-center gap-2 text-[10px] ${check.met ? 'text-[var(--accent-strong)]' : 'text-[var(--text-faint)]'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${check.met ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{check.met && <Check size={9} />}</span>{check.label}</div>)}</div>}
            <p className="mt-2 text-right text-[10px] text-[var(--text-faint)]">{understanding.trim().length < 20 ? 'Write at least 20 characters to make your understanding explicit.' : `Understanding evidence ${reasoningAnalysis.understandingScore}%`}</p>
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="metric-number flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[var(--text)] font-mono text-[10px] font-bold text-[var(--surface)]">02</span><div><h2 className="text-sm font-bold">Build the naive approach</h2><p className="mt-1 text-xs text-[var(--text-muted)]">What would you try if efficiency did not matter? Which repeated work makes it expensive?</p></div></div>
            <textarea aria-label="Brute force reasoning" value={bruteForce} onChange={(event) => setBruteForce(event.target.value)} className="input mt-5 min-h-32 resize-y px-3 py-3 text-sm leading-6" placeholder="Brute force would... Its time complexity is... The repeated work is..." />
            {bruteForce.trim() && <div className="mt-3 grid gap-2 sm:grid-cols-2">{reasoningAnalysis.derivationChecks.map((check) => <div key={check.label} className={`flex items-center gap-2 text-[10px] ${check.met ? 'text-[var(--accent-strong)]' : 'text-[var(--text-faint)]'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${check.met ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{check.met && <Check size={9} />}</span>{check.label}</div>)}</div>}
            {(understanding.trim() || bruteForce.trim()) && <div className="mt-4 rounded-[6px] border border-[var(--blue)] bg-[var(--blue-soft)] p-3"><p className="text-[9px] font-extrabold uppercase text-[var(--blue)]">Mentor asks next</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{reasoningAnalysis.nextQuestion}</p></div>}
            <label className="mt-5 block text-[10px] font-extrabold uppercase text-[var(--text-faint)]">My pattern guess<select value={patternGuess} onChange={(event) => setPatternGuess(event.target.value as CorePattern | '')} className="input mt-2 px-3 text-sm"><option value="">Commit to a technique before hints</option>{CORE_PATTERNS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </section>

          <section className="panel overflow-hidden">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6"><div className="flex items-start gap-3"><span className="metric-number flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[var(--amber-soft)] font-mono text-[10px] font-bold text-[var(--amber)]">03</span><div><h2 className="text-sm font-bold">Progressive mentor hints</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Each reveal lowers independence evidence. That is fine; guessing blindly is not the goal.</p></div></div>{mode === 'blind' ? <EyeOff size={18} className="text-[var(--text-faint)]" /> : <Lightbulb size={18} className="text-[var(--amber)]" />}</header>
            <div className="p-5 sm:p-6">
              <div className="space-y-4">{hints.slice(0, hintLevel + 1).map((hint, index) => <div key={HINT_LABELS[index]} className="border-l-2 border-[var(--amber)] pl-4"><div className="flex items-center gap-2"><span className="metric-number font-mono text-[10px] font-bold text-[var(--amber)]">H{index}</span><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">{HINT_LABELS[index]}</p></div><p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{hint}</p></div>)}</div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"><p className="text-[10px] text-[var(--text-faint)]">{bruteForce.trim().length < 20 ? 'Capture a real attempt before asking for stronger help.' : hintLevel < 5 ? `Next reveal: ${HINT_LABELS[hintLevel + 1]}` : 'Full teaching view unlocked.'}</p><Button variant="secondary" onClick={() => setHintLevel((value) => Math.min(5, value + 1) as HintLevel)} disabled={bruteForce.trim().length < 20 || hintLevel === 5}>{hintLevel === 4 ? <Code2 size={15} /> : <Eye size={15} />} {hintLevel === 4 ? 'Reveal implementation' : 'Reveal next hint'}</Button></div>
            </div>
          </section>

          {hintLevel === 5 && <SolutionTeaching problem={problem} pattern={pattern} />}

          <section className="panel p-5 sm:p-6">
            <div className="flex items-start gap-3"><span className="metric-number flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[var(--blue-soft)] font-mono text-[10px] font-bold text-[var(--blue)]">04</span><div><h2 className="text-sm font-bold">Implement, then explain</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Code in LeetCode or your editor. Return here only after testing edge cases.</p></div></div>
            <div className="mt-5 overflow-hidden rounded-[7px] border border-[var(--border)]"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"><div className="flex items-center gap-2"><Code2 size={16} className="text-[var(--blue)]" /><div><p className="text-xs font-bold">Local Python workbench</p><p className="mt-0.5 text-[9px] text-[var(--text-faint)]">Parser, static rubric, and sandboxed execution</p></div></div><div className="flex flex-wrap items-center gap-2">{hasBuiltInPythonTests(problem.id) && <Badge tone="blue">Built-in checks</Badge>}{code.trim() && <Badge tone={codeAnalysis.score >= 75 ? 'green' : codeAnalysis.score >= 50 ? 'amber' : 'red'}>{codeAnalysis.score}% static</Badge>}<Button size="sm" variant="secondary" onClick={runCode} disabled={!code.trim() || !codeAnalysis.syntaxValid || runningCode}>{runningCode ? 'Loading Python...' : 'Run code'}</Button>{hintLevel === 5 && <Button size="sm" variant="ghost" onClick={() => { setCode(resolvedGuide.guide.python); setRunResult(null) }}>Load revealed scaffold</Button>}</div></header><textarea aria-label="Python solution code" value={code} onChange={(event) => { setCode(event.target.value); setRunResult(null) }} spellCheck={false} className="min-h-72 w-full resize-y bg-[var(--surface)] p-4 font-mono text-xs leading-6 text-[var(--text)]" placeholder={'class Solution:\n    def solve(self, ...):\n        # Write your own implementation before revealing Hint 5.\n        pass\n\n# For non-curated problems, add your own assert tests below.'} />{runResult && <div className={`border-t px-4 py-3 ${runResult.ok ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--red)] bg-[var(--red-soft)]'}`}><p className={`text-[10px] font-extrabold uppercase ${runResult.ok ? 'text-[var(--accent-strong)]' : 'text-[var(--red)]'}`}>{runResult.ok ? 'Python run completed' : 'Python run failed'}{runResult.usedBuiltInTests ? ' · curated checks included' : ''}</p><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-5 text-[var(--text)]">{runResult.output}</pre></div>}{code.trim() && <div className="border-t border-[var(--border)] p-4"><div className="grid gap-2 sm:grid-cols-2">{codeAnalysis.checks.map((check) => <div key={check.id} className={`flex items-start gap-2 text-[10px] leading-4 ${check.passed ? 'text-[var(--accent-strong)]' : 'text-[var(--text-muted)]'}`}><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${check.passed ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{check.passed && <Check size={9} />}</span><span><strong className="block text-[var(--text)]">{check.label}</strong>{check.detail}</span></div>)}</div><p className="mt-3 border-t border-[var(--border)] pt-3 text-[9px] leading-4 text-[var(--text-faint)]">{codeAnalysis.disclaimer} The first run downloads the Pyodide runtime.</p></div>}</div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => { setImplementationStatus('completed'); setFailureReason(null) }} className={`flex min-h-12 items-center justify-center gap-2 rounded-[6px] border text-sm font-bold ${implementationStatus === 'completed' ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] hover:border-[var(--accent)]'}`}><CheckCircle2 size={16} /> Implemented and tested</button><button type="button" onClick={() => setImplementationStatus('blocked')} className={`flex min-h-12 items-center justify-center gap-2 rounded-[6px] border text-sm font-bold ${implementationStatus === 'blocked' ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : 'border-[var(--border)] hover:border-[var(--red)]'}`}><ShieldAlert size={16} /> I could not finish</button></div>

            <div className="mt-5"><div className="mb-2 flex justify-between"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Confidence</p><span className="metric-number text-xs font-bold">{confidence}/5</span></div><div className="grid grid-cols-5 gap-2">{([1, 2, 3, 4, 5] as const).map((value) => <button key={value} type="button" onClick={() => setConfidence(value)} className={`h-9 rounded-[5px] border font-mono text-xs font-bold ${confidence === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{value}</button>)}</div></div>

            {implementationStatus === 'completed' && <div className="mt-6"><label className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]" htmlFor="explanation">Explain it as if an interviewer asked why it works</label><textarea id="explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} className="input mt-2 min-h-40 resize-y px-3 py-3 text-sm leading-6" placeholder="I use... The invariant is... This works because... Time is O(...), space is O(...). An edge case is..." /><div className="mt-3 grid gap-2 sm:grid-cols-2">{explanationEvaluation.criteria.map((criterion) => <div key={criterion.label} className={`flex items-center gap-2 text-[10px] font-semibold ${criterion.met ? 'text-[var(--accent-strong)]' : 'text-[var(--text-faint)]'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${criterion.met ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-strong)]'}`}>{criterion.met && <Check size={10} />}</span>{criterion.label}</div>)}</div><p className="mt-3 text-xs font-bold">Explanation score: <span className="metric-number text-[var(--accent)]">{explanation.trim() ? explanationEvaluation.score : 0}/5</span></p></div>}

            {implementationStatus === 'blocked' && <div className="mt-6"><label className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Why did this attempt fail?<select value={failureReason ?? ''} onChange={(event) => setFailureReason(event.target.value as FailureReason)} className="input mt-2 px-3 text-sm"><option value="">Select the closest root cause</option>{FAILURE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><textarea aria-label="Failure reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} className="input mt-3 min-h-24 resize-y px-3 py-3 text-sm leading-6" placeholder="What exactly happened? Example: I knew a frequency map was needed but could not update it correctly." /></div>}

            {implementationStatus === 'completed' && <textarea aria-label="Session reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} className="input mt-5 min-h-20 resize-y px-3 py-3 text-sm leading-6" placeholder="Optional reflection: what was the breakthrough or implementation mistake?" />}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5"><p className="max-w-xl text-[10px] leading-5 text-[var(--text-faint)]">Saving records the hint ceiling, pattern guess, implementation result, explanation rubric, time, confidence, and revision need.</p><Button onClick={saveSession} disabled={!canComplete}>Complete learning session <Sparkles size={15} /></Button></div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="panel p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><DifficultyBadge difficulty={problem.difficulty} /><Badge tone={mode === 'blind' ? 'red' : mode === 'medium-trainer' ? 'amber' : 'blue'}>{mode === 'blind' ? 'Blind re-solve' : mode === 'medium-trainer' ? 'Medium trainer' : 'Guided'}</Badge></div><span className="font-mono text-[10px] text-[var(--text-faint)]">#{problem.leetcodeNumber}</span></div>
            <h2 className="mt-4 text-base font-bold">Evidence, not completion</h2>
            <dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-[var(--text-muted)]">Pattern guess</dt><dd className="max-w-[55%] truncate font-bold">{patternGuess || 'Not committed'}</dd></div><div className="flex justify-between"><dt className="text-[var(--text-muted)]">Hints revealed</dt><dd className="metric-number font-bold">{hintLevel}/5</dd></div><div className="flex justify-between"><dt className="text-[var(--text-muted)]">Elapsed</dt><dd className="metric-number font-mono font-bold">{formatTimer(elapsedSeconds)}</dd></div><div className="flex justify-between"><dt className="text-[var(--text-muted)]">Likely outcome</dt><dd className="font-bold capitalize">{implementationStatus ? outcome : 'Pending'}</dd></div></dl>
          </section>
          <section className="panel p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--violet-soft)] text-[var(--violet)]"><BrainCircuit size={18} /></div><h2 className="mt-4 text-sm font-bold">Mentor rule</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">Do not ask “What is the answer?” Ask “What repeated work can I avoid, what state do I need, and what invariant lets me move?”</p>
          </section>
          {hintLevel < 2 ? <section className="panel p-5"><EyeOff size={17} className="text-[var(--text-faint)]" /><h2 className="mt-3 text-sm font-bold">Pattern hidden</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">The roadmap topic and pattern stay hidden until Hint 2 so recognition evidence remains meaningful.</p></section> : <section className="panel p-5"><MessageSquareText size={17} className="text-[var(--accent)]" /><div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Pattern revealed</p><Badge tone={resolvedGuide.source === 'handcrafted' ? 'green' : 'neutral'}>{resolvedGuide.source === 'handcrafted' ? 'Handcrafted' : 'Pattern-derived'}</Badge></div><h2 className="mt-1 text-sm font-bold">{pattern}</h2><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{lesson.what}</p>{resolvedGuide.source === 'pattern-derived' && <p className="mt-3 border-t border-[var(--border)] pt-3 text-[10px] leading-4 text-[var(--text-faint)]">This guide is generated deterministically from verified roadmap metadata. It teaches the correct pattern family but is not an exact editorial.</p>}</section>}
          {hintLevel === 5 && <Button className="w-full" variant="secondary" onClick={() => window.open(problem.neetcodeUrl, '_blank', 'noopener,noreferrer')}>Open external explanation <ExternalLink size={15} /></Button>}
          <Button className="w-full" variant="secondary" onClick={() => navigate(`/mentor/graph?problem=${problem.id}`)}><Network size={15} /> Open knowledge graph</Button>
          <button type="button" onClick={() => { setUnderstanding(''); setBruteForce(''); setPatternGuess(''); setHintLevel(0); setImplementationStatus(null); setCode(''); setRunResult(null); setExplanation(''); setFailureReason(null); setReflection('') }} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-[var(--text-faint)] hover:text-[var(--text)]"><RotateCcw size={13} /> Clear this draft</button>
        </aside>
      </div>
    </div>
  )
}