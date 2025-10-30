import { useEffect, useState } from 'react'
import { supabase } from "./supabaseClient";
import Login from './pages/Login'
import Chat from './pages/Chat';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) return <Login onLogin={setSession} />;
  return <Chat session={session} />;
}
