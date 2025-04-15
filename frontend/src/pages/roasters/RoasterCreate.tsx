import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRoaster } from '../../api/roasterService'
import { RoasterCreate as RoasterCreateType } from '../../types'

const RoasterCreate = () => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: createRoaster,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roasters'] })
      navigate(`/roasters/${data.id}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create roaster')
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    const newRoaster: RoasterCreateType = {
      name: name.trim()
    }
    
    createMutation.mutate(newRoaster)
  }
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Roaster</h1>
        <button
          onClick={() => navigate('/roasters')}
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
          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              Roaster Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Enter roaster name"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Roaster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoasterCreate