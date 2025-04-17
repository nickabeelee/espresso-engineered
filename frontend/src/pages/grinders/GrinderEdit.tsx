import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGrinder, updateGrinder } from '../../api/grinderService'
import { GrinderCreate as GrinderCreateType } from '../../types'

const GrinderEdit = () => {
  const { id } = useParams<{ id: string }>()
  const grinderId = parseInt(id || '0', 10)
  const [formData, setFormData] = useState<GrinderCreateType>({
    name: '',
    user_manual_link: '',
    image: '',
    setting_guide_chart: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: grinder, isLoading } = useQuery({
    queryKey: ['grinder', grinderId],
    queryFn: () => getGrinder(grinderId),
    enabled: !!grinderId
  })
  
  useEffect(() => {
    if (grinder) {
      setFormData({
        name: grinder.name,
        user_manual_link: grinder.user_manual_link || '',
        image: grinder.image || '',
        setting_guide_chart: grinder.setting_guide_chart || ''
      })
    }
  }, [grinder])
  
  const updateMutation = useMutation({
    mutationFn: (grinder: GrinderCreateType) => updateGrinder(grinderId, grinder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grinders'] })
      queryClient.invalidateQueries({ queryKey: ['grinder', grinderId] })
      navigate(`/grinders/${grinderId}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update grinder')
    }
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    
    updateMutation.mutate(formData)
  }
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Grinder</h1>
        <button
          onClick={() => navigate(`/grinders/${grinderId}`)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
      
      <div className="bg-white shadow-sm overflow-hidden rounded-lg p-6">
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="form-label">Grinder Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="user_manual_link" className="form-label">User Manual Link (URL)</label>
              <input
                type="url"
                id="user_manual_link"
                name="user_manual_link"
                value={formData.user_manual_link}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="image" className="form-label">Image URL</label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="input"
              />
              {formData.image && (
                <div className="mt-2">
                  <img 
                    src={formData.image} 
                    alt="Grinder preview" 
                    className="max-h-40 object-contain border border-gray-200 rounded p-2"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="setting_guide_chart" className="form-label">Setting Guide Chart (URL)</label>
              <input
                type="url"
                id="setting_guide_chart"
                name="setting_guide_chart"
                value={formData.setting_guide_chart}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Grinder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GrinderEdit