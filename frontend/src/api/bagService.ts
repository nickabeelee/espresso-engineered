import { Bag, BagCreate } from '../types'
import api from './client'

export const getBags = async (): Promise<Bag[]> => {
  try {
    const response = await api.get('/bags/')
    return response.data
  } catch (error) {
    console.error('Error fetching bags:', error)
    throw error
  }
}

export const getBag = async (id: number): Promise<Bag> => {
  try {
    const response = await api.get(`/bags/${id}/`)
    return response.data
  } catch (error) {
    console.error(`Error fetching bag ${id}:`, error)
    throw error
  }
}

export const createBag = async (bag: BagCreate): Promise<Bag> => {
  try {
    // Remove undefined fields and fields with empty strings from the bag object
    const cleanBag = (bag: BagCreate) => {
      return Object.fromEntries(
        Object.entries(bag).filter(([_, v]) => v !== undefined && v !== '')
      );
    };

    console.log('Payload being sent:', cleanBag(bag));
    const response = await api.post('/bags/', cleanBag(bag));
    return response.data;
  } catch (error) {
    console.error('Error creating bag:', error);
    throw error;
  }
}
export const updateBag = async (id: number, bag: BagCreate): Promise<Bag> => {
  try {
    const response = await api.put(`/bags/${id}/`, bag)
    return response.data
  } catch (error) {
    console.error(`Error updating bag ${id}:`, error)
    throw error
  }
}

export const deleteBag = async (id: number): Promise<void> => {
  try {
    await api.delete(`/bags/${id}/`)
  } catch (error) {
    console.error(`Error deleting bag ${id}:`, error)
    throw error
  }
}
