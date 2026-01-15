import { ArrowRight, Loader2, ChevronDown, Check } from 'lucide-react'
import './PromptInput.css'
import '../App.css'
import './LoadingSpinner.css'
import { useState, useRef, useEffect } from 'react'

function PromptInput({ value, onChange, onOptimize, isLoading, disabled, selectedModel, onModelChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onOptimize()
    }
  }

  const characterCount = value.length
  const maxCharacters = 2000
  const isNearLimit = characterCount > maxCharacters * 0.8

  return (
    <div className="prompt-input-container fade-in">
      <textarea
        className="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Escribe aquí tu prompt original..."
        disabled={disabled}
        maxLength={maxCharacters}
        rows={8}
      />
      <div className="input-header">
        <span className={`character-count ${isNearLimit ? 'warning' : ''}`}>
          {characterCount} / {maxCharacters}
        </span>
      </div>
      
      <div className="prompt-actions-container">
        <button
          className="btn btn-primary"
          onClick={onOptimize}
          disabled={disabled || !value || value.length < 10}
          title="Optimizar prompt (Ctrl+Enter)"
        >
          {isLoading ? (
            <Loader2 size={18} className="spinner" style={{ color: 'white' }} />
          ) : (
            <ArrowRight style={{color: 'white'}} size={18} className="arrow-icon"/>
          )}
        </button>
      </div>
      

      <p className="input-hint hidden">
        Presiona <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para optimizar rápidamente
      </p>
    </div>
  )
}

export default PromptInput

