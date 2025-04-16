import { Bean, BeanCreate } from '../types'
import api from './client'

export const getBeans = async (): Promise<Bean[]> => {
  const response = await api.get('/beans/')
  return response.data
}

export const getBean = async (id: number): Promise<Bean> => {
  const response = await api.get(`/beans/${id}/`)
  return response.data
}

export const createBean = async (bean: BeanCreate): Promise<Bean> => {
  const response = await api.post('/beans/', bean)
  return response.data
}

export const updateBean = async (id: number, bean: BeanCreate): Promise<Bean> => {
  const response = await api.put(`/beans/${id}/`, bean)
  return response.data
}

export const deleteBean = async (id: number): Promise<void> => {
  await api.delete(`/beans/${id}/`)
}
