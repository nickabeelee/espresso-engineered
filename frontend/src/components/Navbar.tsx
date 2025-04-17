import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const Navbar = () => {
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  
  // Check screen size on mount and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsExpanded(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path) 
      ? 'bg-brown-100 text-brown-800 font-medium' 
      : 'text-gray-600 hover:bg-gray-100'
  }

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }
  
  const navItems = [
    { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/roasters', label: 'Roasters', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/beans', label: 'Beans', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10' },
    { path: '/bags', label: 'Bags', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { path: '/grinders', label: 'Grinders', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { path: '/machines', label: 'Machines', icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3' },
    { path: '/baristas', label: 'Baristas', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { path: '/brews', label: 'Brews', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ]
  
  return (
    <>
      {/* Mobile overlay when sidebar is open on small screens */}
      {isExpanded && isSmallScreen && (
        <div 
          className="fixed inset-0 top-12 bg-black bg-opacity-30 z-10"
          onClick={toggleSidebar}
        ></div>
      )}
    
      <nav className={`
        ${isSmallScreen ? 'fixed left-0 top-12' : 'relative'} 
        h-full
        bg-white shadow-md
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-64' : 'w-16'}
        z-20
      `}>
        {/* Toggle button */}
        <div className="flex items-center justify-end h-12 px-4 border-b">
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-500 hover:text-brown-800 hover:bg-gray-100"
            aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isExpanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>
          
        {/* Navigation Links */}
        <div className="py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-4 py-3
                    ${isActive(item.path === '/' ? item.path : item.path + '/')}
                    ${isExpanded ? 'justify-start' : 'justify-center'}
                    transition-colors duration-200
                  `}
                >
                  <svg 
                    className={`h-5 w-5 ${isExpanded ? 'mr-3' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}

export default Navbar