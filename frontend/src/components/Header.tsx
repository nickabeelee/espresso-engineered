import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  isSmallScreen: boolean
  isMenuOpen: boolean
  toggleMenu: () => void
}

const Header: React.FC<HeaderProps> = ({ isSmallScreen, isMenuOpen, toggleMenu }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-brown-700 text-white px-4 py-3 shadow-md sticky top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {isSmallScreen && (
          <button
            onClick={toggleMenu}
            className="lg:hidden text-white p-2 rounded-md hover:bg-brown-600 focus:outline-none mr-2"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
        <Link to="/" className="text-xl font-bold hover:text-brown-200">
          Espresso Engineered
        </Link>
        {user && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="mr-3 text-sm hidden md:inline">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="bg-brown-600 hover:bg-brown-500 px-3 py-1 rounded text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
            <div className="bg-brown-600 hover:bg-brown-500 p-2 rounded-full cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
