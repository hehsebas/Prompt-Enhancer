import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const signUp = async (userData) => {
  try {
    // Registrar en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          plan: userData.plan || 'Free'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Error al registrar usuario')

    // El trigger de la base de datos insertará el usuario en la tabla users automáticamente
    
    const user = {
      id: authData.user.id,
      username: userData.username,
      email: authData.user.email,
      plan: userData.plan || 'Free'
    }

    // Guardar en localStorage
    if (authData.session) {
      localStorage.setItem('token', authData.session.access_token)
      localStorage.setItem('user', JSON.stringify(user))
    }

    return {
      user,
      session: authData.session,
      token: authData.session?.access_token
    }
  } catch (error) {
    throw error.message || 'Error al registrar usuario'
  }
}

export const logIn = async (credentials) => {
  try {
    // Iniciar sesión en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (authError) throw authError
    if (!authData.user || !authData.session) throw new Error('Credenciales inválidas')

    // Obtener datos del usuario de la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    let username, plan
    if (userData && !userError) {
      username = userData.username
      plan = userData.plan
    } else {
      username = authData.user.user_metadata?.username || credentials.email.split('@')[0]
      plan = authData.user.user_metadata?.plan || 'Free'
    }

    const user = {
      id: authData.user.id,
      username,
      email: authData.user.email,
      plan
    }

    // Guardar en localStorage
    localStorage.setItem('token', authData.session.access_token)
    localStorage.setItem('user', JSON.stringify(user))

    return {
      user,
      session: authData.session,
      token: authData.session.access_token
    }
  } catch (error) {
    throw error.message || 'Error al iniciar sesión'
  }
}


export const logOut = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}


export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const getToken = () => {
  return localStorage.getItem('token')
}
