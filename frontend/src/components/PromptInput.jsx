import { ArrowRight, Loader2, ChevronDown, Check } from 'lucide-react'
import './PromptInput.css'
import '../App.css'
import './LoadingSpinner.css'
import { useState, useRef, useEffect } from 'react'

function PromptInput({ value, onChange, onOptimize, isLoading, disabled, selectedModel, onModelChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const models = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Rápido y económico' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Más potente y preciso' }
  ]

  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onOptimize()
    }
  }

  const handleSelectModel = (modelValue) => {
    onModelChange(modelValue)
    setIsDropdownOpen(false)
  }

  const getSelectedModelLabel = () => {
    const model = models.find(m => m.value === selectedModel)
    return model ? model.label : 'Selecciona un modelo'
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <div className="model-selector-wrapper" ref={dropdownRef}>
          <button
            className={`custom-select ${isDropdownOpen ? 'open' : ''} ${!selectedModel ? 'placeholder' : ''}`}
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            type="button"
          >
            <span className="custom-select-value">{getSelectedModelLabel()}</span>
            <ChevronDown size={18} className={`custom-select-icon ${isDropdownOpen ? 'rotate' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="custom-dropdown">
              {models.map((model) => (
                <div
                  key={model.value}
                  className={`custom-option ${selectedModel === model.value ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model.value)}
                >
                  <div className="custom-option-content">
                    <span className="custom-option-label">{model.label}</span>
                    <span className="custom-option-description">{model.description}</span>
                  </div>
                  {selectedModel === model.value && (
                    <Check size={16} className="custom-option-check" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          className="btn btn-primary"
          onClick={onOptimize}
          disabled={disabled || !value || value.length < 10 || !selectedModel}
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

