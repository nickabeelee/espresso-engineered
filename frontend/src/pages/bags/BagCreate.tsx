import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBag } from '../../api/bagService'
import { getBeans } from '../../api/beanService'
import { BagCreate as BagCreateType } from '../../types'

const BagCreate = () => {
  const [formData, setFormData] = useState<Omit<BagCreateType, 'bean_id'> & { bean_id: string }>({
    name: '',
    bean_id: '',
    roast_date: '',
    weight: undefined,
    price: undefined,
    purchase_location: '',
    rating: undefined
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: beans, isLoading: beansLoading } = useQuery({
    queryKey: ['beans'],
    queryFn: getBeans
  })
  
  const createMutation = useMutation({
    mutationFn: createBag,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bags'] })
      navigate(`/bags/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create bag')
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
    
    if (!formData.bean_id) {
      setError('Bean is required')
      return
    }
    
    const newBag: BagCreateType = {
      ...formData,
      bean_id: parseInt(formData.bean_id, 10),
      weight: formData.weight ? parseFloat(formData.weight.toString()) : undefined,
      price: formData.price ? parseFloat(formData.price.toString()) : undefined,
      rating: formData.rating ? parseInt(formData.rating.toString(), 10) : undefined
    }
    
    createMutation.mutate(newBag)
  }
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Coffee Bag</h1>
        <button
          onClick={() => navigate('/bags')}
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="name" className="form-label">Bag Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="e.g., Morning Blend - December 2023"
              />
            </div>
            
            <div>
              <label htmlFor="bean_id" className="form-label">Bean</label>
              <select
                id="bean_id"
                name="bean_id"
                value={formData.bean_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a bean</option>
                {beansLoading ? (
                  <option disabled>Loading beans...</option>
                ) : (
                  beans?.map(bean => (
                    <option key={bean.id} value={bean.id}>
                      {bean.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="roast_date" className="form-label">Roast Date</label>
              <input
                type="date"
                id="roast_date"
                name="roast_date"
                value={formData.roast_date}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="form-label">Weight (g)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                step="0.1"
                min="0"
                value={formData.weight || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 250"
              />
            </div>
            
            <div>
              <label htmlFor="price" className="form-label">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 18.99"
              />
            </div>
            
            <div>
              <label htmlFor="purchase_location" className="form-label">Purchase Location</label>
              <input
                type="text"
                id="purchase_location"
                name="purchase_location"
                value={formData.purchase_location}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Local Cafe, Online"
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
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Bag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BagCreate