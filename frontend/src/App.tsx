import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './context/AuthContext'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'
// Roaster
import RoasterList from './pages/roasters/RoasterList'
import RoasterDetail from './pages/roasters/RoasterDetail'
import RoasterCreate from './pages/roasters/RoasterCreate'
import RoasterEdit from './pages/roasters/RoasterEdit'
// Bean
import BeanList from './pages/beans/BeanList'
import BeanDetail from './pages/beans/BeanDetail'
import BeanCreate from './pages/beans/BeanCreate'
import BeanEdit from './pages/beans/BeanEdit'
// Bag
import BagList from './pages/bags/BagList'
import BagDetail from './pages/bags/BagDetail'
import BagCreate from './pages/bags/BagCreate'
import BagEdit from './pages/bags/BagEdit'
// Barista
import BaristaList from './pages/baristas/BaristaList'
import BaristaDetail from './pages/baristas/BaristaDetail'
import BaristaCreate from './pages/baristas/BaristaCreate'
import BaristaEdit from './pages/baristas/BaristaEdit'
// Grinder
import GrinderList from './pages/grinders/GrinderList'
import GrinderDetail from './pages/grinders/GrinderDetail'
import GrinderCreate from './pages/grinders/GrinderCreate'
import GrinderEdit from './pages/grinders/GrinderEdit'
// Machine
import MachineList from './pages/machines/MachineList'
import MachineDetail from './pages/machines/MachineDetail'
import MachineCreate from './pages/machines/MachineCreate'
import MachineEdit from './pages/machines/MachineEdit'
// Brew
import BrewList from './pages/brews/BrewList'
import BrewDetail from './pages/brews/BrewDetail'
import BrewCreate from './pages/brews/BrewCreate'
import BrewEdit from './pages/brews/BrewEdit'

// Components
import Navbar from './components/Navbar'
import Header from './components/Header'
import Breadcrumbs from './components/Breadcrumbs'

function App() {
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const { loading } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    const checkScreenSize = () => {
      const small = window.innerWidth < 1024
      setIsSmallScreen(small)
      setIsMenuOpen(!small)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Conditionally render header when not on login page */}
      {!isLoginPage && (
        <Header
          isSmallScreen={isSmallScreen}
          isMenuOpen={isMenuOpen}
          toggleMenu={() => setIsMenuOpen(prev => !prev)}
        />
      )}

      {/* Content area with sidebar and main content */}
      <div className="flex flex-1">
        {/* Conditionally render navbar when not on login page */}
        {!isLoginPage && (
          <Navbar
            isSmallScreen={isSmallScreen}
            isExpanded={isMenuOpen}
            toggleSidebar={() => setIsMenuOpen(prev => !prev)}
          />
        )}
        <div className={`flex-1 flex flex-col overflow-hidden ${isLoginPage ? 'w-full' : ''}`}>
          {/* Conditionally render breadcrumbs when not on login page */}
          {!isLoginPage && <Breadcrumbs />}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />

                {/* Roaster Routes */}
                <Route path="/roasters" element={
                  <ProtectedRoute>
                    <RoasterList />
                  </ProtectedRoute>
                } />
                <Route path="/roasters/new" element={
                  <ProtectedRoute>
                    <RoasterCreate />
                  </ProtectedRoute>
                } />
                <Route path="/roasters/:id" element={
                  <ProtectedRoute>
                    <RoasterDetail />
                  </ProtectedRoute>
                } />
                <Route path="/roasters/:id/edit" element={
                  <ProtectedRoute>
                    <RoasterEdit />
                  </ProtectedRoute>
                } />

                {/* Bean Routes */}
                <Route path="/beans" element={
                  <ProtectedRoute>
                    <BeanList />
                  </ProtectedRoute>
                } />
                <Route path="/beans/new" element={
                  <ProtectedRoute>
                    <BeanCreate />
                  </ProtectedRoute>
                } />
                <Route path="/beans/:id" element={
                  <ProtectedRoute>
                    <BeanDetail />
                  </ProtectedRoute>
                } />
                <Route path="/beans/:id/edit" element={
                  <ProtectedRoute>
                    <BeanEdit />
                  </ProtectedRoute>
                } />

                {/* Bag Routes */}
                <Route path="/bags" element={
                  <ProtectedRoute>
                    <BagList />
                  </ProtectedRoute>
                } />
                <Route path="/bags/new" element={
                  <ProtectedRoute>
                    <BagCreate />
                  </ProtectedRoute>
                } />
                <Route path="/bags/:id" element={
                  <ProtectedRoute>
                    <BagDetail />
                  </ProtectedRoute>
                } />
                <Route path="/bags/:id/edit" element={
                  <ProtectedRoute>
                    <BagEdit />
                  </ProtectedRoute>
                } />

                {/* Barista Routes */}
                <Route path="/baristas" element={
                  <ProtectedRoute>
                    <BaristaList />
                  </ProtectedRoute>
                } />
                <Route path="/baristas/new" element={
                  <ProtectedRoute>
                    <BaristaCreate />
                  </ProtectedRoute>
                } />
                <Route path="/baristas/:id" element={
                  <ProtectedRoute>
                    <BaristaDetail />
                  </ProtectedRoute>
                } />
                <Route path="/baristas/:id/edit" element={
                  <ProtectedRoute>
                    <BaristaEdit />
                  </ProtectedRoute>
                } />

                {/* Grinder Routes */}
                <Route path="/grinders" element={
                  <ProtectedRoute>
                    <GrinderList />
                  </ProtectedRoute>
                } />
                <Route path="/grinders/new" element={
                  <ProtectedRoute>
                    <GrinderCreate />
                  </ProtectedRoute>
                } />
                <Route path="/grinders/:id" element={
                  <ProtectedRoute>
                    <GrinderDetail />
                  </ProtectedRoute>
                } />
                <Route path="/grinders/:id/edit" element={
                  <ProtectedRoute>
                    <GrinderEdit />
                  </ProtectedRoute>
                } />

                {/* Machine Routes */}
                <Route path="/machines" element={
                  <ProtectedRoute>
                    <MachineList />
                  </ProtectedRoute>
                } />
                <Route path="/machines/new" element={
                  <ProtectedRoute>
                    <MachineCreate />
                  </ProtectedRoute>
                } />
                <Route path="/machines/:id" element={
                  <ProtectedRoute>
                    <MachineDetail />
                  </ProtectedRoute>
                } />
                <Route path="/machines/:id/edit" element={
                  <ProtectedRoute>
                    <MachineEdit />
                  </ProtectedRoute>
                } />

                {/* Brew Routes */}
                <Route path="/brews" element={
                  <ProtectedRoute>
                    <BrewList />
                  </ProtectedRoute>
                } />
                <Route path="/brews/new" element={
                  <ProtectedRoute>
                    <BrewCreate />
                  </ProtectedRoute>
                } />
                <Route path="/brews/:id" element={
                  <ProtectedRoute>
                    <BrewDetail />
                  </ProtectedRoute>
                } />
                <Route path="/brews/:id/edit" element={
                  <ProtectedRoute>
                    <BrewEdit />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
