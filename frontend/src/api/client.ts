import axios from 'axios'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

console.log('API base URL:', API_URL); // Verify the API URL being used

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add request interceptor for auth token and debugging
api.interceptors.request.use(
  async (config) => {
    // Add auth token to request header if user is logged in
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      })
    } else {
      console.error('Unexpected API error:', error)
    }
    return Promise.reject(error)
  }
)

export default api
