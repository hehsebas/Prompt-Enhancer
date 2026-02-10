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

      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error(selectError)
        return
      }

      if (!existingUser) {
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
          console.error(insertError)
          console.error(insertError.message)
        } else {
          console.log(insertedUser)
        }
      } else {
        console.log(existingUser)
      }
    } catch (error) {
      console.error(error)
    }
  }

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
    
    const loadUser = async () => {
      if (!isMounted) return
      
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {        
          window.history.replaceState({}, document.title, window.location.pathname)
          
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error(error)
          } else if (session && isMounted) {
            syncOAuthUserToDatabase(session).catch(err => 
              console.error(err)
            )
            
            const supabaseUser = createUserFromSession(session)
            
            setUser(supabaseUser)
            
            localStorage.setItem('user', JSON.stringify(supabaseUser))
            localStorage.setItem('supabase_session', JSON.stringify(session))
            
            setLoading(false)
            return
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && isMounted) {
          const supabaseUser = createUserFromSession(session)
          setUser(supabaseUser)
          localStorage.setItem('user', JSON.stringify(supabaseUser))
          localStorage.setItem('supabase_session', JSON.stringify(session))
        } else if (isAuthenticated() && isMounted) {
          const currentUser = getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        if (isMounted) {
          console.error(error)
        }
      }
      
      if (isMounted) {
        setLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('supabase_session')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const supabaseUser = createUserFromSession(session)
        setUser(supabaseUser)
        localStorage.setItem('user', JSON.stringify(supabaseUser))
      }
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
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error(error)
      }
      
      localStorage.removeItem('user')
      localStorage.removeItem('supabase_session')
      localStorage.removeItem('token')
      
      logOutService()
      
      setUser(null)
      
    } catch (error) {
      console.error(error)
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
