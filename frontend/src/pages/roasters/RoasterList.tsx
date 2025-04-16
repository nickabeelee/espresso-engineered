import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoasters, deleteRoaster } from '../../api/roasterService'
import { Roaster } from '../../types'

const RoasterList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: roasters, isLoading, error, refetch } = useQuery({
    queryKey: ['roasters'],
    queryFn: getRoasters,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('RoasterList component mounted')
  }, [])

  // Log when data or error changes
  useEffect(() => {
    if (roasters) {
      console.log('Roasters data loaded:', roasters)
    }
    if (error) {
      console.error('React Query error:', error)
    }
  }, [roasters, error])
  
  const deleteMutation = useMutation({
    mutationFn: deleteRoaster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roasters'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting roaster:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this roaster?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const handleRetry = () => {
    console.log('Retrying roaster fetch...')
    refetch()
  }
  
  if (isLoading) return <div className="text-center py-10">Loading coffee roasters...</div>
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading roasters</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coffee Roasters</h1>
        <Link to="/roasters/new" className="btn btn-primary">
          Add New Roaster
        </Link>
      </div>
      
      {!roasters || roasters.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No roasters found. Add your first roaster!</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roasters.map((roaster) => (
                <tr key={roaster.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {roaster.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/roasters/${roaster.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/roasters/${roaster.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(roaster.id)}
                      className="btn btn-danger"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === roaster.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RoasterList