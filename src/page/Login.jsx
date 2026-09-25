import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/dashboard",
      },
    });

    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo">
          ✈️
        </div>

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Login to manage your trips and expenses.
        </p>

        {/* GOOGLE LOGIN */}
        <button
          className="google-login-btn"
          onClick={handleGoogleLogin}
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        <div className="login-divider">
          <span>Secure login</span>
        </div>

        <p className="login-footer-text">
          Your trips, expenses and budget
          are waiting for you.
        </p>

        <Link
          to="/"
          className="back-home-link"
        >
          ← Back to Home
        </Link>

      </div>

    </div>
  );
}

export default Login;