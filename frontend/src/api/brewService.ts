import { Brew, BrewCreate } from '../types'
import api from './client'

export const getBrews = async (): Promise<Brew[]> => {
  try {
    const response = await api.get('/brews/')
    return response.data
  } catch (error) {
    console.error('Error fetching brews:', error)
    throw error
  }
}

export const getBrew = async (id: number): Promise<Brew> => {
  try {
    const response = await api.get(`/brews/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching brew ${id}:`, error)
    throw error
  }
}

export const createBrew = async (brew: BrewCreate): Promise<Brew> => {
  try {
    const response = await api.post('/brews/', brew)
    return response.data
  } catch (error) {
    console.error('Error creating brew:', error)
    throw error
  }
}

export const updateBrew = async (id: number, brew: BrewCreate): Promise<Brew> => {
  try {
    const response = await api.put(`/brews/${id}/`, brew)
    return response.data
  } catch (error) {
    console.error(`Error updating brew ${id}:`, error)
    throw error
  }
}

export const deleteBrew = async (id: number): Promise<void> => {
  try {
    await api.delete(`/brews/${id}/`)
  } catch (error) {
    console.error(`Error deleting brew ${id}:`, error)
    throw error
  }
}