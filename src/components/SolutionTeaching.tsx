import { BookOpen, Braces, Lightbulb, Route, ShieldAlert } from 'lucide-react'
import {
  type CorePattern,
} from '../data/mentor-content'
import type { RoadmapProblem } from '../types'
import { getProblemTeachingGuide } from '../lib/problem-guides'
import { explainPythonLines } from '../lib/python-analysis'
import { Badge } from './ui'
import { PatternVisualizer } from './PatternVisualizer'

function TeachingBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">{label}</h3>
      <div className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{children}</div>
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="space-y-1.5">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />{item}</li>)}</ul>
}

export function SolutionTeaching({ problem, pattern }: { problem: RoadmapProblem; pattern: CorePattern }) {
  const resolved = getProblemTeachingGuide(problem)
  const guide = resolved.guide
  const intuition = guide.intuition
  const bruteForce = guide.bruteForce
  const whyBruteForceFails = guide.whyBruteForceFails
  const keyObservation = guide.keyObservation
  const derivation = guide.derivation
  const algorithm = guide.algorithm
  const python = guide.python
  const complexity = guide.complexity
  const mistakes = guide.commonMistakes
  const clues = guide.recognitionClues
  const variations = guide.variations
  const lineExplanations = explainPythonLines(python)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="violet">Solution teaching</Badge>
        <Badge tone="blue">Python first</Badge>
        <Badge tone={resolved.source === 'handcrafted' ? 'green' : 'neutral'}>{resolved.source === 'handcrafted' ? 'Handcrafted guide' : 'Deterministic pattern guide'}</Badge>
      </div>
      <PatternVisualizer pattern={pattern} />
      <section className="panel p-5">
        <div className="mb-5 flex items-center gap-2"><Lightbulb size={17} className="text-[var(--amber)]" /><h2 className="text-sm font-bold">Reasoning, not just code</h2></div>
        <div className="space-y-4">
          <TeachingBlock label="Problem intuition">{intuition}</TeachingBlock>
          <TeachingBlock label="Brute force">{bruteForce}</TeachingBlock>
          <TeachingBlock label="Why brute force fails">{whyBruteForceFails}</TeachingBlock>
          <TeachingBlock label="Key observation">{keyObservation}</TeachingBlock>
          <TeachingBlock label="Reusable pattern"><div className="flex items-center gap-2 text-[var(--text)]"><Route size={15} /> <strong>{pattern}</strong></div></TeachingBlock>
          <TeachingBlock label="How to derive it"><BulletList items={derivation} /></TeachingBlock>
          <TeachingBlock label="Algorithm"><ol className="space-y-1.5">{algorithm.map((item, index) => <li key={item} className="flex gap-3"><span className="metric-number font-mono text-[10px] font-bold text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></TeachingBlock>
        </div>
      </section>
      <section className="panel overflow-hidden">
        <header className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4"><Braces size={17} className="text-[var(--blue)]" /><div><h2 className="text-sm font-bold">Python implementation</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">Interview-readable, no clever shortcuts</p></div></header>
        <pre className="overflow-x-auto bg-[var(--surface-raised)] p-5 font-mono text-xs leading-6 text-[var(--text)]"><code>{python}</code></pre>
        <div className="border-t border-[var(--border)] px-5 py-4"><p className="text-[10px] font-extrabold uppercase text-[var(--text-faint)]">Complexity</p><p className="mt-1 text-sm text-[var(--text-muted)]">{complexity}</p></div>
      </section>
      <section className="panel overflow-hidden"><header className="border-b border-[var(--border)] px-5 py-4"><h2 className="text-sm font-bold">Line-by-line walkthrough</h2><p className="mt-0.5 text-[10px] text-[var(--text-faint)]">Read the role of each line before memorizing syntax.</p></header><div className="divide-y divide-[var(--border)]">{lineExplanations.map((line) => <div key={line.lineNumber} className="grid gap-2 px-5 py-3 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><div className="flex min-w-0 gap-3"><span className="metric-number font-mono text-[9px] text-[var(--text-faint)]">{String(line.lineNumber).padStart(2, '0')}</span><code className="min-w-0 whitespace-pre-wrap break-words font-mono text-[10px] text-[var(--text)]">{line.code.trim()}</code></div><p className="text-[10px] leading-4 text-[var(--text-muted)]">{line.explanation}</p></div>)}</div></section>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4"><div className="mb-3 flex items-center gap-2"><ShieldAlert size={16} className="text-[var(--red)]" /><h3 className="text-xs font-bold">Common mistakes</h3></div><BulletList items={mistakes} /></section>
        <section className="panel p-4"><div className="mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-[var(--amber)]" /><h3 className="text-xs font-bold">Recognition clues</h3></div><BulletList items={clues} /></section>
        <section className="panel p-4"><div className="mb-3 flex items-center gap-2"><BookOpen size={16} className="text-[var(--accent)]" /><h3 className="text-xs font-bold">Variations</h3></div><BulletList items={variations} /></section>
      </div>
    </div>
  )
}