import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('API base URL:', import.meta.env.VITE_API_URL); // Verify the API is created.

export default api
