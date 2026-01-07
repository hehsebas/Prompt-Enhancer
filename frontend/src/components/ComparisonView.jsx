import { ArrowRight } from 'lucide-react'
import './ComparisonView.css'

function ComparisonView({ originalPrompt, optimizedPrompt }) {
  return (
    <div className="comparison-container fade-in">
      <h3 className="comparison-title">
        Comparación: Antes y Después
      </h3>

      <div className="comparison-grid">
        <div className="comparison-card original">
          <div className="card-header">
            <h4>Prompt Original</h4>
            <span className="card-badge">Antes</span>
          </div>
          <div className="card-content">
            <pre>{originalPrompt}</pre>
          </div>
          <div className="card-stats">
            <span>Caracteres: {originalPrompt.length}</span>
            <span>Palabras: {originalPrompt.split(/\s+/).filter(Boolean).length}</span>
          </div>
        </div>

        <div className="comparison-arrow">
          <ArrowRight size={32} />
        </div>

        <div className="comparison-card optimized">
          <div className="card-header">
            <h4>Prompt Optimizado</h4>
            <span className="card-badge success">Después</span>
          </div>
          <div className="card-content">
            <pre>{optimizedPrompt}</pre>
          </div>
          <div className="card-stats">
            <span>Caracteres: {optimizedPrompt.length}</span>
            <span>Palabras: {optimizedPrompt.split(/\s+/).filter(Boolean).length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonView

