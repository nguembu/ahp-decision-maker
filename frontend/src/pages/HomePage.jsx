import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemAPI } from '../api/problemAPI';
import { useAuthStore, useProblemStore } from '../stores/index';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ahpLogo from '../assets/ahp_logo_modern.png';

const STATUS_BADGE = {
  draft: { cls: 'badge-draft', label: 'Brouillon' },
  in_progress: { cls: 'badge-progress', label: 'En cours' },
  completed: { cls: 'badge-completed', label: 'Complété' },
};

export default function HomePage() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { problems, setProblems, loading, setLoading, setError, removeProblem } = useProblemStore();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const { data } = await problemAPI.getAll();
      setProblems(data.results || data);
    } catch (e) {
      setError('Impossible de charger les problèmes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce problème ?')) return;
    setDeleting(id);
    try {
      await problemAPI.delete(id);
      removeProblem(id);
    } catch {
      alert('Erreur lors de la suppression.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await problemAPI.duplicate(id);
      setProblems([data, ...problems]);
    } catch {
      alert('Erreur lors de la duplication.');
    }
  };

  const filtered = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="container" style={{ paddingTop: '0.85rem', paddingBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={ahpLogo} 
              alt="AHP Logo" 
              style={{ 
                height: '45px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.2))' 
              }} 
            />
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              <span className="gradient-text">AHP</span> Decision Maker
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeSwitcher />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>
              Accueil
            </button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              👤 {username}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/'); }}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="container page">
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Mes Problèmes de Décision</h1>
            <p className="page-subtitle">Gérez et analysez vos décisions multi-critères</p>
          </div>
          <button
            id="new-problem-btn"
            className="btn btn-primary"
            onClick={() => navigate('/problems/new')}
          >
            ＋ Nouveau Problème
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            className="input"
            style={{ maxWidth: '360px' }}
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <span className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧩</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {search ? 'Aucun résultat' : 'Aucun problème pour l\'instant'}
            </p>
            {!search && (
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Créez votre premier problème de décision AHP
              </p>
            )}
            {!search && (
              <button className="btn btn-primary" onClick={() => navigate('/problems/new')}>
                Commencer
              </button>
            )}
          </div>
        ) : (
          <div className="cards-grid fade-in perspective-container">
            {filtered.map((problem) => {
              const badge = STATUS_BADGE[problem.status] || STATUS_BADGE.draft;
              return (
                <div
                  key={problem.id}
                  className="card card-3d"
                  style={{ cursor: 'pointer', position: 'relative' }}
                  onClick={() => navigate(`/problems/${problem.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Dupliquer"
                        onClick={(e) => handleDuplicate(problem.id, e)}
                      >⧉</button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Supprimer"
                        disabled={deleting === problem.id}
                        onClick={(e) => handleDelete(problem.id, e)}
                      >✕</button>
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {problem.title}
                  </h3>
                  {problem.description && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {problem.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    {[
                      { icon: '📊', count: problem.criteria_count, label: 'critères' },
                      { icon: '🔀', count: problem.alternatives_count, label: 'alternatives' },
                    ].map(({ icon, count, label }) => (
                      <span key={label} style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {icon} <strong style={{ color: 'var(--color-text)' }}>{count}</strong> {label}
                      </span>
                    ))}
                    <span style={{ marginLeft: 'auto', color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
                      {new Date(problem.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
