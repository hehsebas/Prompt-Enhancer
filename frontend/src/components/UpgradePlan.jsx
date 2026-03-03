import '../index.css'
import '../App.css'
import './UpgradePlan.css'
import { Check, Sparkles, Zap, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function UpgradePlan() {
  const navigate = useNavigate()
  return (
    <div className="upgrade-container">
      <div className="absolute-left-top">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} className="mr-sm" />
          <span>Back</span>
        </button>
      </div>
      <div className="upgrade-header">
        <h1 className="h3">Upgrade your plan</h1>
        <p className="text-small text-secondary">Elige el plan perfecto para tus necesidades</p>
      </div>

      <div className="d-grid grid-cols-2 gap-lg">
        {/* Plan Free */}
        <div className="pricing-card">
          <div className="pricing-header">
            <h2 className="h3">Free</h2>
            <div className="pricing-price">
              <span className="currency">$</span>
              <span className="amount">0</span>
              <span className="period">/ mes</span>
            </div>
            <p className="pricing-description">Perfecto para comenzar</p>
          </div>

          <button className="btn btn-secondary w-full mb-lg">
            Tu plan actual
          </button>

          <div className="pricing-features">
            <div className="feature-item">
              <Check size={20} className="feature-icon" />
              <span>3 prompts por día</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon" />
              <span>Modelo GPT-4o mini</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon" />
              <span>Historial de 1 día</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon" />
              <span>Sin soporte</span>
            </div>
          </div>
        </div>

        {/* Plan Pro */}
        <div className="pricing-card pricing-card-featured">
          <div className="popular-badge">
            <span>POPULAR</span>
          </div>

          <div className="pricing-header">
            <h2 className="h3">Pro</h2>
            <div className="pricing-price">
              <span className="currency">$</span>
              <span className="amount">5.99</span>
              <span className="period">/ mes</span>
            </div>
            <p className="pricing-description">Desbloquea todo el potencial</p>
          </div>

          <button className="btn btn-primary w-full mb-lg">
            <Zap size={18} />
            <span>Upgrade to Pro</span>
          </button>

          <div className="pricing-features">
            <div className="feature-item">
              <Check size={20} className="feature-icon feature-icon-pro" />
              <span className="text-bold">Prompts ilimitados</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon feature-icon-pro" />
              <span className="text-bold">Acceso al modelo GPT-4o</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon feature-icon-pro" />
              <span className="text-bold">Historial ilimitado</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon feature-icon-pro" />
              <span className="text-bold">Soporte</span>
            </div>
            <div className="feature-item">
              <Check size={20} className="feature-icon feature-icon-pro" />
              <span className="text-bold">Exportar conversaciones</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradePlan