import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBarista, deleteBarista } from '../../api/baristaService'

const BaristaDetail = () => {
  const { id } = useParams<{ id: string }>()
  const baristaId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: barista, isLoading, error } = useQuery({
    queryKey: ['barista', baristaId],
    queryFn: () => getBarista(baristaId),
    enabled: !!baristaId
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBarista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristas'] })
      navigate('/baristas')
    }
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this barista?')) {
      deleteMutation.mutate(baristaId)
    }
  }

  if (isLoading) return <div className="text-center py-10">Loading...</div>

  if (error || !barista) return (
    <div className="text-center py-10 text-red-600">
      Error loading barista details
    </div>
  )

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{barista.first_name} {barista.last_name}</h1>
        <div className="space-x-2">
          <Link to="/baristas" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/baristas/${baristaId}/edit`} className="btn btn-primary">
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
            Barista Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {barista.first_name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {barista.last_name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`mailto:${barista.email}`} className="text-blue-600 hover:text-blue-900">
                  {barista.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default BaristaDetail
