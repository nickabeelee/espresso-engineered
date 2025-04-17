import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Breadcrumbs: React.FC = () => {
  const location = useLocation()

  // Parse path into breadcrumb items
  const pathnames = location.pathname.split('/').filter(x => x)

  // Only show breadcrumbs if we're not on the home page
  if (pathnames.length === 0) {
    return null
  }

  // Generate human-readable labels for paths
  const getLabel = (path: string): string => {
    // Special case for IDs (numeric values)
    if (/^\d+$/.test(path)) {
      return `ID: ${path}`
    }

    // Handle special paths
    if (path === 'new') return 'New'
    if (path === 'edit') return 'Edit'

    // Capitalize first letter and add spaces before capital letters
    return path
      .replace(/([A-Z])/g, ' $1')
      .charAt(0)
      .toUpperCase() + path.replace(/([A-Z])/g, ' $1').slice(1)
  }

  return (
    <div className="bg-white border-b border-t px-4 py-2 text-sm sticky top-0 z-10">
      <div className="container mx-auto">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-500 hover:text-brown-600">
                Home
              </Link>
            </li>

            {pathnames.map((name, index) => {
              // Construct path up to this point
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`

              // Check if this is the last item
              const isLast = index === pathnames.length - 1

              return (
                <li key={name} aria-current={isLast ? "page" : undefined}>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    {isLast ? (
                      <span className="ml-1 text-brown-600 font-medium">{getLabel(name)}</span>
                    ) : (
                      <Link to={routeTo} className="ml-1 text-gray-500 hover:text-brown-600">
                        {getLabel(name)}
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </div>
  )
}

export default Breadcrumbs
