import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, 
})

export const optimizePrompt = async (data) => {
  try {
    const response = await apiClient.post('/optimize', data)
    return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const optimizePromptStream = async (data, onChunk, onMetadata, onError) => {
  try {
    const response = await fetch(`${API_BASE_URL}/optimize/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'start') {
              // Inicio del streaming
            } else if (data.type === 'chunk') {
              // Chunk de contenido
              onChunk(data.content)
            } else if (data.type === 'done') {
              // Metadata final
              onMetadata(data.metadata)
            } else if (data.type === 'error') {
              // Error
              onError(data.message)
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error en streaming:', error)
    onError(error.message || 'Error de conexión')
    throw error
  }
}

export const getAvailableModels = async () => {
  try {
    const response = await apiClient.get('/models')
    return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health')
    return response.data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export default {
  optimizePrompt,
  optimizePromptStream,
  getAvailableModels,
  checkHealth,
}

