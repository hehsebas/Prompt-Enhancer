import { Loader2 } from 'lucide-react'
import './LoadingSpinner.css'

function LoadingSpinner() {
  return (
    <div className="loading-container fade-in">
      <div className="spinner-wrapper">
        <Loader2 size={48} className="spinner" />
        <h3>Optimizando tu prompt...</h3>
        <p>Esto puede tomar unos segundos</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner

