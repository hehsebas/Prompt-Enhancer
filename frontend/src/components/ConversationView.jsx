import { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowRight, Copy, Check, AlertCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import './ConversationView.css'
import { useNavigate } from 'react-router-dom'

function ConversationView() {
  const { messages, sendMessage, isLoading, currentChat, error, clearError, getRemainingGuestPrompts } = useChat()
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { user, isAuthenticated } = useAuth()
  const remainingPrompts = getRemainingGuestPrompts()
  const [copied, setCopied] = useState(false)
  const [icon, setIcon] = useState(true)
  const [copiedTimeout, setCopiedTimeout] = useState(null)
  const navigate = useNavigate()
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return

    const message = inputMessage
    setInputMessage('')
    await sendMessage(message)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setCopiedTimeout(setTimeout(() => setCopied(false), 2000))
    setIcon(false)
    setTimeout(() => setIcon(true), 2000)
  }

  useEffect(() => {
    return () => clearTimeout(copiedTimeout)
  }, [])
  
  // Determinar qué error mostrar (prioridad: límite de prompts > error del servidor)
  const showLimitError = !isAuthenticated && remainingPrompts === 0
  const showServerError = error && !showLimitError

  return (
    <div className="conversation-view">
      {/* Alerta única de error */}
      {(showLimitError || showServerError) && (
        <div className="conversation-alert">
          <div className="alert-content">
            <AlertCircle size={16} />
            {showLimitError ? (
              <>
                <span>Has alcanzado el límite de prompts gratuitos. Por favor, inicia sesión para continuar.</span>
                <Link to="/login" className="alert-link">Iniciar sesión</Link>
                <button onClick={() => navigate('/login')} className="alert-close"><X size={16} /></button>
              </>
            ) : (
              <>
                <span>{error}</span>
                <button onClick={clearError} className="alert-close">×</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="conversation-wrapper">
        {messages.length === 0 && !isLoading ? (
          <div className="conversation-empty">
            <div className="empty-content">
              <h2>Hola {user?.username.split(' ')[0] || ''} con que puedo ayudarte hoy? </h2>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`message ${message.role}`}
              >
                <div className="message-content">
                  <div className="message-text">
                    {message.content}
                    {message.isStreaming && <span className="cursor-blink">|</span>}
                  </div>
                  {message.role === 'assistant' && message.model && !message.isStreaming && (
                  <>
                  {/*
                    <div className="message-metadata">
                      <span className="metadata-item">{message.model}</span>
                      {message.tokens_used && (
                        <span className="metadata-item">{message.tokens_used} tokens</span>
                      )}
                      {message.cost_usd && (
                        <span className="metadata-item">${message.cost_usd.toFixed(6)}</span>
                      )}
                      {message.generation_time_seconds && (
                        <span className="metadata-item">{message.generation_time_seconds}s</span>
                      )}
                    </div>
                    */}
                    <div className="conversation-actions">
                      <button className="conversation-action-button" onClick={() => handleCopy(message.content)}>
                        {icon && <Copy size={16} />}
                        {copied && <Check size={16} />}
                      </button>
                    </div>
                  </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="conversation-input">
          <div className="input-wrapper">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentChat ? "Refina tu prompt o añade más contexto..." : "Escribe tu prompt aquí..."}
              disabled={isLoading || (!isAuthenticated && remainingPrompts === 0)}
              rows={3}
              className="conversation-textarea"
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading || (!isAuthenticated && remainingPrompts === 0)}
              className="send-button"
              title="Enviar mensaje (Enter)"
              >
              {isLoading ? (
                <Loader2 size={20} className="spinner" />
              ) : (
                <ArrowRight size={12} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationView
