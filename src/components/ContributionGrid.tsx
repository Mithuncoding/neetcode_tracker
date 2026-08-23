import { eachDayOfInterval, format, startOfWeek, subDays } from 'date-fns'
import type { DailyActivity } from '../types'
import { dateKey } from '../lib/utils'

export function ContributionGrid({
  activity,
  days = 84,
  selectedDate,
  onSelect,
}: {
  activity: DailyActivity[]
  days?: number
  selectedDate?: string
  onSelect?: (date: string) => void
}) {
  const end = new Date()
  const requestedStart = subDays(end, days - 1)
  const start = startOfWeek(requestedStart, { weekStartsOn: 1 })
  const dates = eachDayOfInterval({ start, end })
  const byDate = new Map(activity.map((item) => [item.date, item]))

  return (
    <div className="overflow-x-auto overflow-y-hidden pb-2">
      <div className="contribution-grid" aria-label={`${days} day activity graph`}>
        {dates.map((date) => {
          const key = dateKey(date)
          const day = byDate.get(key)
          const solved = day?.solvedProblemIds.length ?? 0
          const attempted = day?.attemptedProblemIds.length ?? 0
          const level = solved >= 3 ? 4 : solved === 2 ? 3 : solved === 1 ? 2 : attempted ? 1 : 0
          return (
            <button
              key={key}
              type="button"
              className="contribution-cell"
              data-level={level}
              data-selected={selectedDate === key}
              title={`${format(date, 'MMM d, yyyy')}: ${solved} solved, ${attempted} attempted`}
              aria-label={`${format(date, 'MMMM d, yyyy')}: ${solved} solved, ${attempted} attempted`}
              onClick={() => onSelect?.(key)}
            />
          )
        })}
      </div>
    </div>
  )
}