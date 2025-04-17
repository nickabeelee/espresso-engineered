import { Machine, MachineCreate } from '../types'
import api from './client'

export const getMachines = async (): Promise<Machine[]> => {
  try {
    const response = await api.get('/machines/')
    return response.data
  } catch (error) {
    console.error('Error fetching machines:', error)
    throw error
  }
}

export const getMachine = async (id: number): Promise<Machine> => {
  try {
    const response = await api.get(`/machines/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching machine ${id}:`, error)
    throw error
  }
}

export const createMachine = async (machine: MachineCreate): Promise<Machine> => {
  try {
    const response = await api.post('/machines/', machine)
    return response.data
  } catch (error) {
    console.error('Error creating machine:', error)
    throw error
  }
}

export const updateMachine = async (id: number, machine: MachineCreate): Promise<Machine> => {
  try {
    const response = await api.put(`/machines/${id}/`, machine)
    return response.data
  } catch (error) {
    console.error(`Error updating machine ${id}:`, error)
    throw error
  }
}

export const deleteMachine = async (id: number): Promise<void> => {
  try {
    await api.delete(`/machines/${id}/`)
  } catch (error) {
    console.error(`Error deleting machine ${id}:`, error)
    throw error
  }
}