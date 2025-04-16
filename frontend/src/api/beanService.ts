import { Bean, BeanCreate } from '../types'
import api from './client'

export const getBeans = async (): Promise<Bean[]> => {
  try {
    const response = await api.get('/beans/')
    console.log('Beans response:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching beans:', error)
    throw error
  }
}

export const getBean = async (id: number): Promise<Bean> => {
  try {
    const response = await api.get(`/beans/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching bean ${id}:`, error)
    throw error
  }
}

export const createBean = async (bean: BeanCreate): Promise<Bean> => {
  try {
    const response = await api.post('/beans/', bean)
    return response.data
  } catch (error) {
    console.error('Error creating bean:', error)
    throw error
  }
}

export const updateBean = async (id: number, bean: BeanCreate): Promise<Bean> => {
  try {
    const response = await api.put(`/beans/${id}/`, bean)
    return response.data
  } catch (error) {
    console.error(`Error updating bean ${id}:`, error)
    throw error
  }
}

export const deleteBean = async (id: number): Promise<void> => {
  try {
    await api.delete(`/beans/${id}/`)
  } catch (error) {
    console.error(`Error deleting bean ${id}:`, error)
    throw error
  }
}
