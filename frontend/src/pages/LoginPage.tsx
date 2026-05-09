import { useState } from 'react';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    const mockUser = {
      id: email.split('@')[0] || 'user123',
      name: isLogin ? (email.split('@')[0] || 'User') : name,
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    };
    onLogin(mockUser);
  };

  const handleGoogleLogin = () => {
    // Simulate Google OAuth
    const mockUser = {
      id: 'google_user',
      name: 'Google User',
      email: 'user@google.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google'
    };
    onLogin(mockUser);
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      
      <div className="glass-panel auth-card animate-fade-in-up">
        <div className="auth-header">
          <div className="logo-icon large"><Zap size={32} color="white" /></div>
          <h1>Smart Task Wallet</h1>
          <p className="text-secondary">{isLogin ? 'Welcome back! Please login to your account.' : 'Create your account to start managing tasks.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label><User size={18} /> Name</label>
              <input 
                type="text" 
                placeholder="Enter your name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="input-group">
            <label><Mail size={18} /> Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label><Lock size={18} /> Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {isLogin && (
            <div className="auth-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="glass-btn auth-submit">
            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} style={{marginLeft: '8px'}} />
          </button>
        </form>

        <div className="auth-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button onClick={handleGoogleLogin} className="google-auth-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Sign in with Google
        </button>

        <p className="auth-footer">
          {isLogin ? "Don't have an account?" : "Already have an account?"} 
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
