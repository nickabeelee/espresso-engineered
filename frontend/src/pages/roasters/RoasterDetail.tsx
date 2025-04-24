import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoaster, deleteRoaster } from '../../api/roasterService'
import { getBeans } from '../../api/beanService'

const RoasterDetail = () => {
  const { id } = useParams<{ id: string }>()
  const roasterId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: roaster, isLoading: roasterLoading, error: roasterError } = useQuery({
    queryKey: ['roaster', roasterId],
    queryFn: () => getRoaster(roasterId),
    enabled: !!roasterId
  })

  const { data: beans, isLoading: beansLoading } = useQuery({
    queryKey: ['beans'],
    queryFn: getBeans,
    select: (allBeans) => allBeans.filter(bean => bean.roaster_id === roasterId)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoaster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roasters'] })
      navigate('/roasters')
    }
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this roaster?')) {
      deleteMutation.mutate(roasterId)
    }
  }

  if (roasterLoading) return <div className="text-center py-10">Loading...</div>

  if (roasterError || !roaster) return (
    <div className="text-center py-10 text-red-600">
      Error loading roaster details
    </div>
  )

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{roaster.name}</h1>
        <div className="space-x-2">
          <Link to="/roasters" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/roasters/${roasterId}/edit`} className="btn btn-primary">
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
            Roaster Information
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {roaster.name}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Beans from this roaster</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {beansLoading ? (
                  "Loading beans..."
                ) : beans?.length ? (
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {beans.map((bean) => (
                      <li key={bean.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <span className="ml-2 flex-1 w-0 truncate">{bean.name}</span>
                        </div>
                        <div className="ml-4 shrink-0">
                          <Link
                            to={`/beans/${bean.id}`}
                            className="font-medium text-blue-600 hover:text-blue-500"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No beans found from this roaster"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default RoasterDetail
