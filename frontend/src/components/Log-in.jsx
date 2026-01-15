import './Log-in.css'
import Sidebar from './Sidebar'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { logIn } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function LogIn() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!formData.email || !formData.password) {
            setError('Por favor completa todos los campos')
            return
        }

        setIsLoading(true)

        try {
            const result = await logIn({
                email: formData.email,
                password: formData.password
            })

            if (result.user) {
                login(result.user)
            }

            navigate('/')
        } catch (err) {
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true)
            setError('')
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account', // Fuerza selección de cuenta cada vez
                    },
                },
            })

            if (error) {
                throw error
            }

            // La redirección a Google se maneja automáticamente
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión con Google')
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <Sidebar isOpen={false} onClose={() => {}} />
            <div className="login-card">
                <Link to="/" className="back-button">
                    <ArrowLeft size={20} />
                    <span>Volver</span>
                </Link>
                
                <div className="login-header">
                    <h1>Iniciar sesión</h1>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">
                            
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            name="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                        </label>
                        <input 
                            type="password" 
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            maxLength={72}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Recordarme</span>
                        </label>
                        <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="divider">
                    <span>o continuar con</span>
                </div>

                <button 
                    type="button" 
                    className="google-button" 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.8789 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4"/>
                        <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9465L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853"/>
                        <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05"/>
                        <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33718L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335"/>
                    </svg>
                    <span>Continuar con Google</span>
                </button>

                <div className="login-footer">
                    <p>¿No tienes cuenta? <Link to="/signup" className="signup-link">Regístrate</Link></p>
                </div>
            </div>
        </div>
    )
}

export default LogIn