import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGrinders, deleteGrinder } from '../../api/grinderService'
import { Grinder } from '../../types'

const GrinderList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: grinders, isLoading, error, refetch } = useQuery({
    queryKey: ['grinders'],
    queryFn: getGrinders,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('GrinderList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (grinders) {
      console.log('Grinders data loaded:', grinders)
    }
    if (error) {
      console.error('React Query grinders error:', error)
    }
  }, [grinders, error])
  
  const deleteMutation = useMutation({
    mutationFn: deleteGrinder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grinders'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting grinder:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this grinder?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const handleRetry = () => {
    console.log('Retrying grinders fetch...')
    refetch()
  }
  
  if (isLoading) return <div className="text-center py-10">Loading grinders...</div>
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading grinders</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Coffee Grinders</h1>
        <Link to="/grinders/new" className="btn btn-primary">
          Add New Grinder
        </Link>
      </div>
      
      {!grinders || grinders.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No grinders found. Add your first coffee grinder!</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manual Link
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grinders.map((grinder) => (
                <tr key={grinder.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {grinder.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grinder.user_manual_link ? (
                      <a href={grinder.user_manual_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        User Manual
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/grinders/${grinder.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/grinders/${grinder.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(grinder.id);
                      }}
                      className="btn btn-danger"
                      aria-disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === grinder.id ? 'Deleting...' : 'Delete'}
                    </Link>
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

export default GrinderList