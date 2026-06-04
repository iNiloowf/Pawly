import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import GalleryPage from './pages/GalleryPage'
import ProfilePage from './pages/ProfilePage'
import DayDetailPage from './pages/DayDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/day/:date" element={<DayDetailPage />} />
      </Route>
    </Routes>
  )
}
