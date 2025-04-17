import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBrew, updateBrew } from '../../api/brewService'
import { getBags } from '../../api/bagService'
import { getBaristas } from '../../api/baristaService'
import { getGrinders } from '../../api/grinderService'
import { getMachines } from '../../api/machineService'
import { BrewCreate as BrewCreateType } from '../../types'

const BrewEdit = () => {
  const { id } = useParams<{ id: string }>()
  const brewId = parseInt(id || '0', 10)
  const [formData, setFormData] = useState<Omit<BrewCreateType, 'machine_id' | 'bag_id' | 'grinder_id' | 'barista_id'> & { 
    machine_id: string, 
    bag_id: string, 
    grinder_id: string, 
    barista_id: string 
  }>({
    name: '',
    machine_id: '',
    bag_id: '',
    grinder_id: '',
    barista_id: '',
    brew_time: undefined,
    timestamp: '',
    dose: undefined,
    yield: undefined,
    rating: undefined,
    tasting_notes: '',
    reflections: ''
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: brew, isLoading: brewLoading } = useQuery({
    queryKey: ['brew', brewId],
    queryFn: () => getBrew(brewId),
    enabled: !!brewId
  })
  
  const { data: bags, isLoading: bagsLoading } = useQuery({
    queryKey: ['bags'],
    queryFn: getBags
  })
  
  const { data: baristas, isLoading: baristasLoading } = useQuery({
    queryKey: ['baristas'],
    queryFn: getBaristas
  })
  
  const { data: grinders, isLoading: grindersLoading } = useQuery({
    queryKey: ['grinders'],
    queryFn: getGrinders
  })
  
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines
  })
  
  useEffect(() => {
    if (brew) {
      // Format timestamp for datetime-local input if it exists
      let formattedTimestamp = ''
      if (brew.timestamp) {
        // Convert ISO string to format required by datetime-local input (YYYY-MM-DDThh:mm)
        const date = new Date(brew.timestamp)
        formattedTimestamp = date.toISOString().slice(0, 16)
      }
      
      setFormData({
        name: brew.name,
        machine_id: brew.machine_id.toString(),
        bag_id: brew.bag_id.toString(),
        grinder_id: brew.grinder_id.toString(),
        barista_id: brew.barista_id.toString(),
        brew_time: brew.brew_time,
        timestamp: formattedTimestamp,
        dose: brew.dose,
        yield: brew.yield,
        rating: brew.rating,
        tasting_notes: brew.tasting_notes || '',
        reflections: brew.reflections || ''
      })
    }
  }, [brew])
  
  const updateMutation = useMutation({
    mutationFn: (brew: BrewCreateType) => updateBrew(brewId, brew),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews'] })
      queryClient.invalidateQueries({ queryKey: ['brew', brewId] })
      navigate(`/brews/${brewId}`)
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update brew record')
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
    
    if (!formData.bag_id) {
      setError('Coffee Bag is required')
      return
    }
    
    if (!formData.barista_id) {
      setError('Barista is required')
      return
    }
    
    if (!formData.grinder_id) {
      setError('Grinder is required')
      return
    }
    
    if (!formData.machine_id) {
      setError('Machine is required')
      return
    }
    
    const updatedBrew: BrewCreateType = {
      ...formData,
      machine_id: parseInt(formData.machine_id, 10),
      bag_id: parseInt(formData.bag_id, 10),
      grinder_id: parseInt(formData.grinder_id, 10),
      barista_id: parseInt(formData.barista_id, 10),
      brew_time: formData.brew_time ? parseFloat(formData.brew_time.toString()) : undefined,
      dose: formData.dose ? parseFloat(formData.dose.toString()) : undefined,
      yield: formData.yield ? parseFloat(formData.yield.toString()) : undefined,
      rating: formData.rating ? parseInt(formData.rating.toString(), 10) : undefined
    }
    
    updateMutation.mutate(updatedBrew)
  }
  
  const isLoading = brewLoading || bagsLoading || baristasLoading || grindersLoading || machinesLoading
  
  if (isLoading) return <div className="text-center py-10">Loading...</div>
  
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Brew Record</h1>
        <button
          onClick={() => navigate(`/brews/${brewId}`)}
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
              <label htmlFor="name" className="form-label">Brew Name</label>
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
              <label htmlFor="timestamp" className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                id="timestamp"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="barista_id" className="form-label">Barista</label>
              <select
                id="barista_id"
                name="barista_id"
                value={formData.barista_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a barista</option>
                {baristas?.map(barista => (
                  <option key={barista.id} value={barista.id}>
                    {barista.first_name} {barista.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="bag_id" className="form-label">Coffee Bag</label>
              <select
                id="bag_id"
                name="bag_id"
                value={formData.bag_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a coffee bag</option>
                {bags?.map(bag => (
                  <option key={bag.id} value={bag.id}>
                    {bag.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="machine_id" className="form-label">Machine</label>
              <select
                id="machine_id"
                name="machine_id"
                value={formData.machine_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a machine</option>
                {machines?.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="grinder_id" className="form-label">Grinder</label>
              <select
                id="grinder_id"
                name="grinder_id"
                value={formData.grinder_id}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Select a grinder</option>
                {grinders?.map(grinder => (
                  <option key={grinder.id} value={grinder.id}>
                    {grinder.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="dose" className="form-label">Dose (g)</label>
              <input
                type="number"
                id="dose"
                name="dose"
                step="0.1"
                min="0"
                value={formData.dose || ''}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="yield" className="form-label">Yield (g)</label>
              <input
                type="number"
                id="yield"
                name="yield"
                step="0.1"
                min="0"
                value={formData.yield || ''}
                onChange={handleChange}
                className="input"
              />
            </div>
            
            <div>
              <label htmlFor="brew_time" className="form-label">Brew Time (seconds)</label>
              <input
                type="number"
                id="brew_time"
                name="brew_time"
                step="0.1"
                min="0"
                value={formData.brew_time || ''}
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
            
            <div className="col-span-2">
              <label htmlFor="reflections" className="form-label">Reflections</label>
              <textarea
                id="reflections"
                name="reflections"
                rows={3}
                value={formData.reflections}
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
              {updateMutation.isPending ? 'Updating...' : 'Update Brew'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BrewEdit