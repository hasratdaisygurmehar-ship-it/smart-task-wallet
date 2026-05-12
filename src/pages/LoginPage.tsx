import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import type { AuthFormData } from '../types';

interface LoginPageProps {
  onLogin: (formData: AuthFormData) => Promise<void>;
  isCloudAuthEnabled: boolean;
}

export default function LoginPage({ onLogin, isCloudAuthEnabled }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onLogin({
        email,
        password,
        name: isLogin ? undefined : name,
        isLogin,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-secondary">
            {isLogin
              ? 'Welcome back! Please login to your account.'
              : 'Create a new account to get started.'}
          </p>
          <p className="text-secondary" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
            {isCloudAuthEnabled
              ? 'Your history syncs privately to your account.'
              : 'Cloud auth is not configured yet, so data stays only on this device.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>👤 Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
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
            {isSubmitting ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')} <ArrowRight size={18} style={{marginLeft: '8px'}} />
          </button>

          {errorMessage && (
            <p className="text-danger text-sm" style={{ marginTop: '1rem' }}>
              {errorMessage}
            </p>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-secondary text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMessage('');
                  setName('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
