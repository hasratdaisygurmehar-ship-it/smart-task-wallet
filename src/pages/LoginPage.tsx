import { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

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
    onLogin({ 
      id: email, 
      name: name || email.split('@')[0], 
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    });
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="logo-icon" style={{ margin: '0 auto 1rem' }}><ArrowRight size={24} color="white" /></div>
          <h1>{isLogin ? 'Welcome Back' : 'Join Smart Wallet'}</h1>
          <p className="text-secondary">{isLogin ? 'Welcome back! Please login to your account.' : 'Create your account to start managing tasks.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label><User size={18} /> Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          
          <div className="input-group">
            <label><Mail size={18} /> Email Address</label>
            <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label><Lock size={18} /> Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="glass-btn auth-submit">
            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} style={{marginLeft: '8px'}} />
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '2rem' }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"} 
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
