import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '../src/components/ui'
import { TrackerProvider } from '../src/context/TrackerContext'
import { useTracker } from '../src/context/useTracker'
import { listBackups, rotateBackups } from '../src/lib/backups'
import { createInitialState } from '../src/lib/storage'

function UndoHarness() {
  const { state, quickSolve, canUndo, undo, resetAll } = useTracker()
  return <div><span data-testid="attempts">{state.attempts.length}</span><button onClick={() => quickSolve('0001-two-sum')}>Quick solve</button><button disabled={!canUndo} onClick={undo}>Undo</button><button onClick={resetAll}>Reset all</button></div>
}

function ModalHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Opener</button><Modal open={open} onClose={() => { setOpen(false); onClose() }} title="Test dialog"><div><button>First action</button><button>Last action</button></div></Modal></>
}

describe('critical interactions', () => {
  it('undoes one-click solve state', async () => {
    const user = userEvent.setup()
    render(<TrackerProvider><UndoHarness /></TrackerProvider>)
    await user.click(screen.getByRole('button', { name: 'Quick solve' }))
    expect(screen.getByTestId('attempts')).toHaveTextContent('1')
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByTestId('attempts')).toHaveTextContent('0')
  })

  it('traps focus, closes on Escape, and restores the opener', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Opener' }))
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Opener' })).toHaveFocus()
  })

  it('clears rotating recovery history on reset all', async () => {
    rotateBackups(createInitialState(), 5)
    const user = userEvent.setup()
    render(<TrackerProvider><UndoHarness /></TrackerProvider>)
    expect(listBackups()).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Reset all' }))
    expect(listBackups()).toHaveLength(0)
  })
})