import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';
import ahpLogo from '../assets/ahp_logo_modern.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {/* Navbar */}
      <nav style={{ 
        borderBottom: '1px solid var(--color-border)', 
        background: 'var(--color-surface)', 
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={ahpLogo} 
              alt="AHP Logo" 
              style={{ 
                height: '50px', 
                width: 'auto',
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.25))' 
              }} 
            />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">AHP</span> Decision Maker
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeSwitcher />
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>Connexion</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>S'inscrire</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero" style={{ 
        padding: '5rem 1.5rem', 
        textAlign: 'center', 
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent)' 
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Maîtrisez vos décisions avec la <span className="gradient-text">Méthode AHP</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Une approche structurée et mathématique pour résoudre des problèmes complexes multi-critères. 
            Prenez des décisions éclairées, cohérentes et transparentes.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/login')}>
              Commencer maintenant
            </button>
            <a href="#about" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              En savoir plus
            </a>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section id="about" style={{ padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div className="feature-grid">
            <div className="card glass card-3d">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Qu'est-ce que l'AHP ?</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                L'<b>Analytical Hierarchy Process (AHP)</b> est une technique structurée de prise de décision multi-critères pour organiser et analyser des décisions complexes basées sur les mathématiques et la psychologie. 
                Développée par Thomas L. Saaty dans les années 1970, c'est l'un des principaux modèles mathématiques utilisés pour soutenir la théorie de la décision.
              </p>
            </div>

            <div className="card glass card-3d">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Où appliquer l'AHP ?</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
                Elle peut être appliquée à tout problème impliquant la prise d'une décision parmi un ensemble d'alternatives :
              </p>
              <ul style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, paddingLeft: '1.25rem' }}>
                <li>Choix d'un téléphone ou d'un ordinateur</li>
                <li>Sélection d'une école ou d'un emploi</li>
                <li>Gestion des catastrophes (incendies, etc.)</li>
                <li>Gestion de bibliothèques</li>
                <li>Tests et Architecture Logicielle</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>Étapes de mise en œuvre</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {[
                { n: 1, text: "Modèle hiérarchique du problème" },
                { n: 2, text: "Échelle de préférence relative" },
                { n: 3, text: "Matrice de comparaison par paires" },
                { n: 4, text: "Normalisation de la matrice" },
                { n: 5, text: "Calcul des poids des critères" },
                { n: 6, text: "Vérification de la cohérence (CR)" },
                { n: 7, text: "Synthèse des résultats" }
              ].map(s => (
                <div key={s.n} className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ 
                    width: '40px', height: '40px', 
                    background: 'var(--color-primary)', 
                    borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 1rem', fontWeight: 800 
                  }}>{s.n}</div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Example Section */}
          <div style={{ marginTop: '5rem', background: 'var(--color-surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Exemple : Quel Laptop acheter ?</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
              Imaginez que vous deviez choisir un ordinateur portable parmi ASUS, DELL et LENOVO. Chaque modèle possède des spécifications différentes (Prix, Stockage, Vitesse Processeur, RAM).
            </p>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Critères</th>
                    <th>Importance Relative (Saaty)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>Importance égale</td></tr>
                  <tr><td>3</td><td>Importance modérée</td></tr>
                  <tr><td>5</td><td>Importance forte</td></tr>
                  <tr><td>7</td><td>Importance très forte</td></tr>
                  <tr><td>9</td><td>Importance extrême</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)' }}>
              Grâce à l'AHP, nous comparons ces critères deux à deux, calculons leur poids relatif, vérifions si nos choix sont cohérents (CR &lt; 0.1), et obtenons un classement final mathématiquement justifié.
            </p>
          </div>

        </div>
      </section>

      <footer style={{ padding: '3rem 1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-dim)' }}>
        <p>© 2026 AHP Decision Maker. Basé sur les travaux de Thomas L. Saaty.</p>
      </footer>
    </div>
  );
}
