import { Routes, Route } from 'react-router-dom'
import './App.css'

// Pages
import Home from './pages/Home'
import RoasterList from './pages/roasters/RoasterList'
import RoasterDetail from './pages/roasters/RoasterDetail'
import RoasterCreate from './pages/roasters/RoasterCreate'
import RoasterEdit from './pages/roasters/RoasterEdit'
import BeanList from './pages/beans/BeanList'
import BeanDetail from './pages/beans/BeanDetail'
import BeanCreate from './pages/beans/BeanCreate'
import BeanEdit from './pages/beans/BeanEdit'

// Components
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Roaster Routes */}
          <Route path="/roasters" element={<RoasterList />} />
          <Route path="/roasters/new" element={<RoasterCreate />} />
          <Route path="/roasters/:id" element={<RoasterDetail />} />
          <Route path="/roasters/:id/edit" element={<RoasterEdit />} />
          
          {/* Bean Routes */}
          <Route path="/beans" element={<BeanList />} />
          <Route path="/beans/new" element={<BeanCreate />} />
          <Route path="/beans/:id" element={<BeanDetail />} />
          <Route path="/beans/:id/edit" element={<BeanEdit />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
