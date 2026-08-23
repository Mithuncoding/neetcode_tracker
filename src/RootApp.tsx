import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ProblemsPage = lazy(() => import('./pages/ProblemsPage').then((module) => ({ default: module.ProblemsPage })))
const TopicsPage = lazy(() => import('./pages/TopicsPage').then((module) => ({ default: module.TopicsPage })))
const RevisionPage = lazy(() => import('./pages/RevisionPage').then((module) => ({ default: module.RevisionPage })))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })))
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage').then((module) => ({ default: module.AchievementsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const FocusPage = lazy(() => import('./pages/FocusPage').then((module) => ({ default: module.FocusPage })))
const InterviewPage = lazy(() => import('./pages/InterviewPage').then((module) => ({ default: module.InterviewPage })))
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((module) => ({ default: module.PlannerPage })))

function RouteFallback() {
  return <div className="page-content"><div className="h-8 w-40 animate-pulse rounded-[6px] bg-[var(--surface-muted)]" /><div className="panel mt-6 h-72 animate-pulse" /></div>
}

export default function RootApp() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="plan" element={<PlannerPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="revision" element={<RevisionPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="focus" element={<FocusPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}