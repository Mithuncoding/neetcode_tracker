import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  ExternalLink,
  Lightbulb,
  RotateCcw,
  ScanSearch,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import { PATTERN_LESSONS, RECOGNITION_DRILLS, type CorePattern } from '../data/mentor-content'
import { ROADMAP_PROBLEMS } from '../data/problems'
const problemByTitle = new Map(ROADMAP_PROBLEMS.map((problem) => [problem.title, problem]))
const availableDrills = RECOGNITION_DRILLS.flatMap((drill) => {
  const problem = problemByTitle.get(drill.problemTitle)
  return problem ? [{ drill, problem }] : []
})

export function RecognitionPage() {
  const { state, recordRecognition } = useTracker()
  const navigate = useNavigate()
  const levelCap = Math.min(5, Math.max(2, state.mentor.currentLevel + 1))
  const drills = availableDrills.filter(({ drill }) => drill.level <= levelCap)
  const initialIndex = state.mentor.recognitionAttempts.length % Math.max(1, drills.length)
  const [index, setIndex] = useState(initialIndex)
  const [selected, setSelected] = useState<CorePattern | null>(null)
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [revealed, setRevealed] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const item = drills[index % drills.length]
  const correct = selected === item.drill.answer
  const expectedLesson = PATTERN_LESSONS[item.drill.answer]
  const selectedLesson = selected ? PATTERN_LESSONS[selected] : null
  const recent = state.mentor.recognitionAttempts.slice(-20)
  const recentAccuracy = recent.length
    ? Math.round((recent.filter((attempt) => attempt.correct).length / recent.length) * 100)
    : 0

  const submit = () => {
    if (!selected || revealed) return
    recordRecognition({
      problemId: item.problem.id,
      selectedPattern: selected,
      expectedPattern: item.drill.answer,
      correct,
      confidence,
    })
    setSessionTotal((value) => value + 1)
    if (correct) setSessionCorrect((value) => value + 1)
    setRevealed(true)
  }

  const next = () => {
    setIndex((value) => (value + 1) % drills.length)
    setSelected(null)
    setConfidence(3)
    setRevealed(false)
  }

  const resetSession = () => {
    setSessionCorrect(0)
    setSessionTotal(0)
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div className="page-content">
      <PageHeader title="Pattern Sprint" description="Five blank-prompt classifications. Commit before feedback; learn the discriminating cue." actions={<Button variant="secondary" onClick={() => navigate('/')}><ArrowLeft size={15} /> Today</Button>} />

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="panel p-4"><p className="metric-number text-2xl font-extrabold">{sessionTotal ? `${sessionCorrect}/${sessionTotal}` : '-'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">This drill</p></div>
        <div className="panel p-4"><p className="metric-number text-2xl font-extrabold">{recent.length ? `${recentAccuracy}%` : '-'}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Last 20</p></div>
        <div className="panel p-4"><p className="metric-number text-2xl font-extrabold">L{item.drill.level}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Difficulty</p></div>
        <div className="panel p-4"><p className="metric-number text-2xl font-extrabold">{state.mentor.recognitionAttempts.length}</p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Evidence logged</p></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <section className="panel overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div className="flex items-center gap-2"><Badge tone="blue">Classify first</Badge><Badge tone={item.problem.difficulty === 'Easy' ? 'green' : 'amber'}>{item.problem.difficulty}</Badge></div>
            <a href={item.problem.leetcodeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">Read full prompt <ExternalLink size={13} /></a>
          </header>
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[var(--text)] text-[var(--surface)]"><ScanSearch size={19} /></div><div><p className="font-mono text-[10px] font-bold uppercase text-[var(--text-faint)]">#{item.problem.leetcodeNumber} · {item.problem.title}</p><h2 className="mt-2 max-w-2xl text-xl font-bold leading-8">{item.drill.prompt}</h2></div></div>
            <div className="mt-5 flex flex-wrap gap-2">{item.drill.clues.map((clue) => <span key={clue} className="rounded-[4px] border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--text-muted)]">{clue}</span>)}</div>

            <div className="mt-7">
              <p className="mb-3 text-[10px] font-extrabold uppercase text-[var(--text-faint)]">What technique would you try?</p>
              <div className="grid gap-2 sm:grid-cols-2">{item.drill.options.map((option, optionIndex) => {
                const selectedOption = selected === option
                const answer = revealed && option === item.drill.answer
                const wrong = revealed && selectedOption && !correct
                return <button key={option} type="button" disabled={revealed} onClick={() => setSelected(option)} className={`flex min-h-14 items-center gap-3 rounded-[6px] border px-4 text-left text-sm font-bold transition-colors ${answer ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]' : wrong ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : selectedOption ? 'border-[var(--blue)] bg-[var(--blue-soft)] text-[var(--blue)]' : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]'}`}><span className="metric-number flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-current font-mono text-[10px]">{revealed && (answer || wrong) ? answer ? <Check size={13} /> : <X size={13} /> : optionIndex + 1}</span>{option}</button>
              })}</div>
            </div>

            {!revealed && <div className="mt-6"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Confidence before feedback</p><span className="metric-number text-xs font-bold">{confidence}/5</span></div><div className="grid grid-cols-5 gap-2">{([1, 2, 3, 4, 5] as const).map((value) => <button key={value} type="button" onClick={() => setConfidence(value)} aria-label={`Confidence ${value}`} className={`h-9 rounded-[5px] border font-mono text-xs font-bold ${confidence === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'}`}>{value}</button>)}</div></div>}

            {revealed && <div className={`mt-6 rounded-[6px] border p-4 ${correct ? 'border-[var(--green)] bg-[var(--green-soft)]' : 'border-[var(--amber)] bg-[var(--amber-soft)]'}`}><div className="flex items-center gap-2"><Lightbulb size={16} /><p className="text-xs font-extrabold">{correct ? 'Pattern fit confirmed' : `Better first test: ${item.drill.answer}`}</p></div><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.drill.explanation}</p>{!correct && confidence >= 4 && <p className="mt-2 text-xs font-bold text-[var(--red)]">High-confidence miss: write down the cue that separated these patterns.</p>}</div>}

            {revealed && <section className="mt-3 grid gap-px overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2"><div className="bg-[var(--surface)] p-4"><p className="text-[9px] font-extrabold uppercase text-[var(--green-strong)]">Signals for {item.drill.answer}</p><ul className="mt-3 space-y-2">{expectedLesson.recognitionClues.slice(0, 3).map((clue) => <li key={clue} className="flex gap-2 text-xs leading-5 text-[var(--text-muted)]"><Check size={12} className="mt-1 shrink-0 text-[var(--green)]" />{clue}</li>)}</ul></div><div className="bg-[var(--surface-raised)] p-4"><p className="text-[9px] font-extrabold uppercase text-[var(--text-faint)]">Contrast {correct ? 'with a nearby choice' : `your ${selected}`}</p><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{correct ? 'Say why the strongest distractor fails before moving on.' : selectedLesson?.what}</p>{!correct && selectedLesson && <p className="mt-3 border-t border-[var(--border)] pt-3 text-[10px] leading-4 text-[var(--text-faint)]">Typical cue: {selectedLesson.recognitionClues[0]}</p>}</div></section>}

            <div className="mt-6 flex flex-wrap justify-end gap-2">{revealed ? <><Button variant="secondary" onClick={() => navigate(`/mentor/problem/${item.problem.id}`)}>Derive this problem</Button><Button onClick={next}>Next challenge <ArrowRight size={15} /></Button></> : <Button onClick={submit} disabled={!selected}>Commit answer <Check size={15} /></Button>}</div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="panel p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--violet-soft)] text-[var(--violet)]"><BrainCircuit size={18} /></div>
            <h2 className="mt-4 text-sm font-bold">Pattern compass</h2>
            <ol className="mt-4 space-y-3 text-xs leading-5 text-[var(--text-muted)]">
              <li><strong className="mr-2 font-mono text-[var(--accent)]">01</strong> Is the answer contiguous, ordered, or relational?</li>
              <li><strong className="mr-2 font-mono text-[var(--accent)]">02</strong> What repeated work appears in brute force?</li>
              <li><strong className="mr-2 font-mono text-[var(--accent)]">03</strong> What state would let me reuse that work?</li>
              <li><strong className="mr-2 font-mono text-[var(--accent)]">04</strong> What invariant makes a move safe?</li>
            </ol>
          </section>
          <section className="panel p-5">
            <p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Session target</p>
            <div className="mt-3 flex items-end justify-between"><p className="metric-number text-3xl font-extrabold">{Math.min(sessionTotal, 5)}<span className="text-base text-[var(--text-faint)]"> / 5</span></p><Button size="sm" variant="ghost" onClick={resetSession}><RotateCcw size={13} /> Reset</Button></div>
            <ProgressBar value={(Math.min(sessionTotal, 5) / 5) * 100} className="mt-3" />
            <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Stop after five deliberate classifications. More guesses are not better evidence.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}