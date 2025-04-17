import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBarista, updateBarista } from '../../api/baristaService'
import { BaristaCreate as BaristaCreateType } from '../../types'

const BaristaEdit = () => {
  const { id } = useParams<{ id: string }>()
  const baristaId = parseInt(id || '0', 10)
  const [formData, setFormData] = useState<BaristaCreateType>({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: barista, isLoading } = useQuery({
    queryKey: ['barista', baristaId],
    queryFn: () => getBarista(baristaId),
    enabled: !!baristaId
  })
  
  useEffect(() => {
    if (barista) {
      setFormData({
        first_name: barista.first_name,
        last_name: barista.last_name,
        email: barista.email
      })
    }
  }, [barista])
  
  const updateMutation = useMutation({
    mutationFn: (barista: BaristaCreateType) => updateBarista(baristaId, barista),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baristas'] })
      queryClient.invalidateQueries({ queryKey: ['barista', baristaId] })
      navigate(`/baristas/${baristaId}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update barista')
    }
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name.trim()) {
      setError('First name is required')
      return
    }
    
    if (!formData.last_name.trim()) {
      setError('Last name is required')
      return
    }
    
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    
    updateMutation.mutate(formData)
  }
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Barista</h1>
        <button
          onClick={() => navigate(`/baristas/${baristaId}`)}
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
            <div>
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Barista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BaristaEdit