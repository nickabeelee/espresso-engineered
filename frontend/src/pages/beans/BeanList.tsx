import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBeans, deleteBean } from '../../api/beanService'
import { getRoasters } from '../../api/roasterService'
import { Bean, Roaster } from '../../types'

const BeanList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: beans, isLoading: beansLoading, error: beansError, refetch: refetchBeans } = useQuery({
    queryKey: ['beans'],
    queryFn: getBeans,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: roasters, isLoading: roastersLoading, error: roastersError } = useQuery({
    queryKey: ['roasters'],
    queryFn: getRoasters,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('BeanList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (beans) {
      console.log('Beans data loaded:', beans)
    }
    if (beansError) {
      console.error('React Query beans error:', beansError)
    }
    if (roasters) {
      console.log('Roasters data loaded in BeanList:', roasters)
    }
    if (roastersError) {
      console.error('React Query roasters error in BeanList:', roastersError)
    }
  }, [beans, beansError, roasters, roastersError])
  
  const deleteMutation = useMutation({
    mutationFn: deleteBean,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting bean:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this bean?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const getRoasterName = (roasterId: number): string => {
    const roaster = roasters?.find(r => r.id === roasterId)
    return roaster ? roaster.name : 'Unknown'
  }
  
  const handleRetry = () => {
    console.log('Retrying bean fetch...')
    refetchBeans()
  }
  
  if (beansLoading) return <div className="text-center py-10">Loading coffee beans...</div>
  
  if (beansError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading beans</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Coffee Beans</h1>
        <Link to="/beans/new" className="btn btn-primary">
          Add New Bean
        </Link>
      </div>
      
      {!beans || beans.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No beans found. Add your first coffee bean!</p>
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
                  Roaster
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roast Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beans.map((bean) => (
                <tr key={bean.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bean.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getRoasterName(bean.roaster_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bean.roast_level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bean.country_of_origin || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/beans/${bean.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/beans/${bean.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(bean.id)}
                      className="btn btn-danger"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === bean.id ? 'Deleting...' : 'Delete'}
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

export default BeanList