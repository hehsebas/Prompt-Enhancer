import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import ConversationView from './components/ConversationView'
import ErrorMessage from './components/ErrorMessage'
import { Menu } from 'lucide-react'
import { useChat } from './context/ChatContext'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { error: chatError, clearError } = useChat()
  
  return (
    <div className="app">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Botón hamburguesa para mobile */}
      <button 
        className="mobile-menu-button" 
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <ConversationView />
      </main>
    </div>
  )
}

export default App

