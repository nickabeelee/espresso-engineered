import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGrinder, deleteGrinder } from '../../api/grinderService'

const GrinderDetail = () => {
  const { id } = useParams<{ id: string }>()
  const grinderId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: grinder, isLoading, error } = useQuery({
    queryKey: ['grinder', grinderId],
    queryFn: () => getGrinder(grinderId),
    enabled: !!grinderId
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteGrinder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grinders'] })
      navigate('/grinders')
    }
  })
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this grinder?')) {
      deleteMutation.mutate(grinderId)
    }
  }
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  if (error || !grinder) return (
    <div className="text-center py-10 text-red-600">
      Error loading grinder details
    </div>
  )
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{grinder.name}</h1>
        <div className="space-x-2">
          <Link to="/grinders" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/grinders/${grinderId}/edit`} className="btn btn-primary">
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
            Grinder Information
          </h3>
        </div>
        
        {grinder.image && (
          <div className="p-6 border-t border-gray-200">
            <img 
              src={grinder.image} 
              alt={grinder.name}
              className="max-w-full h-auto max-h-96 mx-auto object-contain rounded"
            />
          </div>
        )}
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {grinder.name}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">User Manual</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {grinder.user_manual_link ? (
                  <a 
                    href={grinder.user_manual_link} 
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
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Setting Guide</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {grinder.setting_guide_chart ? (
                  <a 
                    href={grinder.setting_guide_chart} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Guide
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

export default GrinderDetail