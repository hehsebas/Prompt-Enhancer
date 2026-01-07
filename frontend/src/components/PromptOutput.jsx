import { Copy, Check, GitCompare, ChevronDown, ChevronUp, Clock, DollarSign } from 'lucide-react'
import { useState } from 'react'
import './PromptOutput.css'

function PromptOutput({ 
  optimizedPrompt, 
  explanation, 
  metadata, 
  onCopy, 
  onShowComparison,
  showingComparison 
}) {
  const [copied, setCopied] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="prompt-output-container fade-in">
      <div className="output-header">
        <h3>Prompt Optimizado</h3>
        <div className="output-actions">
          <button
            className="btn-icon"
            onClick={onShowComparison}
            title="Ver comparación"
          >
            <GitCompare size={18} />
            {showingComparison ? 'Ocultar' : 'Comparar'}
          </button>
          <button
            className="btn-icon btn-copy"
            onClick={handleCopy}
            title="Copiar al portapapeles"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="optimized-prompt">
        <pre>{optimizedPrompt}</pre>
      </div>
      {/*
      {metadata && (
        <div className="metadata">
          <div className="metadata-item">
            <Clock size={16} />
            <span>Tiempo: {metadata.elapsed_time_seconds}s</span>
          </div>
          <div className="metadata-item">
            <DollarSign size={16} />
            <span>Costo: ${metadata.approximate_cost_usd}</span>
          </div>
          <div className="metadata-item">
            <span className="badge">{metadata.model}</span>
          </div>
        </div>
      )}
      */}
      {/*}
      {explanation && (
        <div className="explanation-section">
          <button
            className="explanation-toggle"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <span>📚 ¿Qué cambios se hicieron y por qué?</span>
            {showExplanation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showExplanation && (
            <div className="explanation-content">
              <div className="explanation-card">
                <h4>🎯 Resumen de Cambios</h4>
                <p>{explanation.changes_summary}</p>
              </div>

              {explanation.expanded_prompt && (
                <div className="explanation-card">
                  <h4>📝 Prompt Expandido</h4>
                  <p className="explanation-text">{explanation.expanded_prompt}</p>
                </div>
              )}

              {explanation.decomposition_and_reasoning && (
                <div className="explanation-card">
                  <h4>🧩 Descomposición y Razonamiento</h4>
                  <p className="explanation-text">{explanation.decomposition_and_reasoning}</p>
                </div>
              )}

              {explanation.suggested_enhancements && (
                <div className="explanation-card">
                  <h4>💡 Mejoras Sugeridas</h4>
                  <p className="explanation-text">{explanation.suggested_enhancements}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
        */}
    </div>
  )
}

export default PromptOutput

