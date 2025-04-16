import { Roaster, RoasterCreate } from '../types'
import api from './client'

export const getRoasters = async (): Promise<Roaster[]> => {
  const response = await api.get('/roasters/')
  return response.data
}

export const getRoaster = async (id: number): Promise<Roaster> => {
  const response = await api.get(`/roasters/${id}/`)
  return response.data
}

export const createRoaster = async (roaster: RoasterCreate): Promise<Roaster> => {
  const response = await api.post('/roasters/', roaster)
  return response.data
}

export const updateRoaster = async (id: number, roaster: RoasterCreate): Promise<Roaster> => {
  const response = await api.put(`/roasters/${id}/`, roaster)
  return response.data
}

export const deleteRoaster = async (id: number): Promise<void> => {
  await api.delete(`/roasters/${id}/`)
}
