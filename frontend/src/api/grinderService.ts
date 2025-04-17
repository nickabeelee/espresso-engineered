import { Grinder, GrinderCreate } from '../types'
import api from './client'

export const getGrinders = async (): Promise<Grinder[]> => {
  try {
    const response = await api.get('/grinders/')
    return response.data
  } catch (error) {
    console.error('Error fetching grinders:', error)
    throw error
  }
}

export const getGrinder = async (id: number): Promise<Grinder> => {
  try {
    const response = await api.get(`/grinders/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching grinder ${id}:`, error)
    throw error
  }
}

export const createGrinder = async (grinder: GrinderCreate): Promise<Grinder> => {
  try {
    const response = await api.post('/grinders/', grinder)
    return response.data
  } catch (error) {
    console.error('Error creating grinder:', error)
    throw error
  }
}

export const updateGrinder = async (id: number, grinder: GrinderCreate): Promise<Grinder> => {
  try {
    const response = await api.put(`/grinders/${id}/`, grinder)
    return response.data
  } catch (error) {
    console.error(`Error updating grinder ${id}:`, error)
    throw error
  }
}

export const deleteGrinder = async (id: number): Promise<void> => {
  try {
    await api.delete(`/grinders/${id}/`)
  } catch (error) {
    console.error(`Error deleting grinder ${id}:`, error)
    throw error
  }
}