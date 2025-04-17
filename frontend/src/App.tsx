import { Routes, Route } from 'react-router-dom'
import './App.css'

// Pages
import Home from './pages/Home'
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

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
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

            {/* Bag Routes */}
            <Route path="/bags" element={<BagList />} />
            <Route path="/bags/new" element={<BagCreate />} />
            <Route path="/bags/:id" element={<BagDetail />} />
            <Route path="/bags/:id/edit" element={<BagEdit />} />
            
            {/* Barista Routes */}
            <Route path="/baristas" element={<BaristaList />} />
            <Route path="/baristas/new" element={<BaristaCreate />} />
            <Route path="/baristas/:id" element={<BaristaDetail />} />
            <Route path="/baristas/:id/edit" element={<BaristaEdit />} />
            
            {/* Grinder Routes */}
            <Route path="/grinders" element={<GrinderList />} />
            <Route path="/grinders/new" element={<GrinderCreate />} />
            <Route path="/grinders/:id" element={<GrinderDetail />} />
            <Route path="/grinders/:id/edit" element={<GrinderEdit />} />
            
            {/* Machine Routes */}
            <Route path="/machines" element={<MachineList />} />
            <Route path="/machines/new" element={<MachineCreate />} />
            <Route path="/machines/:id" element={<MachineDetail />} />
            <Route path="/machines/:id/edit" element={<MachineEdit />} />
            
            {/* Brew Routes */}
            <Route path="/brews" element={<BrewList />} />
            <Route path="/brews/new" element={<BrewCreate />} />
            <Route path="/brews/:id" element={<BrewDetail />} />
            <Route path="/brews/:id/edit" element={<BrewEdit />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
