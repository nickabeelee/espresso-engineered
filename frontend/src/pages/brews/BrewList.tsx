import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrews, deleteBrew } from '../../api/brewService'
import { getBags } from '../../api/bagService'
import { getBaristas } from '../../api/baristaService'
import { getMachines } from '../../api/machineService'
import { getGrinders } from '../../api/grinderService'
import { Brew, Bag, Barista, Machine, Grinder } from '../../types'

const BrewList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: brews, isLoading: brewsLoading, error: brewsError, refetch: refetchBrews } = useQuery({
    queryKey: ['brews'],
    queryFn: getBrews,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: bags } = useQuery({
    queryKey: ['bags'],
    queryFn: getBags,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: baristas } = useQuery({
    queryKey: ['baristas'],
    queryFn: getBaristas,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: grinders } = useQuery({
    queryKey: ['grinders'],
    queryFn: getGrinders,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('BrewList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (brews) {
      console.log('Brews data loaded:', brews)
    }
    if (brewsError) {
      console.error('React Query brews error:', brewsError)
    }
  }, [brews, brewsError])
  
  const deleteMutation = useMutation({
    mutationFn: deleteBrew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting brew:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this brew?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const getBagName = (bagId: number): string => {
    const bag = bags?.find(b => b.id === bagId)
    return bag ? bag.name : 'Unknown'
  }
  
  const getBaristaName = (baristaId: number): string => {
    const barista = baristas?.find(b => b.id === baristaId)
    return barista ? `${barista.first_name} ${barista.last_name}` : 'Unknown'
  }
  
  const getMachineName = (machineId: number): string => {
    const machine = machines?.find(m => m.id === machineId)
    return machine ? machine.name : 'Unknown'
  }
  
  const getGrinderName = (grinderId: number): string => {
    const grinder = grinders?.find(g => g.id === grinderId)
    return grinder ? grinder.name : 'Unknown'
  }
  
  const handleRetry = () => {
    console.log('Retrying brews fetch...')
    refetchBrews()
  }
  
  if (brewsLoading) return <div className="text-center py-10">Loading brews...</div>
  
  if (brewsError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading brews</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Espresso Brews</h1>
        <Link to="/brews/new" className="btn btn-primary">
          Add New Brew
        </Link>
      </div>
      
      {!brews || brews.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No brews found. Record your first espresso brew!</p>
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
                  Bean
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brews.map((brew) => (
                <tr key={brew.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {brew.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBagName(brew.bag_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBaristaName(brew.barista_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brew.timestamp || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brew.rating !== undefined ? `${brew.rating}/10` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/brews/${brew.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/brews/${brew.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(brew.id);
                      }}
                      className="btn btn-danger"
                      aria-disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === brew.id ? 'Deleting...' : 'Delete'}
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

export default BrewList