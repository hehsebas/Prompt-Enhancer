/**
 * Servicio de API para gestión de chats y conversaciones
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Obtener headers de autenticación con token de Supabase
const getAuthHeaders = () => {
  const session = JSON.parse(localStorage.getItem('supabase_session') || '{}')
  const userId = session?.user?.id
  
  const headers = {
    'Content-Type': 'application/json'
  }
  
  // Solo agregar Authorization si hay userId (modo autenticado)
  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`
  }
  
  return headers
}

// =====================================================
// OPERACIONES DE CHAT
// =====================================================

export const createChat = async (data = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: data.title || 'Nuevo Chat',
        tags: data.tags || []
      })
    })
    
    if (!response.ok) {
      throw new Error('Error al crear el chat')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en createChat:', error)
    throw error
  }
}

export const listChats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      limit: params.limit || 20,
      offset: params.offset || 0,
      order_by: params.order_by || 'updated_at',
      order_direction: params.order_direction || 'desc',
      is_archived: params.is_archived || false
    })
    
    if (params.query) {
      queryParams.append('query', params.query)
    }
    
    if (params.tags && params.tags.length > 0) {
      queryParams.append('tags', params.tags.join(','))
    }
    
    const response = await fetch(`${API_BASE_URL}/chats?${queryParams}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al listar chats')
    }
    
    return await response.json()
  } catch (error) {
    // Silenciar error - el sistema funciona sin chats configurados
    throw error
  }
}

export const getChat = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener el chat')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en getChat:', error)
    throw error
  }
}

export const updateChat = async (chatId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Error al actualizar el chat')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en updateChat:', error)
    throw error
  }
}

export const deleteChat = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al eliminar el chat')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en deleteChat:', error)
    throw error
  }
}

// =====================================================
// OPERACIONES DE MENSAJES
// =====================================================

export const getMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al obtener mensajes')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en getMessages:', error)
    throw error
  }
}

// =====================================================
// CONVERSACIÓN CON STREAMING
// =====================================================

export const sendMessageStream = async (chatId, content, parentMessageId, model, onChunk, onMetadata, onError) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversation/stream`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chat_id: chatId || null,
        user_message: content,
        parent_message_id: parentMessageId || null,
        model: model || 'gemini-2.5-flash',
        include_explanation: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Error en la respuesta del servidor')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    
    let chatInfo = {}

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Procesar mensajes completos
      const messages = buffer.split('\n\n')
      buffer = messages.pop() // Mantener mensaje incompleto en buffer

      for (const message of messages) {
        if (message.startsWith('data: ')) {
          try {
            const jsonString = message.substring(6)
            const parsedData = JSON.parse(jsonString)

            if (parsedData.type === 'chat_info') {
              chatInfo = parsedData
            } else if (parsedData.type === 'chunk') {
              onChunk(parsedData.content)
            } else if (parsedData.type === 'done') {
              onMetadata({
                ...parsedData.metadata,
                chat_id: chatInfo.chat_id,
                user_message_id: chatInfo.user_message_id,
                assistant_message_id: parsedData.assistant_message_id
              })
            } else if (parsedData.type === 'error') {
              onError(parsedData.message)
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, 'Raw data:', message)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error durante el streaming:', error)
    onError(error.message || 'Error de conexión durante el streaming')
  }
}

// =====================================================
// BÚSQUEDA Y FILTRADO
// =====================================================

export const searchChats = async (query) => {
  return listChats({ query })
}

// =====================================================
// GENERACIÓN DE TÍTULO CON IA
// =====================================================

export const generateChatTitle = async (message, model = 'gemini-2.5-flash') => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        model: model
      })
    })
    
    if (!response.ok) {
      throw new Error('Error al generar el título')
    }
    
    const data = await response.json()
    return data.title || 'Nuevo Chat'
  } catch (error) {
    console.error('Error en generateChatTitle:', error)
    // En caso de error, devolver un título genérico
    return 'Nuevo Chat'
  }
}

// =====================================================
// EXPORTACIÓN
// =====================================================

export const exportChat = async (chatId, format = 'json') => {
  try {
    const response = await fetch(`${API_BASE_URL}/chats/${chatId}/export?format=${format}`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error('Error al exportar el chat')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error en exportChat:', error)
    throw error
  }
}

export default {
  createChat,
  listChats,
  getChat,
  updateChat,
  deleteChat,
  getMessages,
  sendMessageStream,
  searchChats,
  exportChat,
  generateChatTitle
}
