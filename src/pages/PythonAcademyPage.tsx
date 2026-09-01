import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Box,
  Check,
  ChevronLeft,
  Code2,
  Eye,
  LockKeyhole,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, EmptyState, IconButton, PageHeader, ProgressBar } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  PYTHON_LESSONS,
  PYTHON_LESSON_BY_ID,
  PYTHON_MODULES,
  getNextPythonLesson,
  getPreviousPythonLesson,
  type PythonLesson,
} from '../data/python-course'
import { getPythonSyntaxErrorLines } from '../lib/python-analysis'
import { runPythonLessonCode, type PythonRunResult } from '../lib/python-runtime'
import { cn } from '../lib/utils'

function CourseRail({ lesson, onSelect }: { lesson: PythonLesson; onSelect: (lessonId: string) => void }) {
  const { state } = useTracker()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const completed = new Set(Object.values(state.mentor.pythonCourse).filter((record) => record.completedAt).map((record) => record.lessonId))
  return (
    <aside className="hidden min-w-0 space-y-3 xl:sticky xl:top-4 xl:block xl:self-start">
      <div className="panel p-3"><div className="flex h-9 items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface-raised)] px-3"><Search size={14} className="text-[var(--text-faint)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs" placeholder="Find a Python lesson" /></div></div>
      {PYTHON_MODULES.map((module, moduleIndex) => {
        const visible = module.lessons.filter((item) => !normalized || `${item.title} ${item.summary} ${item.concepts.join(' ')}`.toLowerCase().includes(normalized))
        if (!visible.length) return null
        const moduleCompleted = module.lessons.filter((item) => completed.has(item.id)).length
        return <section key={module.id} className="panel overflow-hidden"><header className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5"><div className="flex items-center justify-between gap-2"><div><p className="font-mono text-[9px] font-bold text-[var(--accent)]">MODULE {String(moduleIndex + 1).padStart(2, '0')}</p><h2 className="mt-0.5 text-xs font-bold">{module.title}</h2></div><span className="metric-number text-[9px] font-bold text-[var(--text-faint)]">{moduleCompleted}/4</span></div><ProgressBar value={moduleCompleted / 4 * 100} className="mt-2" /></header><div className="divide-y divide-[var(--border)]">{visible.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={cn('flex w-full items-center gap-3 px-3 py-3 text-left', lesson.id === item.id ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'hover:bg-[var(--surface-raised)]')}><span className={cn('metric-number flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[9px]', completed.has(item.id) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'border-[var(--border-strong)] text-[var(--text-faint)]')}>{completed.has(item.id) ? <Check size={11} /> : PYTHON_LESSONS.find((entry) => entry.id === item.id)?.order}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.title}</p><p className="mt-0.5 truncate text-[9px] text-[var(--text-faint)]">{item.concepts.slice(0, 3).join(' · ')}</p></div></button>)}</div></section>
      })}
    </aside>
  )
}

function CompactCoursePicker({ lesson, onSelect }: { lesson: PythonLesson; onSelect: (lessonId: string) => void }) {
  const { state } = useTracker()
  const completed = Object.values(state.mentor.pythonCourse).filter((record) => record.completedAt).length
  return (
    <section className="panel p-4 xl:hidden">
      <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpenCheck size={15} className="text-[var(--accent)]" /><p className="text-xs font-bold">Course navigator</p></div><Badge tone="green">{completed}/48</Badge></div>
      <select aria-label="Choose Python lesson" value={lesson.id} onChange={(event) => onSelect(event.target.value)} className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-xs font-semibold">
        {PYTHON_MODULES.map((module, moduleIndex) => <optgroup key={module.id} label={`${String(moduleIndex + 1).padStart(2, '0')} · ${module.title}`}>{module.lessons.map((item) => <option key={item.id} value={item.id}>{PYTHON_LESSONS.find((entry) => entry.id === item.id)?.order}. {item.title}{state.mentor.pythonCourse[item.id]?.completedAt ? ' [mastered]' : ''}</option>)}</optgroup>)}
      </select>
    </section>
  )
}

function LessonWorkspace({ lesson, onSelect }: { lesson: (typeof PYTHON_LESSONS)[number]; onSelect: (lessonId: string) => void }) {
  const { state, recordPythonLesson } = useTracker()
  const navigate = useNavigate()
  const saved = state.mentor.pythonCourse[lesson.id]
  const [code, setCode] = useState(saved?.lastCode || lesson.starterCode)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<PythonRunResult | null>(null)
  const [challengePassed, setChallengePassed] = useState(Boolean(saved?.challengePassed))
  const [quizSelection, setQuizSelection] = useState<number | null>(null)
  const [quizResult, setQuizResult] = useState<boolean | null>(saved?.quizCorrect ?? null)
  const [solutionVisible, setSolutionVisible] = useState(false)
  const previous = getPreviousPythonLesson(lesson.id)
  const next = getNextPythonLesson(lesson.id)
  const syntaxErrors = getPythonSyntaxErrorLines(code)
  const attempts = saved?.runs ?? 0
  const completed = Boolean(saved?.completedAt) || challengePassed && quizResult === true

  const saveProgress = (overrides: { passed?: boolean; quiz?: boolean | null; ran?: boolean; complete?: boolean } = {}) => {
    const passed = overrides.passed ?? challengePassed
    const quizCorrect = overrides.quiz === undefined ? quizResult : overrides.quiz
    recordPythonLesson({
      lessonId: lesson.id,
      code,
      challengePassed: passed,
      quizCorrect,
      ranCode: overrides.ran ?? false,
      complete: overrides.complete ?? (passed && quizCorrect === true),
    })
  }

  const runChallenge = async () => {
    if (running || syntaxErrors.length) return
    setRunning(true)
    setRunResult(null)
    try {
      const result = await runPythonLessonCode(code, lesson.tests)
      setRunResult(result)
      setChallengePassed(result.ok)
      saveProgress({ passed: result.ok, ran: true, complete: result.ok && quizResult === true })
    } catch (error) {
      const result = { ok: false, output: error instanceof Error ? error.message : 'Python execution failed.', usedBuiltInTests: true }
      setRunResult(result)
      saveProgress({ passed: false, ran: true })
    } finally {
      setRunning(false)
    }
  }

  const checkQuiz = () => {
    if (quizSelection === null) return
    const correct = quizSelection === lesson.quiz.answer
    setQuizResult(correct)
    saveProgress({ quiz: correct, complete: challengePassed && correct })
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge tone="blue">Lesson {lesson.order}/48</Badge>{completed && <Badge tone="green">Mastered</Badge>}{lesson.labSceneId && <Badge tone="violet">3D available</Badge>}</div><div className="flex gap-2"><IconButton icon={ChevronLeft} label="Previous Python lesson" disabled={!previous} onClick={() => previous && onSelect(previous.id)} /><IconButton icon={ArrowRight} label="Next Python lesson" disabled={!next} onClick={() => next && onSelect(next.id)} /></div></div><h1 className="mt-4 text-2xl font-bold">{lesson.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{lesson.summary}</p><div className="mt-4 flex flex-wrap gap-1.5">{lesson.concepts.map((concept) => <Badge key={concept} tone="neutral">{concept}</Badge>)}</div></header><div className="p-5"><div className="flex items-start gap-3"><BookOpenCheck size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" /><div><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Why this matters</p><p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{lesson.why}</p></div></div>{lesson.labSceneId && <Button className="mt-5" variant="secondary" onClick={() => navigate(`/mentor/lab?scene=${lesson.labSceneId}`)}><Box size={15} /> Explore this concept in 3D</Button>}</div></section>

      <section className="panel overflow-hidden"><header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4"><Code2 size={17} className="text-[var(--blue)]" /><div><h2 className="text-sm font-bold">Worked example</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">Read each line, predict output, then run a variation yourself.</p></div></header><pre className="overflow-x-auto bg-[var(--surface-raised)] p-5 font-mono text-xs leading-6"><code>{lesson.example}</code></pre></section>

      <section className="panel overflow-hidden"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4"><div className="flex items-center gap-2"><TerminalSquare size={17} className="text-[var(--accent)]" /><div><h2 className="text-sm font-bold">Executable challenge</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{lesson.challenge}</p></div></div><div className="flex flex-wrap gap-2">{syntaxErrors.length > 0 && <Badge tone="red">Syntax near line {syntaxErrors.join(', ')}</Badge>}{challengePassed && <Badge tone="green">Checks passed</Badge>}<Button size="sm" onClick={runChallenge} disabled={running || syntaxErrors.length > 0}><Play size={14} /> {running ? 'Loading Python...' : 'Run lesson checks'}</Button></div></header><textarea aria-label="Python lesson code" value={code} onChange={(event) => { setCode(event.target.value); setRunResult(null) }} onBlur={() => saveProgress()} spellCheck={false} className="min-h-72 w-full resize-y bg-[var(--surface)] p-5 font-mono text-xs leading-6" />{runResult && <div className={cn('border-t px-5 py-4', runResult.ok ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--red)] bg-[var(--red-soft)]')}><p className={cn('text-[10px] font-extrabold uppercase', runResult.ok ? 'text-[var(--accent-strong)]' : 'text-[var(--red)]')}>{runResult.ok ? 'All lesson checks passed' : 'A lesson check failed'}</p><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-5">{runResult.output}</pre></div>}<footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3"><p className="text-[9px] leading-4 text-[var(--text-faint)]">Runs in a timed Pyodide Web Worker. First use downloads the Python runtime.</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => { setCode(lesson.starterCode); setRunResult(null) }}><RotateCcw size={13} /> Reset starter</Button><Button size="sm" variant="secondary" disabled={attempts < 2 && !challengePassed} onClick={() => setSolutionVisible((value) => !value)}>{solutionVisible ? <Eye size={13} /> : <LockKeyhole size={13} />} {solutionVisible ? 'Hide reference' : attempts < 2 && !challengePassed ? `Reference after ${2 - attempts} attempt${2 - attempts === 1 ? '' : 's'}` : 'Reveal reference'}</Button></div></footer>{solutionVisible && <div className="border-t border-[var(--amber)] bg-[var(--amber-soft)] p-5"><p className="text-[10px] font-extrabold uppercase text-[var(--amber)]">Reference solution · close it before retyping</p><pre className="mt-3 overflow-x-auto font-mono text-xs leading-6"><code>{lesson.solution}</code></pre></div>}</section>

      <section className="panel p-5"><div className="flex items-center gap-2"><Sparkles size={16} className="text-[var(--amber)]" /><h2 className="text-sm font-bold">Understanding check</h2></div><p className="mt-3 text-sm font-semibold">{lesson.quiz.prompt}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{lesson.quiz.options.map((option, index) => <button key={option} type="button" disabled={quizResult === true} onClick={() => { setQuizSelection(index); if (quizResult === false) setQuizResult(null) }} className={cn('rounded-[6px] border px-3 py-3 text-left text-xs font-semibold', quizResult !== null && index === lesson.quiz.answer ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : quizResult === false && quizSelection === index ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : quizSelection === index ? 'border-[var(--amber)] bg-[var(--amber-soft)]' : 'border-[var(--border)] bg-[var(--surface-raised)]')}>{option}</button>)}</div>{quizResult === null ? <Button className="mt-3" size="sm" onClick={checkQuiz} disabled={quizSelection === null}>Check understanding</Button> : <div className={cn('mt-3 rounded-[6px] p-3 text-xs leading-5', quizResult ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-[var(--red-soft)] text-[var(--red)]')}><strong>{quizResult ? 'Correct. ' : 'Try again. '}</strong>{lesson.quiz.explanation}</div>}</section>

      <section className={cn('panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center', completed ? 'border-[var(--accent)]' : '')}><div className="flex-1"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Lesson gate</p><h2 className="mt-1 text-sm font-bold">{completed ? 'Lesson mastered' : 'Pass the code checks and understanding question.'}</h2><div className="mt-3 flex gap-2"><Badge tone={challengePassed ? 'green' : 'neutral'}>{challengePassed ? 'Code passed' : 'Code pending'}</Badge><Badge tone={quizResult ? 'green' : 'neutral'}>{quizResult ? 'Quiz passed' : 'Quiz pending'}</Badge></div></div>{completed && next ? <Button onClick={() => onSelect(next.id)}>Continue to {next.title} <ArrowRight size={15} /></Button> : !next && completed ? <Button onClick={() => navigate('/mentor/curriculum')}>Enter DSA curriculum <ArrowRight size={15} /></Button> : null}</section>
    </div>
  )
}

export function PythonAcademyPage() {
  const { state } = useTracker()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('lesson')
  const lesson = PYTHON_LESSON_BY_ID.get(requested ?? '') ?? PYTHON_LESSONS.find((item) => !state.mentor.pythonCourse[item.id]?.completedAt) ?? PYTHON_LESSONS[0]
  const completed = Object.values(state.mentor.pythonCourse).filter((record) => record.completedAt).length
  const navigate = useNavigate()
  const select = (lessonId: string) => setSearchParams({ lesson: lessonId })

  useEffect(() => {
    if (requested !== lesson.id) setSearchParams({ lesson: lesson.id }, { replace: true })
  }, [lesson.id, requested, setSearchParams])

  return (
    <div className="page-content">
      <PageHeader title="Python Zero to Interview" description="48 executable lessons from your first statement to interview-grade Python." actions={<><Button variant="secondary" onClick={() => navigate('/mentor')}><ArrowLeft size={15} /> Mentor</Button><Button onClick={() => navigate('/mentor/lab?scene=python-execution')}><Box size={15} /> Python in 3D</Button></>} />
      <section className="panel mb-4 overflow-hidden"><div className="grid gap-px bg-[var(--border)] sm:grid-cols-[1fr_220px]"><div className="bg-[var(--surface)] p-5"><div className="flex items-center gap-2"><Badge tone="green">Strong base first</Badge><span className="text-[10px] font-bold uppercase text-[var(--text-faint)]">Not part of the 250-problem count</span></div><h2 className="mt-3 text-lg font-bold">Learn Python itself before fighting Medium problems.</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">The NeetCode 250 remains a practice backbone. This separate course teaches the language and tools required to use that backbone effectively.</p></div><div className="bg-[var(--surface-raised)] p-5"><p className="metric-number text-3xl font-extrabold">{completed}<span className="text-base text-[var(--text-faint)]"> / 48</span></p><p className="mt-1 text-[10px] font-bold uppercase text-[var(--text-faint)]">Lessons mastered</p><ProgressBar value={completed / 48 * 100} className="mt-4" /></div></div></section>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]"><CompactCoursePicker lesson={lesson} onSelect={select} /><CourseRail lesson={lesson} onSelect={select} /><LessonWorkspace key={lesson.id} lesson={lesson} onSelect={select} /></div>
      {!lesson && <section className="panel"><EmptyState title="Lesson unavailable" description="Choose a Python lesson from the course rail." /></section>}
    </div>
  )
}