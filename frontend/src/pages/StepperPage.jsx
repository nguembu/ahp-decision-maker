import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemAPI } from '../api/problemAPI';
import { analysisAPI } from '../api/analysisAPI';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend
} from 'recharts';
import ThemeSwitcher from '../components/ThemeSwitcher';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ahpLogo from '../assets/ahp_logo_modern.png';

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = ['Définition', 'Critères', 'Alternatives', 'Notation', 'Matrice', 'Résultats'];
const SAATY_OPTIONS = [
  { value: 9, label: '9 – Extrêmement plus' },
  { value: 8, label: '8' },
  { value: 7, label: '7 – Très fortement plus' },
  { value: 6, label: '6' },
  { value: 5, label: '5 – Fortement plus' },
  { value: 4, label: '4' },
  { value: 3, label: '3 – Modérément plus' },
  { value: 2, label: '2' },
  { value: 1, label: '1 – Également' },
  { value: 1 / 2, label: '1/2' },
  { value: 1 / 3, label: '1/3 – Modérément moins' },
  { value: 1 / 4, label: '1/4' },
  { value: 1 / 5, label: '1/5 – Fortement moins' },
  { value: 1 / 6, label: '1/6' },
  { value: 1 / 7, label: '1/7 – Très fortement moins' },
  { value: 1 / 8, label: '1/8' },
  { value: 1 / 9, label: '1/9 – Extrêmement moins' },
];
const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#34d399'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildEmptyMatrix(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 1))
  );
}

function fmtSaaty(v) {
  if (!v || v === 1) return '1';
  if (v < 1) return `1/${Math.round(1 / v)}`;
  return String(Math.round(v));
}

// ─── StepHeader ──────────────────────────────────────────────────────────────
function StepHeader({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((label, idx) => (
        <React.Fragment key={label}>
          <div className={`step ${idx === current ? 'active' : idx < current ? 'completed' : ''}`}>
            <div className="step-num">{idx < current ? '✓' : idx + 1}</div>
            <span className="step-label">{label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`step-connector ${idx < current ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 1: Definition ───────────────────────────────────────────────────────
function Step1({ problem, onSave }) {
  const [form, setForm] = useState({
    title: problem?.title || '',
    description: problem?.description || '',
    goal: problem?.goal || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (problem) setForm({ title: problem.title || '', description: problem.description || '', goal: problem.goal || '' });
  }, [problem?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Le titre est requis.'); return; }
    setError(''); setLoading(true);
    try {
      const saved = await onSave(form);
      if (!saved) setError('Erreur lors de la sauvegarde.');
    } catch (err) {
      setError(err.response?.data?.title?.[0] || 'Erreur.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="fade-in">
      <h2 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Définition du Problème</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Décrivez votre problème de décision.
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="input-group">
        <label className="input-label">Titre *</label>
        <input id="step1-title" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Sélection d'une voiture" required />
      </div>
      <div className="input-group">
        <label className="input-label">Description</label>
        <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexte du problème..." rows={3} />
      </div>
      <div className="input-group">
        <label className="input-label">Objectif</label>
        <input className="input" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="Ex: Trouver la voiture offrant le meilleur rapport qualité-prix" />
      </div>
      <button id="step1-next" className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? 'Sauvegarde...' : 'Suivant →'}
      </button>
    </form>
  );
}

// ─── Step 2: Criteria ─────────────────────────────────────────────────────────
function Step2({ problemId, onNext, onBack }) {
  const [criteria, setCriteria] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', criterion_type: 'quantitative' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchCriteria(); }, [problemId]);

  const fetchCriteria = async () => {
    setLoading(true);
    try {
      const { data } = await problemAPI.getCriteria(problemId);
      setCriteria(data.results || data);
    } catch (err) {
      console.error('Error fetching criteria:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est requis.'); return; }
    if (criteria.length >= 15) { setError('Maximum 15 critères.'); return; }
    setError(''); setSaving(true);
    try {
      const { data } = await problemAPI.createCriterion(problemId, { ...form, order: criteria.length });
      setCriteria([...criteria, data]);
      setForm({ name: '', description: '', criterion_type: 'quantitative' });
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.non_field_errors?.[0] || 'Erreur.');
    } finally { setSaving(false); }
  };

  const removeCriterion = async (id) => {
    try { await problemAPI.deleteCriterion(problemId, id); setCriteria(criteria.filter(c => c.id !== id)); }
    catch { alert('Erreur lors de la suppression.'); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Critères d'Évaluation</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Ajoutez les critères qui guideront votre décision (min. 2, max. 15).
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={addCriterion} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
          <label className="input-label">Nom</label>
          <input id="criterion-name" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Prix" />
        </div>
        <div className="input-group" style={{ width: '160px', marginBottom: 0 }}>
          <label className="input-label">Type</label>
          <select className="input" value={form.criterion_type} onChange={e => setForm({ ...form, criterion_type: e.target.value })}>
            <option value="quantitative">Quantitatif</option>
            <option value="categorical">Catégorique</option>
          </select>
        </div>
        <button id="add-criterion-btn" className="btn btn-secondary" type="submit" disabled={saving} style={{ height: '40px' }}>
          {saving ? '...' : '＋ Ajouter'}
        </button>
      </form>

      {loading ? <div className="spinner" /> : (
        <div style={{ marginBottom: '1.5rem' }}>
          {criteria.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Aucun critère ajouté encore.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {criteria.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700, minWidth: '1.5rem' }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {c.criterion_type === 'quantitative' ? '📊' : '🏷️'} {c.criterion_type}
                    </span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => removeCriterion(c.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button id="step2-next" className="btn btn-primary" disabled={criteria.length < 2} onClick={() => onNext(criteria)}>
          Suivant → {criteria.length < 2 && <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(min. 2)</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Alternatives ─────────────────────────────────────────────────────
function Step3({ problemId, onNext, onBack }) {
  const [alts, setAlts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAlts(); }, [problemId]);

  const fetchAlts = async () => {
    try {
      const { data } = await problemAPI.getAlternatives(problemId);
      setAlts(data.results || data);
    } catch (err) {
      console.error('Error fetching alternatives:', err);
    }
  };

  const addAlt = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est requis.'); return; }
    if (alts.length >= 20) { setError('Maximum 20 alternatives.'); return; }
    setError(''); setSaving(true);
    try {
      const { data } = await problemAPI.createAlternative(problemId, { ...form, order: alts.length });
      setAlts([...alts, data]);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Erreur.');
    } finally { setSaving(false); }
  };

  const removeAlt = async (id) => {
    try { await problemAPI.deleteAlternative(problemId, id); setAlts(alts.filter(a => a.id !== id)); }
    catch { alert('Erreur.'); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Alternatives</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Ajoutez les options à comparer (min. 2, max. 20).
      </p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={addAlt} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="input-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
          <label className="input-label">Nom</label>
          <input id="alt-name" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Toyota Corolla" />
        </div>
        <div className="input-group" style={{ flex: 2, minWidth: '160px', marginBottom: 0 }}>
          <label className="input-label">Description (optionnel)</label>
          <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="..." />
        </div>
        <button id="add-alt-btn" className="btn btn-secondary" type="submit" disabled={saving} style={{ height: '40px' }}>
          {saving ? '...' : '＋ Ajouter'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {alts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Aucune alternative ajoutée.</div>
        ) : alts.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700, minWidth: '1.5rem' }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              {a.description && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{a.description}</span>}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => removeAlt(a.id)}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button id="step3-next" className="btn btn-primary" disabled={alts.length < 2} onClick={() => onNext(alts)}>
          Suivant →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Scores ───────────────────────────────────────────────────────────
function Step4({ problemId, criteria, alternatives, onNext, onBack }) {
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = {};
    alternatives.forEach(a => {
      init[a.id] = {};
      criteria.forEach(c => { init[a.id][c.id] = ''; });
    });
    (async () => {
      for (const alt of alternatives) {
        try {
          const { data } = await problemAPI.getScores(problemId, alt.id);
          const results = data.results || data;
          results.forEach(s => {
            if (!init[alt.id]) init[alt.id] = {};
            init[alt.id][s.criterion] = s.numeric_score !== null ? s.numeric_score : '';
          });
        } catch (err) {
          console.error(`Error fetching scores:`, err);
        }
      }
      setScores({ ...init });
    })();
  }, [problemId, alternatives.length, criteria.length]);

  const handleChange = (altId, critId, val) => {
    setScores(prev => ({ ...prev, [altId]: { ...prev[altId], [critId]: val } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const alt of alternatives) {
        for (const crit of criteria) {
          const val = scores[alt.id]?.[crit.id];
          if (val !== '' && val !== undefined && val !== null) {
            await problemAPI.saveScore(problemId, alt.id, {
              criterion: crit.id,
              numeric_score: parseFloat(val),
            });
          }
        }
      }
      onNext();
    } catch (err) {
      alert('Erreur lors de la sauvegarde des scores.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Notation des Alternatives</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Entrez la performance de chaque alternative pour chaque critère.
      </p>
      <div className="table-wrapper" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>Alternative / Critère</th>
              {criteria.map(c => <th key={c.id}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {alternatives.map((alt, ai) => (
              <tr key={alt.id}>
                <td style={{ fontWeight: 600, color: COLORS[ai % COLORS.length] }}>{alt.name}</td>
                {criteria.map(c => (
                  <td key={c.id}>
                    <input
                      id={`score-${alt.id}-${c.id}`}
                      type="number"
                      className="input"
                      style={{ padding: '0.35rem 0.5rem', textAlign: 'center', maxWidth: '100px' }}
                      placeholder="0"
                      value={scores[alt.id]?.[c.id] ?? ''}
                      onChange={e => handleChange(alt.id, c.id, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
        💡 Les scores seront normalisés automatiquement (min-max) lors du calcul final.
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button id="step4-next" className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Sauvegarde...' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Matrix ───────────────────────────────────────────────────────────
function Step5({ problemId, criteria, onNext, onBack }) {
  const n = criteria.length;
  const [matrix, setMatrix] = useState(() => buildEmptyMatrix(n));
  const [consistency, setConsistency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await analysisAPI.getMatrix(problemId);
        if (data.matrix_data && data.matrix_data.length === n) {
          setMatrix(data.matrix_data);
          setConsistency({ consistency_ratio: data.consistency_ratio, is_consistent: data.is_consistent, weights: data.weights });
        }
      } catch {}
    })();
  }, [problemId, n]);

  const setCell = (i, j, val) => {
    const v = parseFloat(val) || 1;
    setMatrix(prev => {
      const m = prev.map(r => [...r]);
      m[i][j] = v;
      m[j][i] = v !== 0 ? 1 / v : 1;
      return m;
    });
    setConsistency(null);
  };

  const handleValidate = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await analysisAPI.validateMatrix(problemId, matrix);
      setConsistency(data.consistency);
    } catch {
      setError('Erreur de validation.');
    } finally { setLoading(false); }
  };

  const handleSaveAndNext = async () => {
    setError(''); setLoading(true);
    try {
      await analysisAPI.saveMatrix(problemId, matrix);
      onNext();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Matrice de Comparaison</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Comparez les critères par paires selon l'échelle de Saaty (1/9 à 9).
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-wrapper" style={{ marginBottom: '1rem' }}>
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: '100px' }}></th>
              {criteria.map(c => <th key={c.id} style={{ minWidth: '110px', textAlign: 'center' }}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {criteria.map((ri, i) => (
              <tr key={ri.id}>
                <td style={{ fontWeight: 600 }}>{ri.name}</td>
                {criteria.map((ci, j) => (
                  <td key={ci.id} style={{ textAlign: 'center' }}>
                    {i === j ? (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>1</span>
                    ) : j > i ? (
                      <select
                        className="input"
                        style={{ padding: '0.3rem', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}
                        value={matrix[i][j]}
                        onChange={e => setCell(i, j, e.target.value)}
                      >
                        {SAATY_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {fmtSaaty(matrix[i][j])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {consistency && (
        <div className={`alert ${consistency.is_consistent ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: '1rem' }}>
          {consistency.is_consistent
            ? `✅ Matrice cohérente — CR = ${consistency.consistency_ratio?.toFixed(3)}`
            : `⚠️ Matrice incohérente — CR = ${consistency.consistency_ratio?.toFixed(3)} > 0.1. Révisez vos comparaisons.`}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button id="validate-matrix-btn" className="btn btn-secondary" onClick={handleValidate} disabled={loading}>
          🔍 Vérifier cohérence
        </button>
        <button id="step5-next" className="btn btn-primary" onClick={handleSaveAndNext} disabled={loading}>
          {loading ? 'Analyse...' : 'Calculer →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 6: Results ──────────────────────────────────────────────────────────
function Step6({ problemId, problemTitle, criteria, alternatives, onBack, onRestart }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { runAnalysis(); }, []);

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      await analysisAPI.analyze(problemId);
      const { data } = await analysisAPI.getResults(problemId);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Erreur lors de l\'analyse.');
    } finally { setLoading(false); }
  };

  const altMap = {};
  alternatives.forEach(a => { altMap[a.id] = a.name; });
  const critMap = {};
  criteria.forEach(c => { critMap[c.id] = c.name; });

  const weightData = result ? Object.entries(result.criteria_weights).map(([cid, w]) => ({
    name: critMap[cid] || cid,
    weight: parseFloat((w * 100).toFixed(1)),
  })) : [];

  const handleDownloadReport = async () => {
    const input = document.getElementById('pdf-report');
    if (!input) return;
    setExporting(true);
    console.log('Starting PDF generation...');
    try {
      // Ensure all images/charts are loaded
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(input, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff', // Force white background for PDF
        logging: true, // Enable logging for debugging
        onclone: (clonedDoc) => {
          const report = clonedDoc.getElementById('pdf-report');
          if (report) {
            report.style.padding = '30px';
            report.style.width = '1100px'; 
            report.style.background = '#ffffff';
            report.style.color = '#000000';
            // Ensure visibility
            report.style.position = 'relative';
            report.style.display = 'block';
            
            // Fix text colors for PDF if in dark mode
            const texts = report.querySelectorAll('*');
            texts.forEach(el => {
              if (el.style.color === 'var(--color-text-muted)') el.style.color = '#666666';
              else if (el.classList.contains('gradient-text')) {
                el.style.backgroundImage = 'none';
                el.style.color = '#6366f1';
              }
            });
          }
        }
      });
      
      console.log('Canvas created successfully');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Handle multi-page if needed, but for now single page or clipped
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      
      pdf.save(`Rapport_AHP_${problemTitle?.replace(/\s+/g, '_') || problemId}.pdf`);
      console.log('PDF saved');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert(`Erreur lors de la génération du PDF: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner" style={{ width: '3rem', height: '3rem' }} />
      <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Analyse en cours...</p>
    </div>
  );

  if (error) return (
    <div className="fade-in">
      <div className="alert alert-danger">{error}</div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={runAnalysis}>Réessayer</button>
      </div>
    </div>
  );

  if (!result) return null;

  return (
    <div className="fade-in">
      <div id="pdf-report" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderRadius: '12px', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src={ahpLogo} alt="Logo AHP" style={{ height: '80px', width: 'auto' }} />
        </div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Rapport d'Analyse AHP</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
          Analyse : <span className="gradient-text">{problemTitle}</span>
        </p>

      {/* Consistency badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className={`card glass`} style={{ 
          flex: '1 1 300px', 
          borderLeft: `6px solid ${result.is_consistent ? '#10b981' : '#ef4444'}`,
          padding: '1rem 1.5rem'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>ÉTAT DE LA COHÉRENCE</h3>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: result.is_consistent ? '#10b981' : '#ef4444' }}>
            {result.is_consistent ? '✅ Cohérent' : '⚠️ Incohérent'} 
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
              (CR = {result.consistency_ratio?.toFixed(4)})
            </span>
          </p>
        </div>
        
        <div className="card glass" style={{ flex: '1 1 300px', padding: '1rem 1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>RECOMMANDATION FINALE</h3>
          <p style={{ fontSize: '1.25rem', fontWeight: 800 }} className="gradient-text">
            🏆 {result.best_alternative_name}
          </p>
        </div>
      </div>

      {/* DETAILED MATRICES */}
      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
          iii. Matrice de Comparaison par Paires
        </h3>
        <div className="table-wrapper card glass">
          <table>
            <thead>
              <tr>
                <th>Critères</th>
                {criteria.map(c => <th key={c.id}>{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {criteria.map((cRow, i) => (
                <tr key={cRow.id}>
                  <td style={{ fontWeight: 700 }}>{cRow.name}</td>
                  {criteria.map((cCol, j) => (
                    <td key={cCol.id}>
                      {result.criteria_matrix?.[i]?.[j]?.toFixed(3) || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
          iv. Matrice de Comparaison Normalisée
        </h3>
        <div className="table-wrapper card glass">
          <table>
            <thead>
              <tr>
                <th>Critères</th>
                {criteria.map(c => <th key={c.id}>{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {criteria.map((cRow, i) => (
                <tr key={cRow.id}>
                  <td style={{ fontWeight: 700 }}>{cRow.name}</td>
                  {criteria.map((cCol, j) => (
                    <td key={cCol.id}>
                      {result.criteria_matrix_normalized?.[i]?.[j]?.toFixed(4) || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
          v. Poids des Critères
        </h3>
        <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'center' }}>
          <div className="table-wrapper card glass">
            <table>
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Poids Prioritaire</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td style={{ fontWeight: 700 }}>{((result.criteria_weights[c.id] || 0) * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card glass" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={weightData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                <Radar
                   name="Poids"
                   dataKey="weight"
                   stroke="var(--color-primary)"
                   fill="var(--color-primary)"
                   fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
          vi. Vérification de la Cohérence
        </h3>
        <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          <div className="card glass">
            <h4 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Détails de calcul</h4>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>λ max :</span> <b>{result.consistency_details?.lambda_max?.toFixed(4)}</b>
              </li>
              <li style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Nombre de critères (n) :</span> <b>{criteria.length}</b>
              </li>
              <li style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Indice CI :</span> <b>{result.consistency_details?.consistency_index?.toFixed(4)}</b>
              </li>
              <li style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Ratio CR :</span> <b style={{ color: result.is_consistent ? '#10b981' : '#ef4444' }}>{result.consistency_ratio?.toFixed(4)}</b>
              </li>
            </ul>
          </div>
          <div className="card glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem' }}>
            <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
              Le <b>CR est {result.is_consistent ? '< 0.10' : '> 0.10'}</b>. 
              Ceci indique un processus de décision <b>{result.is_consistent ? 'cohérent' : 'incohérent'}</b>.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary)' }}>
          vii. Synthèse des Résultats (Global)
        </h3>
        <div className="table-wrapper card glass">
          <table>
            <thead>
              <tr>
                <th>Alternatives</th>
                {criteria.map(c => <th key={c.id} style={{ fontSize: '0.8rem' }}>{c.name}<br/>({((result.criteria_weights[c.id] || 0) * 100).toFixed(0)}%)</th>)}
                <th style={{ background: 'var(--color-primary)', color: 'white' }}>Score (%)</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map(alt => (
                <tr key={alt.id} style={alt.id === result.best_alternative_id ? { background: 'rgba(245, 158, 11, 0.15)' } : {}}>
                  <td style={{ fontWeight: 700 }}>{alt.name}</td>
                  {criteria.map(crit => (
                    <td key={crit.id} style={{ fontSize: '0.85rem' }}>
                      {result.alternative_scores_raw?.[alt.id]?.[crit.id]?.toFixed(3) || '0.000'}
                    </td>
                  ))}
                  <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    {(result.alternative_scores[alt.id] * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </div> {/* END OF PDF-REPORT */}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2.5rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Retour</button>
        <button className="btn btn-primary" onClick={handleDownloadReport} disabled={exporting}>
          {exporting ? '📦 Préparation du PDF...' : '📥 Télécharger le Rapport Complet'}
        </button>
        <button className="btn btn-secondary" onClick={onRestart} style={{ marginLeft: 'auto' }}>🏠 Dashboard</button>
      </div>
    </div>
  );
}

// ─── Main StepperPage ─────────────────────────────────────────────────────────
export default function StepperPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  useEffect(() => {
    if (id) {
      problemAPI.getById(id).then(({ data }) => setProblem(data)).catch(() => navigate('/'));
    }
  }, [id]);

  const handleDefinitionSave = async (formData) => {
    try {
      let saved;
      if (problem?.id) {
        const { data } = await problemAPI.update(problem.id, formData);
        saved = data;
      } else {
        const { data } = await problemAPI.create(formData);
        saved = data;
        navigate(`/problems/${data.id}`, { replace: true });
      }
      setProblem(saved);
      setStep(1);
      return saved;
    } catch { return null; }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ paddingTop: '0.85rem', paddingBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={ahpLogo} 
              alt="AHP Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))' 
              }} 
            />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>←</button>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {problem?.title || 'Nouveau Problème'}
            <ThemeSwitcher />
          </span>
          <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>Étape {step + 1} / {STEPS.length}</span>
        </div>
      </header>

      <main className="container perspective-container" style={{ padding: '2rem 1.5rem', maxWidth: '860px', margin: '0 auto' }}>
        <StepHeader current={step} />

        <div className="card card-3d glass" style={{ padding: '2rem' }}>
          {step === 0 && (
            <Step1
              problem={problem}
              onSave={handleDefinitionSave}
            />
          )}
          {step === 1 && (
            <Step2
              problemId={problem?.id}
              onNext={(c) => { setCriteria(c); setStep(2); }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <Step3
              problemId={problem?.id}
              onNext={(a) => { setAlternatives(a); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step4
              problemId={problem?.id}
              criteria={criteria}
              alternatives={alternatives}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step5
              problemId={problem?.id}
              criteria={criteria}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <Step6
              problemId={problem?.id}
              problemTitle={problem?.title}
              criteria={criteria}
              alternatives={alternatives}
              onBack={() => setStep(4)}
              onRestart={() => navigate('/dashboard')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
