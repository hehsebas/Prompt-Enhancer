import '../index.css'
import './Sidebar.css'
import { LogIn, LogOut, User, Plus, Search, Trash2, MessageSquare, AlertTriangle, CreditCard, Settings, HelpCircle, ChevronRight, ChevronsLeft } from 'lucide-react'
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
          <a href="/" className="sidebar-open">
            <svg width="142" height="22" viewBox="0 0 142 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.6699 10.3258H20.2517V14.4485H13.6699V10.3258Z" fill="#F1F5F9"/>
              <path d="M10.3257 16.2844L9.70654 16.2072C8.33955 16.0361 7.21533 14.7586 7.21533 13.2912C7.21535 12.2883 7.68467 11.4226 8.43018 10.9064L9.28467 10.3146L8.42041 9.73846C7.76687 9.30277 7.28763 8.44849 7.2876 7.4328C7.2876 5.90995 8.39487 4.69218 9.84814 4.51776L10.3735 4.45428L10.4604 3.9328C10.6961 2.5191 11.9358 1.41231 13.3804 1.41229C14.9523 1.41229 16.2904 2.6966 16.2905 4.32245V16.9797C16.2905 18.6147 14.9432 19.9621 13.3081 19.9621C11.673 19.9621 10.3257 18.6148 10.3257 16.9797V16.2844Z" fill="#6B63F1" stroke="#CBD5E1" stroke-width="1.41265"/>
              <path d="M27.4123 7.43271C27.4123 5.55219 26.038 4.03331 24.2298 3.81633C23.9405 2.08046 22.4216 0.706238 20.6135 0.706238C18.6606 0.706238 16.9971 2.29745 16.9971 4.32262V16.98C16.9971 19.0051 18.6606 20.6687 20.6858 20.6687C22.711 20.6687 24.3745 19.0051 24.3745 16.98V16.9076C26.1104 16.6907 27.4846 15.0994 27.4846 13.2913C27.4846 12.0617 26.906 10.9768 25.9657 10.3258C26.8336 9.7472 27.4123 8.66228 27.4123 7.43271Z" fill="#6B63F1"/>
              <path d="M27.4123 7.43271C27.4123 5.55219 26.038 4.03331 24.2298 3.81633C23.9405 2.08046 22.4216 0.706238 20.6135 0.706238C18.6606 0.706238 16.9971 2.29745 16.9971 4.32262V16.98C16.9971 19.0051 18.6606 20.6687 20.6858 20.6687C22.711 20.6687 24.3745 19.0051 24.3745 16.98V16.9076C26.1104 16.6907 27.4846 15.0994 27.4846 13.2913C27.4846 12.0617 26.906 10.9768 25.9657 10.3258C26.8336 9.7472 27.4123 8.66228 27.4123 7.43271Z" fill="#64748B"/>
              <path d="M16.2905 4.32272C16.2905 1.8983 18.2795 0 20.6132 0C22.6076 6.48664e-06 24.2868 1.38481 24.8136 3.20467C26.7248 3.66334 28.1184 5.37057 28.1184 7.43283C28.1184 8.54292 27.7168 9.57748 27.039 10.3243C27.7681 11.1024 28.1907 12.1502 28.1907 13.2913C28.1907 15.2349 26.8619 16.9791 25.0509 17.4893C24.796 19.6675 22.9286 21.3751 20.6855 21.3751C18.2703 21.3751 16.2905 19.3953 16.2905 16.9801V4.32272ZM17.7032 16.9801C17.7032 18.6151 19.0505 19.9624 20.6855 19.9624C22.3206 19.9624 23.6679 18.6151 23.668 16.9801V16.2842L24.2867 16.2068C25.6538 16.0359 26.7781 14.7589 26.7781 13.2913C26.7781 12.2884 26.309 11.4228 25.5635 10.9066L24.7087 10.3149L25.5737 9.73818C26.2272 9.30247 26.7057 8.44854 26.7057 7.43283C26.7057 5.90997 25.5988 4.69213 24.1455 4.51772L23.6199 4.45467L23.5329 3.93252C23.2973 2.51881 22.0578 1.41266 20.6132 1.41265C19.0413 1.41265 17.7032 2.69679 17.7032 4.32272V16.9801Z" fill="#CBD5E1"/>
              <path d="M2.67612 10.6877H0H2.67612ZM4.05035 5.91408L1.66354 4.68451L4.05035 5.91408ZM1.66354 16.6909L4.05035 15.389L1.66354 16.6909Z" fill="#64748B"/>
              <path d="M2.67612 10.6877H0M4.05035 5.91408L1.66354 4.68451M1.66354 16.6909L4.05035 15.389" stroke="#6B63F1" stroke-width="1.44655" stroke-miterlimit="10"/>
              <path d="M138.253 16.1843L132.587 1.38513H135.483L141.318 16.1843H138.253ZM126.562 16.1843L132.397 1.38513H135.293L129.627 16.1843H126.562ZM129.31 12.9285V10.3703H138.591V12.9285H129.31Z" fill="#64748B"/>
              <path d="M121.888 16.1843V1.38513H124.785V16.1843H121.888Z" fill="#64748B"/>
              <path d="M113.546 20.6876C112.743 20.6876 112.031 20.6312 111.411 20.5184C110.79 20.4057 110.269 20.2577 109.846 20.0745C109.423 19.8912 109.078 19.708 108.81 19.5248L109.91 17.2838C110.107 17.3965 110.368 17.5234 110.692 17.6643C111.016 17.8193 111.404 17.9462 111.855 18.0449C112.306 18.1576 112.827 18.214 113.419 18.214C113.983 18.214 114.476 18.1012 114.899 17.8757C115.336 17.6643 115.674 17.326 115.914 16.8609C116.168 16.4099 116.294 15.832 116.294 15.1273V5.61356H119.085V15.0427C119.085 16.2267 118.86 17.2415 118.409 18.0871C117.958 18.9469 117.316 19.5952 116.485 20.0322C115.667 20.4691 114.688 20.6876 113.546 20.6876ZM112.996 15.8884C112.024 15.8884 111.178 15.677 110.459 15.2542C109.755 14.8313 109.205 14.2394 108.81 13.4783C108.416 12.7172 108.218 11.8151 108.218 10.7721C108.218 9.67276 108.416 8.72139 108.81 7.918C109.205 7.10053 109.755 6.47332 110.459 6.0364C111.178 5.58537 112.024 5.35986 112.996 5.35986C113.842 5.35986 114.575 5.58537 115.195 6.0364C115.815 6.47332 116.294 7.10053 116.633 7.918C116.971 8.73548 117.14 9.708 117.14 10.8356C117.14 11.8504 116.971 12.7383 116.633 13.4994C116.294 14.2605 115.815 14.8525 115.195 15.2753C114.575 15.684 113.842 15.8884 112.996 15.8884ZM113.8 13.5417C114.279 13.5417 114.695 13.4219 115.047 13.1823C115.413 12.9286 115.695 12.5903 115.893 12.1675C116.09 11.7305 116.189 11.2372 116.189 10.6876C116.189 10.1238 116.083 9.63048 115.872 9.20765C115.674 8.78481 115.392 8.45359 115.026 8.21399C114.674 7.97438 114.258 7.85458 113.779 7.85458C113.285 7.85458 112.848 7.97438 112.468 8.21399C112.087 8.45359 111.791 8.78481 111.58 9.20765C111.368 9.63048 111.256 10.1238 111.242 10.6876C111.256 11.2372 111.368 11.7305 111.58 12.1675C111.791 12.5903 112.087 12.9286 112.468 13.1823C112.862 13.4219 113.306 13.5417 113.8 13.5417Z" fill="#64748B"/>
              <path d="M96.7729 16.1844V5.61356H99.3945L99.5636 7.5586V16.1844H96.7729ZM103.771 16.1844V10.7721H106.562V16.1844H103.771ZM103.771 10.7721C103.771 10.0533 103.686 9.49658 103.517 9.10194C103.362 8.70729 103.137 8.4254 102.841 8.25627C102.545 8.07304 102.199 7.98143 101.805 7.98143C101.086 7.96733 100.529 8.1858 100.134 8.63682C99.7539 9.08784 99.5636 9.75733 99.5636 10.6453H98.6334C98.6334 9.51772 98.7955 8.56635 99.1197 7.79115C99.4579 7.00187 99.9231 6.40285 100.515 5.99411C101.121 5.57128 101.826 5.35986 102.629 5.35986C103.461 5.35986 104.173 5.529 104.764 5.86726C105.356 6.20553 105.807 6.73407 106.118 7.45289C106.428 8.15761 106.576 9.07375 106.562 10.2013V10.7721H103.771Z" fill="#64748B"/>
              <path d="M91.4087 16.1844V5.61357H94.1994V16.1844H91.4087ZM92.804 3.90109C92.3812 3.90109 92.0077 3.74605 91.6835 3.43598C91.3593 3.1118 91.1973 2.73125 91.1973 2.29433C91.1973 1.8574 91.3593 1.4839 91.6835 1.17382C92.0077 0.849647 92.3812 0.687561 92.804 0.687561C93.241 0.687561 93.6145 0.849647 93.9245 1.17382C94.2487 1.4839 94.4108 1.8574 94.4108 2.29433C94.4108 2.73125 94.2487 3.1118 93.9245 3.43598C93.6145 3.74605 93.241 3.90109 92.804 3.90109Z" fill="#64748B"/>
              <path d="M83.4817 16.1844L86.9912 5.61353H89.8242L86.2301 16.1844H83.4817ZM76.4627 16.1844L79.8453 5.61353H82.2766L78.9362 16.1844H76.4627ZM76.1878 16.1844L72.5938 5.61353H75.4267L78.7883 16.1844H76.1878ZM83.4817 16.1844L80.1836 5.61353H82.5938L85.9553 16.1844H83.4817Z" fill="#64748B"/>
              <path d="M66.7252 16.4381C65.654 16.4381 64.6956 16.2055 63.8499 15.7404C63.0183 15.2612 62.3629 14.6058 61.8837 13.7742C61.4186 12.9427 61.186 11.9842 61.186 10.899C61.186 9.81371 61.4186 8.85528 61.8837 8.02371C62.3488 7.19214 62.9972 6.5438 63.8287 6.07868C64.6603 5.59947 65.6117 5.35986 66.6829 5.35986C67.7681 5.35986 68.7266 5.59947 69.5581 6.07868C70.3897 6.5438 71.038 7.19214 71.5032 8.02371C71.9683 8.85528 72.2008 9.81371 72.2008 10.899C72.2008 11.9842 71.9683 12.9427 71.5032 13.7742C71.038 14.6058 70.3897 15.2612 69.5581 15.7404C68.7407 16.2055 67.7963 16.4381 66.7252 16.4381ZM66.7252 13.8588C67.2466 13.8588 67.7047 13.732 68.0994 13.4783C68.494 13.2246 68.797 12.8792 69.0084 12.4423C69.234 11.9913 69.3467 11.4768 69.3467 10.899C69.3467 10.3211 69.234 9.81371 69.0084 9.37678C68.7829 8.92576 68.4658 8.5734 68.0571 8.3197C67.6624 8.066 67.2044 7.93915 66.6829 7.93915C66.1755 7.93915 65.7174 8.066 65.3087 8.3197C64.914 8.5734 64.6039 8.92576 64.3784 9.37678C64.1529 9.81371 64.0402 10.3211 64.0402 10.899C64.0402 11.4768 64.1529 11.9913 64.3784 12.4423C64.6039 12.8792 64.9211 13.2246 65.3298 13.4783C65.7385 13.732 66.2037 13.8588 66.7252 13.8588Z" fill="#64748B"/>
              <path d="M49.7412 16.1844V5.61356H52.3628L52.5319 7.5586V16.1844H49.7412ZM56.7391 16.1844V10.7721H59.5298V16.1844H56.7391ZM56.7391 10.7721C56.7391 10.0533 56.6545 9.49658 56.4854 9.10194C56.3304 8.70729 56.1048 8.4254 55.8089 8.25627C55.5129 8.07304 55.1676 7.98143 54.7729 7.98143C54.0541 7.96733 53.4974 8.1858 53.1027 8.63682C52.7222 9.08784 52.5319 9.75733 52.5319 10.6453H51.6017C51.6017 9.51772 51.7638 8.56635 52.0879 7.79115C52.4262 7.00187 52.8913 6.40285 53.4833 5.99411C54.0893 5.57128 54.7941 5.35986 55.5975 5.35986C56.429 5.35986 57.1408 5.529 57.7328 5.86726C58.3247 6.20553 58.7757 6.73407 59.0858 7.45289C59.3959 8.15761 59.5439 9.07375 59.5298 10.2013V10.7721H56.7391Z" fill="#64748B"/>
              <path d="M37.9402 12.4422L37.6019 8.80585L44.5364 1.38513H48.2784L37.9402 12.4422ZM36.2065 16.1843V1.38513H39.0607V16.1843H36.2065ZM44.938 16.1843L39.0395 8.65786L41.1325 6.92425L48.511 16.1843H44.938Z" fill="#64748B"/>
            </svg>
          </a>
          <button onClick={onToggleCollapse} className="sidebar-toggle-button" title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}>
            <ChevronsLeft size={16} className="sidebar-toggle-icon" />
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
              <div className="mb-sm">
                <h4 className="sidebar-text">Tus chats</h4>
              </div>
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
            <div className="profile-modal-user">
              <div className="profile-modal-avatar avatar avatar-md">
                <User size={20} />
              </div>
              <div className="profile-modal-info">
                <span className="profile-modal-name">{user?.username || 'Usuario'}</span>
              </div>
            </div>     
            <div className="profile-modal-divider"></div>
            <div className="profile-modal-options">
              <button className="profile-option-item" onClick={(openUpgradePage)}>
                <div className="profile-option-icon">
                  <CreditCard size={16} />
                </div>
                <span className="profile-option-text">Mejorar plan</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
              <button className="profile-option-item" onClick={() => {}}>
                <div className="profile-option-icon">
                  <Settings size={16} />
                </div>
                <span className="profile-option-text">Configuraciones</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
              <button className="profile-option-item" onClick={() => {}}>
                <div className="profile-option-icon">
                  <HelpCircle size={16} />
                </div>
                <span className="profile-option-text">Ayuda</span>
                <ChevronRight size={16} className="profile-option-arrow" />
              </button>
            </div>
            <div className="profile-modal-divider"></div>
            <div className="profile-modal-footer">
              <button className="profile-option-item profile-option-logout" onClick={() => {handleLogout(); handleCloseProfileOptions()}}>
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