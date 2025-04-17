import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGrinder } from '../../api/grinderService'
import { GrinderCreate as GrinderCreateType } from '../../types'

const GrinderCreate = () => {
  const [formData, setFormData] = useState<GrinderCreateType>({
    name: '',
    user_manual_link: '',
    image: '',
    setting_guide_chart: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: createGrinder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grinders'] })
      navigate(`/grinders/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create grinder')
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
    
    createMutation.mutate(formData)
  }
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Grinder</h1>
        <button
          onClick={() => navigate('/grinders')}
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
                placeholder="e.g., Niche Zero, Eureka Mignon, etc."
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
                placeholder="https://example.com/manual.pdf"
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
                placeholder="https://example.com/grinder-image.jpg"
              />
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
                placeholder="https://example.com/grinder-settings.pdf"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Grinder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GrinderCreate