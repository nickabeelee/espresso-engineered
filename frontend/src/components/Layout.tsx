import { useState, useEffect, ReactNode } from 'react'
import Header from './Header'
import Navbar from './Navbar'
import Breadcrumbs from './Breadcrumbs'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const small = window.innerWidth < 1024
      setIsSmallScreen(small)
      setMenuOpen(!small)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleMenu = () => setMenuOpen(open => !open)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isSmallScreen={isSmallScreen}
        isMenuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />
      <div className="flex flex-1">
        <Navbar
          isSmallScreen={isSmallScreen}
          isExpanded={menuOpen}
          toggleSidebar={toggleMenu}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumbs />
          <main className={`flex-1 overflow-y-auto p-6 lg:p-8 ${menuOpen ? '' : 'ml-0'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}