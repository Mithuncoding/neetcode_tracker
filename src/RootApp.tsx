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
const MentorPage = lazy(() => import('./pages/MentorPage').then((module) => ({ default: module.MentorPage })))
const RecognitionPage = lazy(() => import('./pages/RecognitionPage').then((module) => ({ default: module.RecognitionPage })))
const GuidedProblemPage = lazy(() => import('./pages/GuidedProblemPage').then((module) => ({ default: module.GuidedProblemPage })))
const CurriculumPage = lazy(() => import('./pages/CurriculumPage').then((module) => ({ default: module.CurriculumPage })))
const MediumTrainerPage = lazy(() => import('./pages/MediumTrainerPage').then((module) => ({ default: module.MediumTrainerPage })))
const DecisionTreePage = lazy(() => import('./pages/DecisionTreePage').then((module) => ({ default: module.DecisionTreePage })))
const FaangYearPage = lazy(() => import('./pages/FaangYearPage').then((module) => ({ default: module.FaangYearPage })))
const KnowledgeGraphPage = lazy(() => import('./pages/KnowledgeGraphPage').then((module) => ({ default: module.KnowledgeGraphPage })))
const MistakesPage = lazy(() => import('./pages/MistakesPage').then((module) => ({ default: module.MistakesPage })))
const LeetCodeReconcilePage = lazy(() => import('./pages/LeetCodeReconcilePage').then((module) => ({ default: module.LeetCodeReconcilePage })))
const AlgorithmLabPage = lazy(() => import('./pages/AlgorithmLabPage').then((module) => ({ default: module.AlgorithmLabPage })))
const PythonAcademyPage = lazy(() => import('./pages/PythonAcademyPage').then((module) => ({ default: module.PythonAcademyPage })))

function RouteFallback() {
  return <div className="page-content"><div className="h-8 w-40 animate-pulse rounded-[6px] bg-[var(--surface-muted)]" /><div className="panel mt-6 h-72 animate-pulse" /></div>
}

export default function RootApp() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="mentor" element={<MentorPage />} />
          <Route path="mentor/recognition" element={<RecognitionPage />} />
          <Route path="mentor/problem/:problemId" element={<GuidedProblemPage />} />
          <Route path="mentor/curriculum" element={<CurriculumPage />} />
          <Route path="mentor/medium" element={<MediumTrainerPage />} />
          <Route path="mentor/decide" element={<DecisionTreePage />} />
          <Route path="mentor/year" element={<FaangYearPage />} />
          <Route path="mentor/graph" element={<KnowledgeGraphPage />} />
          <Route path="mentor/mistakes" element={<MistakesPage />} />
          <Route path="mentor/leetcode" element={<LeetCodeReconcilePage />} />
          <Route path="mentor/python" element={<PythonAcademyPage />} />
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
        <Route path="mentor/lab" element={<AlgorithmLabPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}