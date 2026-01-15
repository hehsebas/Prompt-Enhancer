import { useState } from 'react'
import './App.css'
import PromptInput from './components/PromptInput'
import PromptOutput from './components/PromptOutput'
import ComparisonView from './components/ComparisonView'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { optimizePrompt } from './services/api'
import Sidebar from './components/Sidebar'
import { Menu } from 'lucide-react'

function App() {
  const [inputPrompt, setInputPrompt] = useState('')
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [explanation, setExplanation] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleOptimize = async () => {
    if (!inputPrompt.trim()) {
      setError('Por favor, ingresa un prompt para optimizar')
      return
    }

    if (inputPrompt.trim().length < 10) {
      setError('El prompt debe tener al menos 10 caracteres')
      return
    }

    if (!selectedModel) {
      setError('Por favor, selecciona un modelo de IA')
      return
    }

    setIsLoading(true)
    setError(null)
    setOptimizedPrompt('')
    setExplanation(null)
    setMetadata(null)

    try {
      const response = await optimizePrompt({
        text: inputPrompt,
        model: selectedModel,
        include_explanation: true
      })

      if (response.success) {
        setOptimizedPrompt(response.optimized_prompt)
        setExplanation(response.explanation)
        setMetadata(response.metadata)
        setShowComparison(false)
      } else {
        setError('Error al optimizar el prompt. Por favor, intenta nuevamente.')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(
        err.response?.data?.detail || 
        'Error de conexión. Verifica que el servidor esté ejecutándose.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setInputPrompt('')
    setOptimizedPrompt('')
    setExplanation(null)
    setMetadata(null)
    setError(null)
    setShowComparison(false)
  }

  const handleCopyOptimized = () => {
    navigator.clipboard.writeText(optimizedPrompt)
  }

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      
      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      <main className="main-content">
          <div className="title-h1 container center-content">
            <h1>Transforma tu prompt básico en un prompt avanzado</h1>
          </div>
        <div className="container">
          <PromptInput
            value={inputPrompt}
            onChange={setInputPrompt}
            onOptimize={handleOptimize}
            onClear={handleClear}
            isLoading={isLoading}
            disabled={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            />
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          {isLoading && <LoadingSpinner />}

          {optimizedPrompt && !isLoading && (
            <>
              <PromptOutput
                optimizedPrompt={optimizedPrompt}
                explanation={explanation}
                metadata={metadata}
                onCopy={handleCopyOptimized}
                onShowComparison={() => setShowComparison(!showComparison)}
                showingComparison={showComparison}
              />

              {showComparison && (
                <ComparisonView
                  originalPrompt={inputPrompt}
                  optimizedPrompt={optimizedPrompt}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Testing...</p>
      </footer>
    </div>
  )
}

export default App

