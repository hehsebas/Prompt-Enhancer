import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutos de timeout (la optimización puede tardar)
})

/**
 * Optimiza un prompt usando el backend
 * @param {Object} data - Datos del prompt a optimizar
 * @param {string} data.text - Texto del prompt original
 * @param {string} data.model - Modelo de IA a usar (gpt-4o-mini o gpt-4o)
 * @param {boolean} data.include_explanation - Si incluir explicación de cambios
 * @returns {Promise<Object>} Respuesta con el prompt optimizado
 */
export const optimizePrompt = async (data) => {
  try {
    const response = await apiClient.post('/optimize', data)
    return response.data
  } catch (error) {
    console.error('Error al optimizar prompt:', error)
    throw error
  }
}

/**
 * Obtiene la lista de modelos disponibles
 * @returns {Promise<Object>} Lista de modelos disponibles
 */
export const getAvailableModels = async () => {
  try {
    const response = await apiClient.get('/models')
    return response.data
  } catch (error) {
    console.error('Error al obtener modelos:', error)
    throw error
  }
}

/**
 * Verifica el estado del servicio
 * @returns {Promise<Object>} Estado del servicio
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    console.error('Error al verificar estado del servicio:', error)
    throw error
  }
}

export default {
  optimizePrompt,
  getAvailableModels,
  checkHealth,
}

