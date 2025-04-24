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
    // Convert blank strings to null for specific fields
    const sanitizedMachine = {
      ...machine,
      image: machine.image === '' ? null : machine.image,
      user_manual_link: machine.user_manual_link === '' ? null : machine.user_manual_link,
    };

    console.log('Payload being sent:', sanitizedMachine);
    const response = await api.post('/machines/', sanitizedMachine);
    return response.data;
  } catch (error) {
    console.error('Error creating machine:', error);
    throw error;
  }
}

export const updateMachine = async (id: number, machine: MachineCreate): Promise<Machine> => {
  try {
    // Convert blank strings to null for specific fields
    const sanitizedMachine = {
      ...machine,
      image: machine.image === '' ? null : machine.image,
      user_manual_link: machine.user_manual_link === '' ? null : machine.user_manual_link,
    };

    const response = await api.put(`/machines/${id}/`, sanitizedMachine);
    return response.data;
  } catch (error) {
    console.error(`Error updating machine ${id}:`, error);
    throw error;
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
