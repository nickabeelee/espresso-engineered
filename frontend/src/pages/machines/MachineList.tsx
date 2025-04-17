import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMachines, deleteMachine } from '../../api/machineService'
import { Machine } from '../../types'

const MachineList = () => {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const { data: machines, isLoading, error, refetch } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
    retry: 2,
    retryDelay: 1000,
  })
  
  // Log when component mounts
  useEffect(() => {
    console.log('MachineList component mounted')
  }, [])

  // Log when data or errors change
  useEffect(() => {
    if (machines) {
      console.log('Machines data loaded:', machines)
    }
    if (error) {
      console.error('React Query machines error:', error)
    }
  }, [machines, error])
  
  const deleteMutation = useMutation({
    mutationFn: deleteMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      setDeleteId(null)
    },
    onError: (error) => {
      console.error('Error deleting machine:', error)
    }
  })
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this machine?')) {
      setDeleteId(id)
      deleteMutation.mutate(id)
    }
  }
  
  const handleRetry = () => {
    console.log('Retrying machines fetch...')
    refetch()
  }
  
  if (isLoading) return <div className="text-center py-10">Loading espresso machines...</div>
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">Error loading machines</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Espresso Machines</h1>
        <Link to="/machines/new" className="btn btn-primary">
          Add New Machine
        </Link>
      </div>
      
      {!machines || machines.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">No machines found. Add your first espresso machine!</p>
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
                  Manufacturer
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
              {machines.map((machine) => (
                <tr key={machine.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {machine.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {machine.manufacturer || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {machine.user_manual_link ? (
                      <a href={machine.user_manual_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        User Manual
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/machines/${machine.id}`} className="btn btn-secondary mr-2">
                      View
                    </Link>
                    <Link to={`/machines/${machine.id}/edit`} className="btn btn-primary mr-2">
                      Edit
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(machine.id);
                      }}
                      className="btn btn-danger"
                      aria-disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteId === machine.id ? 'Deleting...' : 'Delete'}
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

export default MachineList