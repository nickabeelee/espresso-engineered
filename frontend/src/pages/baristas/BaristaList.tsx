import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBaristas, deleteBarista } from '../../api/baristaService'
import { Barista } from '../../types'

const BaristaList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: baristas, isLoading, error, refetch } = useQuery({
    queryKey: ['baristas'],
    queryFn: getBaristas,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('BaristaList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (baristas) {
      console.log('Baristas data loaded:', baristas)
    }
    if (error) {
      console.error('React Query baristas error:', error)
    }
  }, [baristas, error])
  
  const deleteMutation = useMutation({
    mutationFn: deleteBarista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristas'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting barista:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this barista?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const handleRetry = () => {
    console.log('Retrying baristas fetch...')
    refetch()
  }
  
  if (isLoading) return <div className="text-center py-10">Loading baristas...</div>
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading baristas</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Baristas</h1>
        <Link to="/baristas/new" className="btn btn-primary">
          Add New Barista
        </Link>
      </div>
      
      {!baristas || baristas.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No baristas found. Add your first barista!</p>
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
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {baristas.map((barista) => (
                <tr key={barista.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {barista.first_name} {barista.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {barista.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/baristas/${barista.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/baristas/${barista.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(barista.id);
                      }}
                      className="btn btn-danger"
                      aria-disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === barista.id ? 'Deleting...' : 'Delete'}
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

export default BaristaList