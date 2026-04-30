import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/authAPI';
import { useAuthStore } from '../stores/index';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await authAPI.register(form.username, form.email, form.password);
        setMode('login');
        setError('');
        return;
      }
      const { data } = await authAPI.login(form.username, form.password);
      login(form.username, data.access, data.refresh);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]
        || 'Une erreur est survenue.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.12) 0%, var(--color-bg) 60%)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            padding: '8px'
          }}>
            <span style={{ fontSize: '1.75rem' }}>🎯</span> 
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            AHP Decision Maker
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Prenez de meilleures décisions avec la méthode AHP
          </p>
        </div>

        <div className="card fade-in" style={{ padding: '2rem' }}>
          {/* Tab switch */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--color-surface-2)', padding: '4px', borderRadius: '10px' }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  background: mode === m ? 'var(--color-primary)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--color-text-muted)',
                }}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nom d'utilisateur</label>
              <input
                id="username"
                className="input"
                type="text"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Email *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button className="btn btn-primary w-full" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} /> : null}
              {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
          AHP • Analytical Hierarchy Process
        </p>
      </div>
    </div>
  );
}
