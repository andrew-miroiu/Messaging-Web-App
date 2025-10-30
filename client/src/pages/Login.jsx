import { useEffect, useState } from 'react'
import { supabase } from "../supabaseClient";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) onLogin(session)
      setLoading(false)
    })

    // Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onLogin(session)
    })

    return () => subscription.unsubscribe()
  }, [onLogin])

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}`},
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error.message)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className='login'>
      <h1>Welcome</h1>
      <p>Sign in to continue</p>
      <button onClick={handleGoogleSignIn}>Continue with Google</button>
    </div>
  )
}
