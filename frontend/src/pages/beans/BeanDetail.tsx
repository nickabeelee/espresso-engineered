import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBean, deleteBean } from '../../api/beanService'
import { getRoaster } from '../../api/roasterService'
import { RoastLevel } from '../../types'

const BeanDetail = () => {
  const { id } = useParams<{ id: string }>()
  const beanId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: bean, isLoading: beanLoading, error: beanError } = useQuery({
    queryKey: ['bean', beanId],
    queryFn: () => getBean(beanId),
    enabled: !!beanId
  })
  
  const { data: roaster, isLoading: roasterLoading } = useQuery({
    queryKey: ['roaster', bean?.roaster_id],
    queryFn: () => getRoaster(bean?.roaster_id || 0),
    enabled: !!bean?.roaster_id
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteBean,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] })
      navigate('/beans')
    }
  })
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this bean?')) {
      deleteMutation.mutate(beanId)
    }
  }
  
  const renderStars = (rating?: number) => {
    if (!rating) return 'Not rated'
    
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={`text-xl ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }
  
  if (beanLoading) return <div className="text-center py-10">Loading...</div>
  
  if (beanError || !bean) return (
    <div className="text-center py-10 text-red-600">
      Error loading bean details
    </div>
  )
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{bean.name}</h1>
        <div className="space-x-2">
          <Link to="/beans" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/beans/${beanId}/edit`} className="btn btn-primary">
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Bean Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bean.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Roaster</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {roasterLoading ? 'Loading...' : (
                  <Link to={`/roasters/${roaster?.id}`} className="text-blue-600 hover:text-blue-900">
                    {roaster?.name}
                  </Link>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Roast Level</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bean.roast_level}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Country of Origin</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bean.country_of_origin || 'Not specified'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tasting Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bean.tasting_notes || 'Not available'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {renderStars(bean.rating)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default BeanDetail