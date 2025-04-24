import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMachine, deleteMachine } from '../../api/machineService'

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>()
  const machineId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: machine, isLoading, error } = useQuery({
    queryKey: ['machine', machineId],
    queryFn: () => getMachine(machineId),
    enabled: !!machineId
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      navigate('/machines')
    }
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this machine?')) {
      deleteMutation.mutate(machineId)
    }
  }

  if (isLoading) return <div className="text-center py-10">Loading...</div>

  if (error || !machine) return (
    <div className="text-center py-10 text-red-600">
      Error loading machine details
    </div>
  )

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
        <div className="space-x-2">
          <Link to="/machines" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/machines/${machineId}/edit`} className="btn btn-primary">
            Edit
          </Link>
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="btn btn-danger"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Machine Information
          </h3>
        </div>

        {machine.image && (
          <div className="p-6 border-t border-gray-200">
            <img
              src={machine.image}
              alt={machine.name}
              className="max-w-full h-auto max-h-96 mx-auto object-contain rounded"
            />
          </div>
        )}

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {machine.name}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {machine.manufacturer || 'Not specified'}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">User Manual</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {machine.user_manual_link ? (
                  <a
                    href={machine.user_manual_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Manual
                  </a>
                ) : (
                  'Not available'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default MachineDetail
