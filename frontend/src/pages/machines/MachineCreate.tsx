import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMachine } from '../../api/machineService'
import { MachineCreate as MachineCreateType } from '../../types'

const MachineCreate = () => {
  const [formData, setFormData] = useState<MachineCreateType>({
    name: '',
    manufacturer: '',
    user_manual_link: '',
    image: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: createMachine,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['machines'] })
      navigate(`/machines/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create machine')
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Espresso Machine</h1>
        <button
          onClick={() => navigate('/machines')}
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
              <label htmlFor="name" className="form-label">Machine Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="e.g., Gaggia Classic Pro, La Marzocco Linea Mini, etc."
              />
            </div>
            
            <div>
              <label htmlFor="manufacturer" className="form-label">Manufacturer</label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Gaggia, La Marzocco, etc."
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
                placeholder="https://example.com/machine-image.jpg"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Machine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MachineCreate