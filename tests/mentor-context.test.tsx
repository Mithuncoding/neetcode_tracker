import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TrackerProvider } from '../src/context/TrackerContext'
import { useTracker } from '../src/context/useTracker'

function MentorEvidenceHarness() {
  const { state, completeDiagnostic, recordRecognition, recordGuidedSession, startYearPlan, togglePlanWeek, setMistakeResolved, recordAlgorithmLab } = useTracker()
  return (
    <div>
      <span data-testid="onboarding">{String(state.mentor.onboardingComplete)}</span>
      <span data-testid="recognition">{state.mentor.recognitionAttempts.length}</span>
      <span data-testid="sessions">{state.mentor.guidedSessions.length}</span>
      <span data-testid="mistakes">{state.mentor.mistakes.length}</span>
      <span data-testid="resolved-mistakes">{state.mentor.mistakes.filter((mistake) => mistake.resolvedAt).length}</span>
      <span data-testid="plan-started">{String(Boolean(state.mentor.yearPlanStartedAt))}</span>
      <span data-testid="plan-weeks">{state.mentor.completedPlanWeeks.join(',')}</span>
      <span data-testid="labs">{Object.keys(state.mentor.algorithmLab).length}</span>
      <button onClick={() => completeDiagnostic({ answers: [], recommendedLevel: 1 })}>Complete diagnostic</button>
      <button onClick={() => recordRecognition({ problemId: '0001-two-sum', selectedPattern: 'Arrays & Hashing', expectedPattern: 'Arrays & Hashing', correct: true, confidence: 4 })}>Record recognition</button>
      <button onClick={() => recordGuidedSession({
        problemId: '0001-two-sum',
        mode: 'guided',
        startedAt: '2026-09-02T09:00:00.000Z',
        hintLevelReached: 2,
        recognizedPattern: false,
        bruteForceCaptured: true,
        understandingScore: 75,
        derivationScore: 50,
        implementationCompleted: false,
        code: '',
        codeScore: null,
        explanation: '',
        explanationScore: null,
        failureReason: 'implementation',
        reflection: 'Could explain the map but could not implement it.',
      })}>Record guided failure</button>
      <button onClick={startYearPlan}>Start year plan</button>
      <button onClick={() => togglePlanWeek(1)}>Toggle week one</button>
      <button onClick={() => { const mistake = state.mentor.mistakes[0]; if (mistake) setMistakeResolved(mistake.id, true) }}>Resolve first mistake</button>
      <button onClick={() => recordAlgorithmLab({ sceneId: 'binary-search', framesViewed: 4, correctPredictions: 1, totalPredictions: 1 })}>Complete algorithm lab</button>
    </div>
  )
}

describe('mentor evidence persistence actions', () => {
  it('records diagnostic, recognition, session, and error-memory evidence', async () => {
    const user = userEvent.setup()
    render(<TrackerProvider><MentorEvidenceHarness /></TrackerProvider>)

    await user.click(screen.getByRole('button', { name: 'Complete diagnostic' }))
    await user.click(screen.getByRole('button', { name: 'Record recognition' }))
    await user.click(screen.getByRole('button', { name: 'Record guided failure' }))
    await user.click(screen.getByRole('button', { name: 'Start year plan' }))
    await user.click(screen.getByRole('button', { name: 'Toggle week one' }))

    expect(screen.getByTestId('onboarding')).toHaveTextContent('true')
    expect(screen.getByTestId('recognition')).toHaveTextContent('1')
    expect(screen.getByTestId('sessions')).toHaveTextContent('1')
    expect(screen.getByTestId('mistakes')).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Resolve first mistake' }))
    expect(screen.getByTestId('resolved-mistakes')).toHaveTextContent('1')
    expect(screen.getByTestId('plan-started')).toHaveTextContent('true')
    expect(screen.getByTestId('plan-weeks')).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Complete algorithm lab' }))
    expect(screen.getByTestId('labs')).toHaveTextContent('1')
  })
})