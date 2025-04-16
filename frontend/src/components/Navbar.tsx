import { Link, useLocation } from 'react-router-dom'

const Navbar = () => {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'text-brown-600 border-b-2 border-brown-600' 
      : 'text-gray-600 hover:text-brown-500'
  }
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-brown-600">
                Espresso Engineered
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                to="/roasters"
                className={`inline-flex items-center px-1 pt-1 ${isActive('/roasters')}`}
              >
                Roasters
              </Link>
              <Link
                to="/beans"
                className={`inline-flex items-center px-1 pt-1 ${isActive('/beans')}`}
              >
                Beans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar