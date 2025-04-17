import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrew, deleteBrew } from '../../api/brewService'
import { getBag } from '../../api/bagService'
import { getBarista } from '../../api/baristaService'
import { getGrinder } from '../../api/grinderService'
import { getMachine } from '../../api/machineService'

const BrewDetail = () => {
  const { id } = useParams<{ id: string }>()
  const brewId = parseInt(id || '0', 10)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: brew, isLoading: brewLoading, error: brewError } = useQuery({
    queryKey: ['brew', brewId],
    queryFn: () => getBrew(brewId),
    enabled: !!brewId
  })
  
  const { data: bag } = useQuery({
    queryKey: ['bag', brew?.bag_id],
    queryFn: () => getBag(brew?.bag_id || 0),
    enabled: !!brew?.bag_id
  })
  
  const { data: barista } = useQuery({
    queryKey: ['barista', brew?.barista_id],
    queryFn: () => getBarista(brew?.barista_id || 0),
    enabled: !!brew?.barista_id
  })
  
  const { data: grinder } = useQuery({
    queryKey: ['grinder', brew?.grinder_id],
    queryFn: () => getGrinder(brew?.grinder_id || 0),
    enabled: !!brew?.grinder_id
  })
  
  const { data: machine } = useQuery({
    queryKey: ['machine', brew?.machine_id],
    queryFn: () => getMachine(brew?.machine_id || 0),
    enabled: !!brew?.machine_id
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteBrew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews'] })
      navigate('/brews')
    }
  })
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this brew record?')) {
      deleteMutation.mutate(brewId)
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
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not recorded'
    
    return new Date(dateString).toLocaleString()
  }
  
  if (brewLoading) return <div className="text-center py-10">Loading...</div>
  
  if (brewError || !brew) return (
    <div className="text-center py-10 text-red-600">
      Error loading brew details
    </div>
  )
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{brew.name}</h1>
        <div className="space-x-2">
          <Link to="/brews" className="btn btn-secondary">
            Back to List
          </Link>
          <Link to={`/brews/${brewId}/edit`} className="btn btn-primary">
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
            Brew Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.name}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(brew.timestamp)}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Barista</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {barista ? (
                  <Link to={`/baristas/${barista.id}`} className="text-blue-600 hover:text-blue-900">
                    {barista.first_name} {barista.last_name}
                  </Link>
                ) : 'Loading...'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Coffee Bag</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bag ? (
                  <Link to={`/bags/${bag.id}`} className="text-blue-600 hover:text-blue-900">
                    {bag.name}
                  </Link>
                ) : 'Loading...'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Grinder</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {grinder ? (
                  <Link to={`/grinders/${grinder.id}`} className="text-blue-600 hover:text-blue-900">
                    {grinder.name}
                  </Link>
                ) : 'Loading...'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Machine</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {machine ? (
                  <Link to={`/machines/${machine.id}`} className="text-blue-600 hover:text-blue-900">
                    {machine.name}
                  </Link>
                ) : 'Loading...'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brew Time (sec)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.brew_time !== undefined ? brew.brew_time : 'Not recorded'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Dose (g)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.dose !== undefined ? brew.dose : 'Not recorded'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Yield (g)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.yield !== undefined ? brew.yield : 'Not recorded'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {renderStars(brew.rating)}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Tasting Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.tasting_notes || 'None recorded'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reflections</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {brew.reflections || 'None recorded'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default BrewDetail