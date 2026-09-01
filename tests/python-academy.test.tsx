import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TrackerProvider } from '../src/context/TrackerContext'
import { useTracker } from '../src/context/useTracker'
import { PythonAcademyPage } from '../src/pages/PythonAcademyPage'

function CourseHarness() {
  const { recordPythonLesson } = useTracker()
  const location = useLocation()
  return (
    <>
      <span data-testid="location">{location.pathname}{location.search}</span>
      <button type="button" onClick={() => recordPythonLesson({ lessonId: 'hello-world', code: 'message = "Hello, LeetCode!"', challengePassed: true, quizCorrect: true, ranCode: true, complete: true })}>Complete first lesson</button>
      <PythonAcademyPage />
    </>
  )
}

describe('Python Academy navigation', () => {
  it('pins the selected lesson until the learner explicitly continues', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/mentor/python']}>
        <TrackerProvider>
          <Routes><Route path="/mentor/python" element={<CourseHarness />} /></Routes>
        </TrackerProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/mentor/python?lesson=hello-world'))
    await user.click(screen.getByRole('button', { name: 'Complete first lesson' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/mentor/python?lesson=hello-world')
    expect(screen.getByRole('heading', { level: 1, name: 'Hello, Python' })).toBeInTheDocument()
    expect(screen.getByText('Lessons mastered').previousElementSibling).toHaveTextContent('1 / 48')
  })
})