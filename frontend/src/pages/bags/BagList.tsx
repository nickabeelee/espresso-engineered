import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBags, deleteBag } from '../../api/bagService'
import { getBeans } from '../../api/beanService'
import { Bag, Bean } from '../../types'

const BagList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: bags, isLoading: bagsLoading, error: bagsError, refetch: refetchBags } = useQuery({
    queryKey: ['bags'],
    queryFn: getBags,
    retry: 2,
    retryDelay: 1000,
  })
  
  const { data: beans, isLoading: beansLoading, error: beansError } = useQuery({
    queryKey: ['beans'],
    queryFn: getBeans,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('BagList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (bags) {
      console.log('Bags data loaded:', bags)
    }
    if (bagsError) {
      console.error('React Query bags error:', bagsError)
    }
    if (beans) {
      console.log('Beans data loaded in BagList:', beans)
    }
    if (beansError) {
      console.error('React Query beans error in BagList:', beansError)
    }
  }, [bags, bagsError, beans, beansError])
  
  const deleteMutation = useMutation({
    mutationFn: deleteBag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting bag:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this bag?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const getBeanName = (beanId: number): string => {
    const bean = beans?.find(b => b.id === beanId)
    return bean ? bean.name : 'Unknown'
  }
  
  const handleRetry = () => {
    console.log('Retrying bag fetch...')
    refetchBags()
  }
  
  if (bagsLoading) return <div className="text-center py-10">Loading coffee bags...</div>
  
  if (bagsError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading bags</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Coffee Bags</h1>
        <Link to="/bags/new" className="btn btn-primary">
          Add New Bag
        </Link>
      </div>
      
      {!bags || bags.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No bags found. Add your first coffee bag!</p>
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
                  Roast Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight (g)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bags.map((bag) => (
                <tr key={bag.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bag.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBeanName(bag.bean_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bag.roast_date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bag.weight || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/bags/${bag.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/bags/${bag.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(bag.id);
                      }}
                      className="btn btn-danger"
                      aria-disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === bag.id ? 'Deleting...' : 'Delete'}
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

export default BagList