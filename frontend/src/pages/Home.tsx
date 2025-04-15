import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <h1 className="text-4xl font-bold text-brown-600 mb-6">Espresso Engineered</h1>
          <p className="text-lg text-gray-600 mb-8">
            Track your coffee journey - from bean to cup
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            <div className="card">
              <h2 className="text-xl font-semibold text-brown-600 mb-3">Roasters</h2>
              <p className="text-gray-600 mb-4">
                Explore and manage coffee roasters in your collection.
              </p>
              <Link to="/roasters" className="btn btn-primary inline-block">
                View Roasters
              </Link>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold text-brown-600 mb-3">Beans</h2>
              <p className="text-gray-600 mb-4">
                Track different coffee beans and their characteristics.
              </p>
              <Link to="/beans" className="btn btn-primary inline-block">
                View Beans
              </Link>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold text-brown-600 mb-3">Coming Soon</h2>
              <p className="text-gray-600 mb-4">
                More features to help track your coffee journey.
              </p>
              <button className="btn btn-secondary inline-block opacity-50 cursor-not-allowed">
                Stay Tuned
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home