import { Roaster, RoasterCreate } from '../types'
import api from './client'

export const getRoasters = async (): Promise<Roaster[]> => {
  try {
    const response = await api.get('/roasters/')
    console.log('Roasters response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching roasters:', error)
    throw error
  }
}

export const getRoaster = async (id: number): Promise<Roaster> => {
  try {
    const response = await api.get(`/roasters/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching roaster ${id}:`, error)
    throw error
  }
}

export const createRoaster = async (roaster: RoasterCreate): Promise<Roaster> => {
  try {
    const response = await api.post('/roasters/', roaster)
    return response.data
  } catch (error) {
    console.error('Error creating roaster:', error)
    throw error
  }
}

export const updateRoaster = async (id: number, roaster: RoasterCreate): Promise<Roaster> => {
  try {
    const response = await api.put(`/roasters/${id}/`, roaster)
    return response.data
  } catch (error) {
    console.error(`Error updating roaster ${id}:`, error)
    throw error
  }
}

export const deleteRoaster = async (id: number): Promise<void> => {
  try {
    await api.delete(`/roasters/${id}/`)
  } catch (error) {
    console.error(`Error deleting roaster ${id}:`, error)
    throw error
  }
}
