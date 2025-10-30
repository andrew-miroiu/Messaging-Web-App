import { supabase } from "../supabaseClient";

export default function Signup() {
  const signUpWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signUpWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>Sign Up</h1>
      <button onClick={signUpWithGoogle}>Sign up with Google</button>
      <button onClick={signUpWithGithub}>Sign up with GitHub</button>
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
