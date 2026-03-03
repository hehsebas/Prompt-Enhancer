import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as chatAPI from '../services/chatAPI'

const ChatContext = createContext()

// Constantes para modo invitado
const GUEST_MESSAGES_KEY = 'guest_messages'
const GUEST_PROMPT_COUNT_KEY = 'guest_prompt_count'
const MAX_GUEST_PROMPTS = 3

export function ChatProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chatSystemAvailable, setChatSystemAvailable] = useState(true) // Track if chat system is working
  const [guestPromptCount, setGuestPromptCount] = useState(0) // Contador de prompts para invitados

  // Cargar chats del usuario cuando se autentica o mensajes de invitado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChats()
      // Limpiar datos de invitado cuando el usuario se autentica
      localStorage.removeItem(GUEST_MESSAGES_KEY)
      localStorage.removeItem(GUEST_PROMPT_COUNT_KEY)
      setGuestPromptCount(0)
    } else {
      // Modo invitado: cargar mensajes desde localStorage
      const savedMessages = localStorage.getItem(GUEST_MESSAGES_KEY)
      const savedCount = localStorage.getItem(GUEST_PROMPT_COUNT_KEY)
      
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages))
        } catch (e) {
          console.error('Error al cargar mensajes de invitado:', e)
          setMessages([])
        }
      } else {
        setMessages([])
      }
      
      if (savedCount) {
        setGuestPromptCount(parseInt(savedCount, 10) || 0)
      } else {
        setGuestPromptCount(0)
      }
      
      // Limpiar chats cuando el usuario cierra sesión
      setChats([])
      setCurrentChat(null)
    }
  }, [isAuthenticated, user])

  const loadChats = async () => {
    if (!chatSystemAvailable) {
      return
    }
    
    try {
      const data = await chatAPI.listChats()
      setChats(data)
      setChatSystemAvailable(true)
    } catch (error) {
      setChatSystemAvailable(false)
      setChats([])
    }
  }

  const createNewChat = async (title = 'Nuevo Chat') => {
    if (!chatSystemAvailable) {
      return null
    }
    
    try {
      const chat = await chatAPI.createChat({ title })
      setChats(prev => [chat, ...prev])
      setCurrentChat(chat)
      setMessages([])
      return chat
    } catch (error) {
      setChatSystemAvailable(false)
      return null
    }
  }

  const selectChat = async (chatId) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const chat = await chatAPI.getChat(chatId)
      const msgs = await chatAPI.getMessages(chatId)
      
      setCurrentChat(chat)
      setMessages(msgs)
    } catch (error) {
      console.error('Error seleccionando chat:', error)
      setError('No se pudo cargar el chat. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content, parentMessageId = null, model = 'gpt-4o-mini') => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!isAuthenticated) {
        if (guestPromptCount >= MAX_GUEST_PROMPTS) {
          setError(`Has alcanzado el límite de ${MAX_GUEST_PROMPTS} prompts gratuitos. Por favor, inicia sesión para continuar usando el servicio.`)
          setIsLoading(false)
          return
        }
      }
      
      let chatId = currentChat?.id
      let isNewChat = false
      
      if (!chatId && isAuthenticated) {
        try {
          const newChat = await createNewChat()
          if (newChat) {
            chatId = newChat.id
            isNewChat = true
          }
        } catch (err) {
          console.warn('No se pudo crear chat, continuando sin guardar:', err)
        }
      }

      const userMessage = {
        role: 'user',
        content: content,
        created_at: new Date().toISOString(),
        isTemporary: true,
        id: `temp-user-${Date.now()}`
      }
      setMessages(prev => [...prev, userMessage])

      const assistantPlaceholder = {
        role: 'assistant',
        content: '',
        isStreaming: true,
        created_at: new Date().toISOString(),
        id: `temp-assistant-${Date.now()}`
      }
      setMessages(prev => [...prev, assistantPlaceholder])

      // Enviar mensaje con streaming
      await chatAPI.sendMessageStream(
        chatId,
        content,
        parentMessageId,
        model,
        // onChunk - actualizar contenido del mensaje del asistente
        (chunk) => {
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            if (newMessages[lastIndex]?.isStreaming) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: newMessages[lastIndex].content + chunk
              }
            }
            return newMessages
          })
        },
        // onMetadata - finalizar mensaje
        async (metadata) => {
          // IMPORTANTE: Si es un chat nuevo, actualizar currentChat con el chat_id recibido
          if (isNewChat && metadata.chat_id && !currentChat) {
            try {
              const chat = await chatAPI.getChat(metadata.chat_id)
              setCurrentChat(chat)
              console.log('[INFO] Chat actualizado con ID:', metadata.chat_id)
            } catch (err) {
              console.error('Error al obtener chat recién creado:', err)
              // Si falla, al menos crear un objeto temporal con el ID
              setCurrentChat({
                id: metadata.chat_id,
                title: 'Nuevo Chat',
                created_at: new Date().toISOString()
              })
            }
          }
          
          setMessages(prev => {
            const newMessages = [...prev]
            const lastIndex = newMessages.length - 1
            
            // Actualizar mensaje del usuario con ID real
            if (newMessages[lastIndex - 1]?.isTemporary) {
              newMessages[lastIndex - 1] = {
                ...newMessages[lastIndex - 1],
                id: metadata.user_message_id || newMessages[lastIndex - 1].id,
                isTemporary: false
              }
            }
            
            // Finalizar mensaje del asistente
            if (newMessages[lastIndex]?.isStreaming) {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                id: metadata.assistant_message_id || newMessages[lastIndex].id,
                isStreaming: false,
                model: metadata.model,
                tokens_used: metadata.prompt_tokens + metadata.completion_tokens,
                cost_usd: metadata.approximate_cost_usd,
                generation_time_seconds: metadata.elapsed_time_seconds,
                parent_message_id: parentMessageId
              }
            }
            
            if (!isAuthenticated) {
              localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(newMessages))
            }
            
            return newMessages
          })
          
          // Si es un chat nuevo y el título es "Nuevo Chat", actualizarlo con IA
          if (isNewChat && metadata.chat_id && isAuthenticated) {
            // Generar título con IA de forma asíncrona (no bloqueante)
            generateAndUpdateTitle(metadata.chat_id, content, model).catch(err => {
              console.error('Error al actualizar título:', err)
            })
          }
          
          if (!isAuthenticated) {
            const newCount = guestPromptCount + 1
            setGuestPromptCount(newCount)
            localStorage.setItem(GUEST_PROMPT_COUNT_KEY, newCount.toString())
          }
          
          if (chatSystemAvailable && isAuthenticated) {
            loadChats()
          }
          setIsLoading(false)
        },
        // onError
        (errorMessage) => {
          console.error('Error del servidor:', errorMessage)
          
          let userFriendlyError = 'No se pudo procesar tu mensaje. Por favor, intenta de nuevo.'
          
          if (errorMessage) {
            if (errorMessage.includes('404') || errorMessage.includes('NOT_FOUND')) {
              userFriendlyError = 'El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.'
            } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
              // Extraer el tiempo de espera si está disponible
              const retryMatch = errorMessage.match(/retry in (\d+)/i)
              const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 20
              userFriendlyError = `Has excedido el límite de solicitudes. Por favor, espera ${retrySeconds} segundos e intenta de nuevo.`
            } else if (errorMessage.includes('500') || errorMessage.includes('INTERNAL')) {
              userFriendlyError = 'Ocurrió un error en el servidor. Por favor, intenta de nuevo.'
            } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
              userFriendlyError = 'La solicitud tardó demasiado. Por favor, intenta de nuevo.'
            } else if (!errorMessage.includes('No autorizado')) {
              userFriendlyError = 'Ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.'
            }
          }
          
          if (!errorMessage || !errorMessage.includes('No autorizado')) {
            setError(userFriendlyError)
          }
          
          setMessages(prev => prev.filter(m => !m.isStreaming && !m.isTemporary))
          setIsLoading(false)
        }
      )

    } catch (error) {
      console.error('Error enviando mensaje:', error)
      
      let userFriendlyError = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión e intenta de nuevo.'
      
      const errorMsg = error.message || ''
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        userFriendlyError = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.'
      } else if (!errorMsg.includes('No autorizado') && !errorMsg.includes('401')) {
        userFriendlyError = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
      }
      
      if (!errorMsg.includes('No autorizado') && !errorMsg.includes('401')) {
        setError(userFriendlyError)
      }
      
      setMessages(prev => prev.filter(m => !m.isStreaming && !m.isTemporary))
      setIsLoading(false)
    }
  }

  const deleteChat = async (chatId) => {
    try {
      await chatAPI.deleteChat(chatId)
      setChats(prev => prev.filter(c => c.id !== chatId))
      
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error eliminando chat:', error)
      setError('Error al eliminar el chat')
    }
  }

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      const updatedChat = await chatAPI.updateChat(chatId, { title: newTitle })
      
      setChats(prev => prev.map(c => c.id === chatId ? updatedChat : c))
      
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat)
      }
    } catch (error) {
      console.error('Error actualizando título:', error)
      setError('Error al actualizar el título')
    }
  }

  // Generar título automáticamente usando IA
  const generateAndUpdateTitle = async (chatId, userMessage, model = 'gemini-2.5-flash') => {
    try {
      const title = await chatAPI.generateChatTitle(userMessage, model)
      if (title && title !== 'Nuevo Chat') {
        await updateChatTitle(chatId, title)
      }
    } catch (error) {
      console.error('Error generando título con IA:', error)
      // No mostrar error al usuario, el título se puede quedar como "Nuevo Chat"
    }
  }

  const searchChats = async (query) => {
    try {
      const results = await chatAPI.searchChats(query)
      setChats(results)
    } catch (error) {
      console.error('Error buscando chats:', error)
      setError('Error al buscar chats')
    }
  }

  const clearCurrentChat = () => {
    setCurrentChat(null)
    setMessages([])
    
    if (!isAuthenticated) {
      localStorage.removeItem(GUEST_MESSAGES_KEY)
    }
  }

  const clearError = () => {
    setError(null)
  }
  
  const resetGuestCount = () => {
    setGuestPromptCount(0)
    localStorage.removeItem(GUEST_PROMPT_COUNT_KEY)
  }
  
  const getRemainingGuestPrompts = () => {
    if (isAuthenticated) return null // Usuarios autenticados no tienen límite
    return Math.max(0, MAX_GUEST_PROMPTS - guestPromptCount)
  }

  return (
    <ChatContext.Provider value={{
      // Estado
      chats,
      currentChat,
      messages,
      isLoading,
      error,
      guestPromptCount,
      
      // Acciones
      createNewChat,
      selectChat,
      sendMessage,
      deleteChat,
      updateChatTitle,
      searchChats,
      loadChats,
      clearCurrentChat,
      clearError,
      resetGuestCount,
      getRemainingGuestPrompts
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  // Retornar valores por defecto si no está dentro de ChatProvider
  // Esto permite usar el hook en componentes que pueden o no estar dentro del provider
  if (!context) {
    return {
      chats: [],
      currentChat: null,
      messages: [],
      isLoading: false,
      error: null,
      guestPromptCount: 0,
      createNewChat: async () => null,
      selectChat: async () => {},
      sendMessage: async () => {},
      deleteChat: async () => {},
      updateChatTitle: async () => {},
      searchChats: async () => {},
      loadChats: async () => {},
      clearCurrentChat: () => {},
      clearError: () => {},
      resetGuestCount: () => {},
      getRemainingGuestPrompts: () => null
    }
  }
  return context
}
