import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>404 – Page introuvable</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Cette page n'existe pas.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    </div>
  );
}
