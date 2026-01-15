import './Sidebar.css'
import { LogIn, LogOut, User} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Sidebar({ isOpen, onClose }){
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/')
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h3>Prompt Enhancer</h3>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="/" className="sidebar-link active">
                <span className="sidebar-icon"></span>
                <span>Nuevo Chat</span>
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-link">
                <span className="sidebar-icon">
                </span>
                <span>Chats</span>
              </a>
            </li>
          </ul>
        </nav>
        
        {isAuthenticated ? (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-details">
                <span className="user-name">{user?.username || 'Usuario'}</span>
                <span className="user-plan">
                  {user?.plan || 'Free'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="sidebar-footer login-link">
            <LogIn size={18} />
            <span>Log in</span>
          </Link>
        )}
      </aside>
    </>
  )
}

export default Sidebar