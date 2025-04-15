import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoasters, deleteRoaster } from '../../api/roasterService'
import { Roaster } from '../../types'

const RoasterList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: roasters, isLoading, error } = useQuery({
    queryKey: ['roasters'],
    queryFn: getRoasters
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteRoaster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roasters'] })
      setDeleteId(null)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this roaster?')) {
      deleteMutation.mutate(id)
    }
  }
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  if (error) return <div className="text-center py-10 text-red-600">Error loading roasters</div>
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coffee Roasters</h1>
        <Link to="/roasters/new" className="btn btn-primary">
          Add New Roaster
        </Link>
      </div>
      
      {roasters?.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-600">No roasters found. Add your first roaster!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
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
              {roasters?.map((roaster) => (
                <tr key={roaster.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {roaster.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/roasters/${roaster.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View
                    </Link>
                    <Link to={`/roasters/${roaster.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(roaster.id)}
                      className="text-red-600 hover:text-red-900"
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