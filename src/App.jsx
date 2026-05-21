import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Count from './pages/Count'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/count/:storeId" element={<Count />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
