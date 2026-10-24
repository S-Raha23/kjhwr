import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './features/layout/SiteLayout'
import ExplorePage from './pages/ExplorePage'
import MethodPage from './pages/MethodPage'
import NotFoundPage from './pages/NotFoundPage'
import StoryPage from './pages/StoryPage'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<StoryPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="method" element={<MethodPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
