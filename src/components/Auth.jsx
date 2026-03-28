import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Activity, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2>Real Database Missing Keys</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
            I have fully built the Native Supabase Authentication system! However, I cannot connect to your database yet.
          </p>
          <div style={{ textAlign: 'left', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
            <strong>Next Steps:</strong>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Go to <strong>supabase.com</strong> and create a free project.</li>
              <li>Get your Project URL and Anon API Key.</li>
              <li>Open the file <code>.env.local</code> in this project folder.</li>
              <li>Paste the keys into the placeholder strings.</li>
              <li>Vite will instantly refresh this page and unlock the real login screen!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Success! You may now log in (or check your email for a confirmation link depending on your Supabase settings).');
        setIsLogin(true); // switch back to login mode automatically
      }
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '3.5rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            backgroundColor: 'var(--primary-light)', 
            padding: '1rem', 
            borderRadius: '20px', 
            marginBottom: '1rem',
            boxShadow: '0 10px 20px var(--primary-glow)'
          }}>
            <Activity size={40} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
            LearnAssist
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
            {isLogin ? "Welcome back to your accessible dashboard" : "Create your personalized student profile"}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {message && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              borderRadius: '12px', 
              fontSize: '0.9rem',
              fontWeight: 600,
              border: '1px solid var(--primary-glow)',
              textAlign: 'left'
            }}>
              {message}
            </div>
          )}
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Mail size={16}/> Email Address
            </label>
            <input 
              type="email" 
              className="textarea" 
              style={{ minHeight: 'unset', height: '56px', padding: '0 1.25rem', borderRadius: '14px' }}
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
              <Lock size={16}/> Password
            </label>
            <input 
              type="password" 
              className="textarea" 
              style={{ minHeight: 'unset', height: '56px', padding: '0 1.25rem', borderRadius: '14px' }}
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '56px', marginTop: '1rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }} 
            className="btn btn-secondary"
            style={{ 
              border: 'none', 
              backgroundColor: 'transparent', 
              padding: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
