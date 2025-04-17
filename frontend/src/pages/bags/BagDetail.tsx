import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBag, deleteBag } from '../../api/bagService'
import { getBean } from '../../api/beanService'

const BagDetail = () => {
  const { id } = useParams<{ id: string }>()
  const bagId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: bag, isLoading: bagLoading, error: bagError } = useQuery({
    queryKey: ['bag', bagId],
    queryFn: () => getBag(bagId),
    enabled: !!bagId
  })
  
  const { data: bean, isLoading: beanLoading } = useQuery({
    queryKey: ['bean', bag?.bean_id],
    queryFn: () => getBean(bag?.bean_id || 0),
    enabled: !!bag?.bean_id
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteBag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      navigate('/bags')
    }
  })
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this bag?')) {
      deleteMutation.mutate(bagId)
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
  
  if (bagLoading) return <div className="text-center py-10">Loading...</div>
  
  if (bagError || !bag) return (
    <div className="text-center py-10 text-red-600">
      Error loading bag details
    </div>
  )
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{bag.name}</h1>
        <div className="space-x-2">
          <Link to="/bags" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/bags/${bagId}/edit`} className="btn btn-primary">
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
            Bag Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag.name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Bean</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {beanLoading ? 'Loading...' : (
                  <Link to={`/beans/${bean?.id}`} className="text-blue-600 hover:text-blue-900">
                    {bean?.name}
                  </Link>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Roast Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag.roast_date || 'Not available'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Weight (g)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag.weight || 'Not specified'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag.price ? `$${bag.price.toFixed(2)}` : 'Not available'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Purchase Location</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag.purchase_location || 'Not specified'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {renderStars(bag.rating)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default BagDetail