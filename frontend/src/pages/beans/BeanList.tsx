import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBeans, deleteBean } from '../../api/beanService'
import { getRoasters } from '../../api/roasterService'
import { Bean, Roaster } from '../../types'

const BeanList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: beans, isLoading: beansLoading, error: beansError } = useQuery({
    queryKey: ['beans'],
    queryFn: getBeans
  })
  
  const { data: roasters } = useQuery({
    queryKey: ['roasters'],
    queryFn: getRoasters
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteBean,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] })
      setDeleteId(null)
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
  
  if (beansLoading) return <div className="text-center py-10">Loading...</div>
  
  if (beansError) return <div className="text-center py-10 text-red-600">Error loading beans</div>
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coffee Beans</h1>
        <Link to="/beans/new" className="btn btn-primary">
          Add New Bean
        </Link>
      </div>
      
      {beans?.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-600">No beans found. Add your first coffee bean!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
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
              {beans?.map((bean) => (
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
                    <Link to={`/beans/${bean.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </Link>
                    <Link to={`/beans/${bean.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(bean.id)}
                      className="text-red-600 hover:text-red-900"
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