import axios from 'axios'

const API_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


export const signUp = async (userData) => {
  try {
    const response = await api.post('/auth/signup', userData)
    
    // Guardar token en localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data
  } catch (error) {
    throw error.response?.data?.detail || 'Error al registrar usuario'
  }
}


export const logIn = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    
    // Guardar token en localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data
  } catch (error) {
    throw error.response?.data?.detail || 'Error al iniciar sesión'
  }
}


export const logOut = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}


export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const getToken = () => {
  return localStorage.getItem('token')
}
