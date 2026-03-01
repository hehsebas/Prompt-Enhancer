import '../index.css'
import './Sidebar.css'
import { LogIn, LogOut, User, Plus, Search, Trash2, MessageSquare, PanelLeft, AlertTriangle, CreditCard, Palette, Settings, HelpCircle, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useState } from 'react'

function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }){
  const { user, isAuthenticated, logout } = useAuth()
  const { chats, currentChat, createNewChat, selectChat, deleteChat, searchChats } = useChat()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showProfileOptions, setShowProfileOptions] = useState(false)

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }

  const handleNewChat = async () => {
    await createNewChat()
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  const handleSelectChat = async (chatId) => {
    await selectChat(chatId)
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  const handleDeleteClick = (chatId, e) => {
    e.stopPropagation()
    setShowDeleteModal(chatId)
  }

  const handleConfirmDelete = async () => {
    if (showDeleteModal) {
      await deleteChat(showDeleteModal)
      setShowDeleteModal(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(null)
  }
  const handleSearchClick = () => {
    setShowSearchModal(true)
  }
  const handleCancelSearch = () => {
    setShowSearchModal(false)
  }
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchChats(query)
    } else {
      // Recargar todos los chats si la búsqueda está vacía
      searchChats('')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Hoy'
    } else if (diffDays === 1) {
      return 'Ayer'
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }
  }

  const handleShowProfileOptions = () => {
    setShowProfileOptions(!showProfileOptions)
  }

  const handleCloseProfileOptions = () => {
    setShowProfileOptions(false)
  }

  const openUpgradePage = () => {
    navigate('/upgrade-plan')
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">Prompt Enhancer</h3>
          <button onClick={onToggleCollapse} className="sidebar-toggle-button" title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}>
            <PanelLeft size={16} className="sidebar-toggle-icon" />
          </button>
        </div>
        
        {isAuthenticated ? (
          <>
            <div className="sidebar-new-chat">
              <button 
                className="btn-new-chat" 
                onClick={handleNewChat}
                title="Nuevo chat"
                >
                  <Plus size={16} className="sidebar-new-chat-icon" />
              <span className="sidebar-text">Nuevo chat</span>
              </button>
            </div>
            <div className="sidebar-search">
              <button
                className="btn-search"
                onClick={handleSearchClick}
              >
                <Search size={16} className="sidebar-search-icon" />
                <span className="sidebar-text">Buscar chats</span>
              </button>
            </div>


            <div className="sidebar-chats">
              <h4 className="sidebar-text">Tus chats</h4>
              {chats.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={20} className="empty-icon" />
                  <p className="sidebar-text">No hay chats guardados</p>
                  <p className="empty-subtitle sidebar-text">
                    Crea uno nuevo para comenzar
                  </p>
                </div>
              ) : (
                <div className="chats-list">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                      onClick={() => handleSelectChat(chat.id)}
                      title={chat.title}
                    >
                      <MessageSquare size={16} className="chat-icon" />
                      <div className="chat-info">
                        <h4 className="chat-title">{chat.title}</h4>
                        <div className="chat-meta">
                          <span className="chat-date">{formatDate(chat.updated_at)}</span>
                          {chat.message_count > 0 && (
                            <span className="chat-count">{chat.message_count} msgs</span>
                          )}
                        </div>
                      </div>
                      <div className="chat-actions">
                        <button
                          onClick={(e) => handleDeleteClick(chat.id, e)}
                          className="btn-icon-small btn-delete"
                          title="Eliminar chat"
                          aria-label="Eliminar chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="sidebar-guest-info">
            <div className="guest-message">
              <h4>Modo Invitado</h4>
              <p className="guest-subtitle">
                Inicia sesión para guardar tu historial y acceder a conversaciones avanzadas
              </p>
            </div>
          </div>
        )}
        
        {isAuthenticated ? (
          <button className="sidebar-footer" onClick={handleShowProfileOptions}>
            <div className="user-info">
              <div className="user-avatar avatar avatar-sm">
                <User size={20} />
              </div>
              <div className="user-details">
                <span className="user-name">{user?.username || 'Usuario'}</span>
                <span className="user-plan">
                  {user?.plan || 'Free'}
                </span>
              </div>
            </div>
          </button>
        ) : (
          <Link to="/login" className="sidebar-footer login-link" title="Iniciar sesión">
            <LogIn size={16} />
            <span className="sidebar-text">Log in</span>
          </Link>
        )}
      </aside>
      {showDeleteModal && (
        <div className="delete-modal-overlay modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={48} />
            </div>
            <h3 className="delete-modal-title">¿Eliminar este chat?</h3>
            <p className="delete-modal-message">
              Esta acción no se puede deshacer. Se eliminará el chat y todos sus mensajes permanentemente.
            </p>
            <div className="delete-modal-actions">
              <button 
                onClick={handleCancelDelete} 
                className="btn-cancel btn btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete} 
                className="btn-confirm-delete btn btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {showProfileOptions && (
        <div className="profile-options-overlay" onClick={handleCloseProfileOptions}>
          <div className="profile-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div className="profile-modal-user">
                <div className="profile-modal-avatar avatar avatar-lg">
                  <User size={20} />
                </div>
                <div className="profile-modal-info">
                  <span className="profile-modal-name">{user?.username || 'Usuario'}</span>
                  <span className="profile-modal-email">@{user?.username?.toLowerCase() || 'usuario'}</span>
                </div>
              </div>
            </div>
            <div className="profile-modal-divider"></div>
            <div className="profile-modal-options">
              <button className="profile-option-item" onClick={(openUpgradePage)}>
                <div className="profile-option-icon">
                  <CreditCard size={16} />
                </div>
                <span className="profile-option-text">Upgrade plan</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
              <button className="profile-option-item" onClick={() => {}}>
                <div className="profile-option-icon">
                  <Palette size={16} />
                </div>
                <span className="profile-option-text">Personalization</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
              <button className="profile-option-item" onClick={() => {}}>
                <div className="profile-option-icon">
                  <Settings size={16} />
                </div>
                <span className="profile-option-text">Settings</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
              <button className="profile-option-item" onClick={() => {}}>
                <div className="profile-option-icon">
                  <HelpCircle size={16} />
                </div>
                <span className="profile-option-text">Help</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
            </div>
            <div className="profile-modal-divider"></div>
            <div className="profile-modal-footer">
              <button className="profile-option-item profile-option-logout" onClick={handleLogout}>
                <div className="profile-option-icon">
                  <LogOut size={16} />
                </div>
                <span className="profile-option-text">Log out</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar