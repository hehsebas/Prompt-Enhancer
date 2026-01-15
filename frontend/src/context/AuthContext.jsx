import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, isAuthenticated, logOut as logOutService } from '../services/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Función para sincronizar usuario OAuth con la tabla users
  const syncOAuthUserToDatabase = async (session) => {
    try {
      const username = session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0]

      // Verificar si el usuario ya existe en la tabla users
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle() // Usar maybeSingle en lugar de single para evitar error si no existe

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error al verificar usuario:', selectError)
        return
      }

      if (!existingUser) {
        // Si no existe, insertarlo
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            username: username,
            email: session.user.email,
            plan: 'Free'
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error al insertar usuario en la tabla:', insertError)
          console.error('Detalles:', insertError.message)
        } else {
          console.log('Usuario OAuth sincronizado con la tabla users:', insertedUser)
        }
      } else {
        console.log('Usuario ya existe en la tabla users:', existingUser)
      }
    } catch (error) {
      console.error('Error al sincronizar usuario OAuth:', error)
    }
  }

  // Función auxiliar para crear el objeto de usuario desde la sesión
  const createUserFromSession = (session) => {
    const username = session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0]
    
    return {
      id: session.user.id,
      email: session.user.email,
      username: username,
      name: username,
      avatar: session.user.user_metadata?.avatar_url,
      plan: 'Free',
      provider: 'google'
    }
  }

  useEffect(() => {
    let isMounted = true
    
    // Cargar usuario del localStorage al iniciar
    const loadUser = async () => {
      if (!isMounted) return
      
      console.log('🔄 Cargando usuario...')
      
      try {
        // Verificar si hay tokens en la URL (después del redirect de OAuth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          console.log('✅ Tokens encontrados en URL, estableciendo sesión...')
          
          // Limpiar la URL PRIMERO (antes de setSession)
          window.history.replaceState({}, document.title, window.location.pathname)
          
          // Establecer la sesión con los tokens de la URL
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('❌ Error al establecer sesión:', error)
          } else if (session && isMounted) {
            console.log('✅ Sesión establecida correctamente:', session.user.email)
            
            // Sincronizar usuario con la tabla users (sin await para no bloquear)
            syncOAuthUserToDatabase(session).catch(err => 
              console.error('Error sincronizando usuario:', err)
            )
            
            // Crear objeto de usuario
            const supabaseUser = createUserFromSession(session)
            
            console.log('👤 Usuario OAuth cargado:', supabaseUser)
            setUser(supabaseUser)
            
            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(supabaseUser))
            localStorage.setItem('supabase_session', JSON.stringify(session))
            
            setLoading(false)
            return
          }
        }
        
        // Si no hay tokens en URL, verificar sesión existente
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && isMounted) {
          console.log('✅ Sesión existente encontrada:', session.user.email)
          
          // Crear objeto de usuario
          const supabaseUser = createUserFromSession(session)
          
          console.log('👤 Usuario OAuth cargado:', supabaseUser)
          setUser(supabaseUser)
          
          // Guardar en localStorage
          localStorage.setItem('user', JSON.stringify(supabaseUser))
          localStorage.setItem('supabase_session', JSON.stringify(session))
        } else if (isAuthenticated() && isMounted) {
          // Usuario autenticado con email/password tradicional
          const currentUser = getCurrentUser()
          console.log('👤 Usuario tradicional cargado:', currentUser)
          setUser(currentUser)
        } else if (isMounted) {
          console.log('❌ No hay sesión activa')
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Error en loadUser:', error)
        }
      }
      
      if (isMounted) {
        setLoading(false)
      }
    }

    loadUser()

    // Suscribirse a cambios de autenticación de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('🔔 Evento de autenticación:', event)
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 Usuario cerró sesión')
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('supabase_session')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refrescado')
        const supabaseUser = createUserFromSession(session)
        setUser(supabaseUser)
        localStorage.setItem('user', JSON.stringify(supabaseUser))
      }
      // Ignorar SIGNED_IN aquí porque ya lo manejamos en loadUser
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const login = (userData) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      console.log('🚪 Cerrando sesión...')
      
      // Cerrar sesión en Supabase (esto también revoca el token de Google)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error al cerrar sesión en Supabase:', error)
      }
      
      // Limpiar todo el almacenamiento local
      localStorage.removeItem('user')
      localStorage.removeItem('supabase_session')
      localStorage.removeItem('token')
      
      // Cerrar sesión tradicional
      logOutService()
      
      // Actualizar estado
      setUser(null)
      
      console.log('✅ Sesión cerrada correctamente')
    } catch (error) {
      console.error('Error en logout:', error)
      // Aún así limpiar el estado local
      localStorage.clear()
      setUser(null)
    }
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
