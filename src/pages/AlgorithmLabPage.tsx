import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlgorithmScene3D } from '../components/AlgorithmScene3D'
import { Badge, Button, IconButton } from '../components/ui'
import { useTracker } from '../context/useTracker'
import {
  ALGORITHM_CATEGORIES,
  ALGORITHM_SCENES,
  ALGORITHM_SCENE_BY_ID,
  type AlgorithmCategory,
  type SceneQuiz,
} from '../data/algorithm-scenes'
import { cn } from '../lib/utils'

const SPEEDS = [0.5, 1, 1.5, 2] as const

function ComplexityPanel({ scene }: { scene: (typeof ALGORITHM_SCENES)[number] }) {
  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-white/10 bg-white/10 sm:grid-cols-4">
      {[
        ['Best', scene.complexity.best],
        ['Average', scene.complexity.average],
        ['Worst', scene.complexity.worst],
        ['Space', scene.complexity.space],
      ].map(([label, value]) => <div key={label} className="bg-[#17191d] p-3"><p className="font-mono text-xs font-bold text-white">{value}</p><p className="mt-1 text-[9px] font-bold uppercase text-white/35">{label}</p></div>)}
    </section>
  )
}

function PredictionGate({ quiz, onAnswer }: { quiz: SceneQuiz; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const submit = () => {
    if (selected === null || revealed) return
    setRevealed(true)
    onAnswer(selected === quiz.answer)
  }
  return (
    <section className="rounded-[7px] border border-[var(--amber)] bg-[var(--amber-soft)] p-4">
      <div className="flex items-center gap-2"><Sparkles size={15} className="text-[var(--amber)]" /><p className="text-[10px] font-extrabold uppercase text-[var(--amber)]">Predict before advancing</p></div>
      <h3 className="mt-2 text-sm font-bold">{quiz.prompt}</h3>
      <div className="mt-3 grid gap-2">{quiz.options.map((option, index) => <button key={option} type="button" disabled={revealed} onClick={() => setSelected(index)} className={cn('rounded-[5px] border px-3 py-2 text-left text-xs font-semibold', revealed && index === quiz.answer ? 'border-[var(--green)] bg-[var(--green-soft)] text-[var(--green-strong)]' : revealed && selected === index ? 'border-[var(--red)] bg-[var(--red-soft)] text-[var(--red)]' : selected === index ? 'border-[var(--amber)] bg-[var(--surface)]' : 'border-[var(--border)] bg-[var(--surface)]')}>{option}</button>)}</div>
      {revealed ? <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{quiz.explanation}</p> : <Button className="mt-3" size="sm" onClick={submit} disabled={selected === null}>Lock prediction</Button>}
    </section>
  )
}

export function AlgorithmLabPage() {
  const { state, recordAlgorithmLab } = useTracker()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedScene = searchParams.get('scene')
  const sceneId = ALGORITHM_SCENE_BY_ID.has(requestedScene ?? '') ? requestedScene as string : 'binary-search'
  const [category, setCategory] = useState<AlgorithmCategory | 'All'>('All')
  const [query, setQuery] = useState('')
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1)
  const [quizResolved, setQuizResolved] = useState<Record<string, boolean>>({})
  const [correctPredictions, setCorrectPredictions] = useState(0)
  const [totalPredictions, setTotalPredictions] = useState(0)
  const [catalogueOpen, setCatalogueOpen] = useState(false)
  const [cameraResetToken, setCameraResetToken] = useState(0)
  const scene = ALGORITHM_SCENE_BY_ID.get(sceneId) ?? ALGORITHM_SCENES[0]
  const frame = scene.frames[Math.min(frameIndex, scene.frames.length - 1)]
  const quizKey = `${scene.id}:${frameIndex}`
  const quizBlocking = Boolean(frame.quiz && !quizResolved[quizKey])
  const record = state.mentor.algorithmLab[scene.id]
  const completedCount = Object.keys(state.mentor.algorithmLab).length
  const filtered = ALGORITHM_SCENES.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category
    const normalized = query.trim().toLowerCase()
    return matchesCategory && (!normalized || `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(normalized))
  })

  const selectScene = (nextId: string) => {
    setSearchParams({ scene: nextId })
    setFrameIndex(0)
    setPlaying(false)
    setCorrectPredictions(0)
    setTotalPredictions(0)
    setCameraResetToken(0)
    setCatalogueOpen(false)
  }

  const completeScene = () => {
    recordAlgorithmLab({
      sceneId: scene.id,
      framesViewed: scene.frames.length,
      correctPredictions,
      totalPredictions,
    })
  }

  const moveFrame = (direction: -1 | 1) => {
    if (direction > 0 && quizBlocking) return
    setFrameIndex((current) => Math.max(0, Math.min(scene.frames.length - 1, current + direction)))
  }

  useEffect(() => {
    if (!playing || quizBlocking || frameIndex >= scene.frames.length - 1) return
    const timeout = window.setTimeout(() => setFrameIndex((current) => {
      const next = Math.min(scene.frames.length - 1, current + 1)
      if (next === scene.frames.length - 1) setPlaying(false)
      return next
    }), 1700 / speed)
    return () => window.clearTimeout(timeout)
  }, [frameIndex, playing, quizBlocking, scene.frames.length, speed])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowRight') moveFrame(1)
      if (event.key === 'ArrowLeft') moveFrame(-1)
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      }
      if (event.key.toLowerCase() === 'r') setFrameIndex(0)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="min-h-screen bg-[#0d0e10] text-white">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/10 bg-[#0d0e10]/95 px-3 backdrop-blur-md sm:px-5">
        <IconButton icon={ArrowLeft} label="Return to Mentor" onClick={() => navigate('/mentor')} className="border-white/10 bg-white/5 text-white/70 hover:border-[#ff745e] hover:text-[#ff9a87]" />
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Box size={16} className="text-[#ff745e]" /><p className="truncate text-sm font-extrabold">Visual Pattern Lab</p></div><p className="mt-0.5 truncate text-[9px] font-bold uppercase text-white/35">{completedCount}/{ALGORITHM_SCENES.length} worlds completed</p></div>
        <Button size="sm" variant="secondary" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setCatalogueOpen(true)}><Search size={14} /> Catalogue</Button>
        <div className="hidden items-center gap-2 text-[10px] font-bold text-white/40 sm:flex"><span>← → step</span><span>Space play</span><span>R reset</span></div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-white/10 bg-[#15171a] transition-transform lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] lg:w-auto lg:translate-x-0', catalogueOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4 lg:hidden"><p className="flex-1 text-sm font-bold">Algorithm catalogue</p><IconButton icon={X} label="Close catalogue" onClick={() => setCatalogueOpen(false)} className="border-white/10 bg-white/5 text-white" /></div>
          <div className="border-b border-white/10 p-3"><div className="flex h-9 items-center gap-2 rounded-[6px] border border-white/10 bg-white/5 px-3"><Search size={14} className="text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-white/25" placeholder="Find an algorithm" /></div><div className="mt-2 flex gap-1 overflow-x-auto pb-1">{(['All', ...ALGORITHM_CATEGORIES] as const).map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cn('shrink-0 rounded-[4px] px-2 py-1 text-[9px] font-bold', category === item ? 'bg-[#ff745e] text-[#211815]' : 'bg-white/5 text-white/45 hover:text-white')}>{item}</button>)}</div></div>
          <div className="flex-1 overflow-y-auto p-2">{filtered.map((item) => {
            const completed = Boolean(state.mentor.algorithmLab[item.id])
            return <button key={item.id} type="button" onClick={() => selectScene(item.id)} className={cn('mb-1 flex w-full items-center gap-3 rounded-[6px] px-3 py-3 text-left transition-colors', scene.id === item.id ? 'bg-[#3b2421] text-[#ff9a87]' : 'text-white/55 hover:bg-white/5 hover:text-white')}><span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border', completed ? 'border-[#55c5a0] bg-[#19352d] text-[#86dbbe]' : 'border-white/10 bg-white/5')} >{completed ? <Check size={13} /> : <Box size={12} />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.title}</p><p className="mt-0.5 truncate text-[9px] text-white/30">{item.category} · {item.frames.length} frames</p></div></button>
          })}{!filtered.length && <p className="px-3 py-10 text-center text-xs text-white/35">No matching algorithms</p>}</div>
          <div className="border-t border-white/10 p-4"><div className="mb-2 flex justify-between text-[9px] font-bold uppercase text-white/35"><span>Visual curriculum</span><span>{Math.round(completedCount / ALGORITHM_SCENES.length * 100)}%</span></div><div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#ff745e]" style={{ width: `${completedCount / ALGORITHM_SCENES.length * 100}%` }} /></div></div>
        </aside>
        {catalogueOpen && <button type="button" aria-label="Close catalogue overlay" className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={() => setCatalogueOpen(false)} />}

        <main className="min-w-0">
          <section className="grid border-b border-white/10 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
            <div className="relative h-[52vh] min-h-[380px] overflow-hidden xl:h-[calc(100vh-13rem)] xl:min-h-[560px]">
              <AlgorithmScene3D key={`${scene.id}:${cameraResetToken}`} frame={frame} sceneId={scene.id} />
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6"><div className="max-w-xl"><div className="flex flex-wrap gap-2"><Badge tone="green">{scene.category}</Badge><Badge tone="blue">{scene.level}</Badge>{record && <Badge tone="violet">Completed</Badge>}</div><h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">{scene.title}</h1><p className="mt-2 max-w-lg text-xs leading-5 text-white/50 sm:text-sm">{scene.summary}</p></div><div className="hidden rounded-[6px] border border-white/10 bg-black/25 px-3 py-2 text-right backdrop-blur sm:block"><p className="font-mono text-sm font-bold">{frameIndex + 1}/{scene.frames.length}</p><p className="text-[9px] uppercase text-white/35">frame</p></div></div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d0e10] via-[#0d0e10]/80 to-transparent px-4 pb-4 pt-20 sm:px-6"><p className="text-[10px] font-extrabold uppercase text-[#ff9a87]">{frame.title}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-white/75">{frame.narration}</p></div>
            </div>

            <aside className="border-t border-white/10 bg-[#15171a] p-4 xl:max-h-[calc(100vh-13rem)] xl:overflow-y-auto xl:border-l xl:border-t-0 sm:p-5">
              <div className="flex items-center gap-2"><BookOpenCheck size={16} className="text-[#ff745e]" /><p className="text-[10px] font-extrabold uppercase text-white/35">Mental model</p></div><p className="mt-2 text-sm leading-6 text-white/72">{scene.mentalModel}</p>
              <div className="mt-5"><p className="text-[10px] font-extrabold uppercase text-white/35">Invariant right now</p><p className="mt-2 rounded-[6px] border border-[#ff745e]/25 bg-[#3b2421] p-3 text-xs leading-5 text-[#ffb3a5]">{frame.invariant}</p></div>
              <div className="mt-4"><p className="text-[10px] font-extrabold uppercase text-white/35">Code lens</p><pre className="mt-2 overflow-x-auto rounded-[6px] border border-white/10 bg-black/25 p-3 font-mono text-[10px] leading-5 text-white/70"><code>{frame.code}</code></pre></div>
              <div className="mt-5"><p className="mb-2 text-[10px] font-extrabold uppercase text-white/35">Complexity</p><ComplexityPanel scene={scene} /></div>
              {scene.category === 'Sorting' && <div className="mt-4 flex flex-wrap gap-2"><Badge tone={scene.stable ? 'green' : 'amber'}>{scene.stable ? 'Stable sort' : 'Unstable sort'}</Badge><Badge tone={scene.inPlace ? 'blue' : 'violet'}>{scene.inPlace ? 'In-place' : 'Extra memory'}</Badge></div>}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><div><p className="text-[10px] font-extrabold uppercase text-white/35">Use it when</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-white/55">{scene.useWhen.map((item) => <li key={item}>· {item}</li>)}</ul></div><div><p className="text-[10px] font-extrabold uppercase text-white/35">Common traps</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-white/55">{scene.pitfalls.map((item) => <li key={item}>· {item}</li>)}</ul></div></div>
              {frame.quiz && !quizResolved[quizKey] && <div className="mt-5"><PredictionGate key={quizKey} quiz={frame.quiz} onAnswer={(correct) => { setQuizResolved((items) => ({ ...items, [quizKey]: true })); setTotalPredictions((value) => value + 1); if (correct) setCorrectPredictions((value) => value + 1) }} /></div>}
            </aside>
          </section>

          <footer className="sticky bottom-0 z-30 border-t border-white/10 bg-[#0d0e10]/95 px-3 py-3 backdrop-blur sm:px-5">
            <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3"><IconButton icon={RotateCcw} label="Restart animation" onClick={() => { setFrameIndex(0); setPlaying(false) }} className="border-white/10 bg-white/5 text-white/60 hover:text-white" /><IconButton icon={ChevronLeft} label="Previous frame" onClick={() => moveFrame(-1)} disabled={frameIndex === 0} className="border-white/10 bg-white/5 text-white/60 hover:text-white" /><button type="button" aria-label={playing ? 'Pause animation' : 'Play animation'} onClick={() => { if (frameIndex === scene.frames.length - 1) { setFrameIndex(0); setPlaying(true) } else setPlaying((value) => !value) }} disabled={quizBlocking} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4ec08c] text-[#07100b] transition-transform hover:scale-105 disabled:opacity-40">{playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}</button><IconButton icon={ChevronRight} label="Next frame" onClick={() => moveFrame(1)} disabled={frameIndex === scene.frames.length - 1 || quizBlocking} className="border-white/10 bg-white/5 text-white/60 hover:text-white" /><div className="min-w-0 flex-1 px-1"><input aria-label="Animation frame" type="range" min={0} max={scene.frames.length - 1} value={frameIndex} disabled={quizBlocking} onChange={(event) => { setPlaying(false); setFrameIndex(Number(event.target.value)) }} className="w-full accent-[#4ec08c] disabled:opacity-35" /><div className="mt-0.5 flex justify-between text-[8px] font-bold uppercase text-white/25"><span>Start</span><span>{Math.round((frameIndex + 1) / scene.frames.length * 100)}%</span><span>Result</span></div></div><div className="hidden rounded-[6px] border border-white/10 bg-white/5 p-1 sm:flex">{SPEEDS.map((value) => <button key={value} type="button" onClick={() => setSpeed(value)} className={cn('h-7 min-w-9 rounded-[4px] px-2 font-mono text-[9px] font-bold', speed === value ? 'bg-white text-[#07100b]' : 'text-white/40')}>{value}x</button>)}</div>{frameIndex === scene.frames.length - 1 ? <Button size="sm" onClick={completeScene}><Check size={14} /> Complete</Button> : <IconButton icon={Maximize2} label="Reset 3D camera" onClick={() => setCameraResetToken((value) => value + 1)} className="hidden border-white/10 bg-white/5 text-white/60 hover:text-white sm:inline-flex" />}</div>
            {quizBlocking && <p className="mt-2 text-center text-[9px] font-bold text-[#f0ac4f]">Answer the prediction checkpoint to continue.</p>}
          </footer>
        </main>
      </div>
    </div>
  )
}