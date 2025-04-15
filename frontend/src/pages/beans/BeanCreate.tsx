import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBean } from '../../api/beanService'
import { getRoasters } from '../../api/roasterService'
import { BeanCreate as BeanCreateType, RoastLevel } from '../../types'

const BeanCreate = () => {
  const [formData, setFormData] = useState<Omit<BeanCreateType, 'roaster_id'> & { roaster_id: string }>({
    name: '',
    roaster_id: '',
    roast_level: RoastLevel.Medium,
    country_of_origin: '',
    tasting_notes: '',
    rating: undefined
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: roasters, isLoading: roastersLoading } = useQuery({
    queryKey: ['roasters'],
    queryFn: getRoasters
  })
  
  const createMutation = useMutation({
    mutationFn: createBean,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['beans'] })
      navigate(`/beans/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create bean')
    }
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    
    if (!formData.roaster_id) {
      setError('Roaster is required')
      return
    }
    
    const newBean: BeanCreateType = {
      ...formData,
      roaster_id: parseInt(formData.roaster_id, 10),
      rating: formData.rating ? parseInt(formData.rating.toString(), 10) : undefined
    }
    
    createMutation.mutate(newBean)
  }
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Coffee Bean</h1>
        <button
          onClick={() => navigate('/beans')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="name" className="form-label">Bean Name</label>
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
              <label htmlFor="roaster_id" className="form-label">Roaster</label>
              <select
                id="roaster_id"
                name="roaster_id"
                value={formData.roaster_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a roaster</option>
                {roastersLoading ? (
                  <option disabled>Loading roasters...</option>
                ) : (
                  roasters?.map(roaster => (
                    <option key={roaster.id} value={roaster.id}>
                      {roaster.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="roast_level" className="form-label">Roast Level</label>
              <select
                id="roast_level"
                name="roast_level"
                value={formData.roast_level}
                onChange={handleChange}
                className="select"
              >
                {Object.values(RoastLevel).map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="country_of_origin" className="form-label">Country of Origin</label>
              <input
                type="text"
                id="country_of_origin"
                name="country_of_origin"
                value={formData.country_of_origin}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="rating" className="form-label">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                min="0"
                max="5"
                value={formData.rating || ''}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div className="col-span-2">
              <label htmlFor="tasting_notes" className="form-label">Tasting Notes</label>
              <textarea
                id="tasting_notes"
                name="tasting_notes"
                rows={3}
                value={formData.tasting_notes}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Bean'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BeanCreate