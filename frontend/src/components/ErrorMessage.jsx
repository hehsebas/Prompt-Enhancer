import { AlertCircle, X } from 'lucide-react'
import '../index.css'
import './ErrorMessage.css'

function ErrorMessage({ message, onClose }) {
  return (
    <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
    <div className="error-container fade-in">
      <div className="error-content">
        <AlertCircle size={24} className="error-icon" />
        <div className="error-text">
          <h4>Error</h4>
          <p>{message}</p>
        </div>
      </div>
      <button className="error-close btn-icon" onClick={onClose} title="Cerrar">
        <X size={20} />
      </button>
    </div>
    </div>
  )
}

export default ErrorMessage

