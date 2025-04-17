import { Barista, BaristaCreate } from '../types'
import api from './client'

export const getBaristas = async (): Promise<Barista[]> => {
  try {
    const response = await api.get('/baristas/')
    return response.data
  } catch (error) {
    console.error('Error fetching baristas:', error)
    throw error
  }
}

export const getBarista = async (id: number): Promise<Barista> => {
  try {
    const response = await api.get(`/baristas/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching barista ${id}:`, error)
    throw error
  }
}

export const createBarista = async (barista: BaristaCreate): Promise<Barista> => {
  try {
    const response = await api.post('/baristas/', barista)
    return response.data
  } catch (error) {
    console.error('Error creating barista:', error)
    throw error
  }
}

export const updateBarista = async (id: number, barista: BaristaCreate): Promise<Barista> => {
  try {
    const response = await api.put(`/baristas/${id}/`, barista)
    return response.data
  } catch (error) {
    console.error(`Error updating barista ${id}:`, error)
    throw error
  }
}

export const deleteBarista = async (id: number): Promise<void> => {
  try {
    await api.delete(`/baristas/${id}/`)
  } catch (error) {
    console.error(`Error deleting barista ${id}:`, error)
    throw error
  }
}