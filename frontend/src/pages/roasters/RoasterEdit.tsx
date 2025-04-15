import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRoaster, updateRoaster } from '../../api/roasterService'
import { RoasterCreate as RoasterCreateType } from '../../types'

const RoasterEdit = () => {
  const { id } = useParams<{ id: string }>()
  const roasterId = parseInt(id || '0', 10)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: roaster, isLoading, error: fetchError } = useQuery({
    queryKey: ['roaster', roasterId],
    queryFn: () => getRoaster(roasterId),
    enabled: !!roasterId
  })
  
  useEffect(() => {
    if (roaster) {
      setName(roaster.name)
    }
  }, [roaster])
  
  const updateMutation = useMutation({
    mutationFn: (roaster: RoasterCreateType) => updateRoaster(roasterId, roaster),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roasters'] })
      queryClient.invalidateQueries({ queryKey: ['roaster', roasterId] })
      navigate(`/roasters/${roasterId}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update roaster')
    }
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    
    const updatedRoaster: RoasterCreateType = {
      name: name.trim()
    }
    
    updateMutation.mutate(updatedRoaster)
  }
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  if (fetchError) return (
    <div className="text-center py-10 text-red-600">
      Error loading roaster details
    </div>
  )
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Roaster</h1>
        <button
          onClick={() => navigate(`/roasters/${roasterId}`)}
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Roaster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoasterEdit