export interface ReasoningCheck {
  label: string
  met: boolean
  prompt: string
}

export interface ReasoningAnalysis {
  understandingScore: number
  derivationScore: number
  understandingChecks: ReasoningCheck[]
  derivationChecks: ReasoningCheck[]
  nextQuestion: string
}

export function analyzeReasoning(understanding: string, bruteForce: string): ReasoningAnalysis {
  const understood = understanding.trim().toLowerCase()
  const brute = bruteForce.trim().toLowerCase()
  const understandingChecks: ReasoningCheck[] = [
    { label: 'Objective', met: understood.length >= 40 && /return|find|compute|determine|output|need|goal/.test(understood), prompt: 'What exact value, index, collection, or boolean must be returned?' },
    { label: 'Input structure', met: /array|string|list|tree|graph|grid|matrix|node|interval|number|input/.test(understood), prompt: 'What is the input structure and which properties does it guarantee?' },
    { label: 'Constraint or ordering', met: /constraint|sorted|contiguous|adjacent|unique|duplicate|positive|negative|directed|undirected|order/.test(understood), prompt: 'Which input constraint changes what algorithms are possible?' },
    { label: 'Edge case', met: /edge|empty|single|none|null|duplicate|zero|negative|boundary|one element/.test(understood), prompt: 'What smallest, empty, duplicate, or boundary case could break an assumption?' },
  ]
  const derivationChecks: ReasoningCheck[] = [
    { label: 'Correctness-first approach', met: brute.length >= 15 && /brute|try|scan|loop|recursive|enumerate|every|all|compare/.test(brute), prompt: 'What is the most direct correct approach if efficiency does not matter?' },
    { label: 'Complexity', met: /o\s*\([^)]+\)|linear|quadratic|exponential|logarithmic/.test(brute), prompt: 'What are the time and auxiliary-space costs of that direct approach?' },
    { label: 'Repeated work', met: /repeat|again|recompute|rescan|nested|same|duplicate work|bottleneck/.test(brute), prompt: 'Which calculation, lookup, range, or subproblem is repeated?' },
    { label: 'Optimization direction', met: /store|remember|cache|sort|pointer|window|prefix|stack|queue|heap|memo|prune|binary/.test(brute), prompt: 'What information could be stored or maintained so that repeated work disappears?' },
  ]
  const score = (checks: ReasoningCheck[]) => Math.round(checks.filter((check) => check.met).length / checks.length * 100)
  const next = [...understandingChecks, ...derivationChecks].find((check) => !check.met)
  return {
    understandingScore: score(understandingChecks),
    derivationScore: score(derivationChecks),
    understandingChecks,
    derivationChecks,
    nextQuestion: next?.prompt ?? 'Which invariant proves that every state update preserves a possible answer?',
  }
}