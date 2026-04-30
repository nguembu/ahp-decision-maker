# 🎯 AHP Decision Maker - Analytical Hierarchy Process Web Application

Une **application web fullstack** pour résoudre des problèmes de décision multi-critères en utilisant la méthode **AHP (Analytical Hierarchy Process)**.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/django-5.0%2B-darkgreen.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/react-18.2%2B-61dafb.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-336791.svg)](https://www.postgresql.org/)

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack Technologique](#-stack-technologique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Documentation](#-documentation)
- [API Reference](#-api-reference)
- [Contribuer](#-contribuer)
- [License](#-license)

---

## ✨ Fonctionnalités

### Core Features
✅ **Création de problèmes de décision** - Définir titre, description et objectif  
✅ **Gestion des critères** - Ajouter critères quantitatifs ou catégoriques  
✅ **Gestion des alternatives** - Lister les options à évaluer  
✅ **Notation des alternatives** - Entrer des scores pour chaque critère  
✅ **Matrice de comparaison par paires** - Interface interactive pour l'échelle de Saaty  
✅ **Vérification de cohérence** - Calcul de CI et CR automatique  
✅ **Analyse complète** - Calcul des poids et ranking final  
✅ **Visualisation** - Graphiques, tableaux et statistiques  

### Advanced Features
✅ **Duplication de problèmes** - Copier un projet existant  
✅ **Export des résultats** - PDF, Excel, JSON  
✅ **Historique des modifications** - Sauvegarde automatique  
✅ **Aide contextuelle** - Tooltips et explications  
✅ **Validation complète** - Messages d'erreur clairs  
✅ **Responsive design** - Mobile, tablet, desktop  

---

## 🛠️ Stack Technologique

### Frontend
- **React 18.2+** - UI library
- **Vite 5.0+** - Build tool
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Recharts** - Graphiques interactifs

### Backend
- **Django 5.0+** - Web framework
- **Django REST Framework 3.14+** - REST APIs
- **PostgreSQL 15+** - Database
- **NumPy/SciPy** - Calculs matriciels
- **Gunicorn** - WSGI server

### DevOps
- **Git/GitHub** - Version control
- **Docker** (optionnel) - Containerization
- **Heroku/Railway** - Deployment

---

## 📦 Prérequis

### Minimum
- Python 3.11+
- Node.js 18+ et npm
- PostgreSQL 15+
- Git

### Recommandé
- Docker & Docker Compose
- VS Code avec extensions Django & React
- Postman ou Insomnia (API testing)

---

## 🚀 Installation

### Option 1: Setup Manuel (Recommandé pour le dev)

#### Backend

```bash
# Cloner le repository
git clone https://github.com/yourusername/ahp-decision-maker.git
cd ahp-decision-maker/backend

# Créer et activer le virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << EOF
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=ahp_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
EOF

# Exécuter les migrations
python manage.py migrate

# Créer un superuser
python manage.py createsuperuser

# Démarrer le serveur
python manage.py runserver
```

#### Frontend

```bash
# Dans un nouveau terminal, aller au dossier frontend
cd ahp-decision-maker/frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
EOF

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible à `http://localhost:5173`

### Option 2: Docker Compose (Recommandé pour la production)

```bash
git clone https://github.com/yourusername/ahp-decision-maker.git
cd ahp-decision-maker

# Créer les fichiers .env
cp .env.example .env
cp .env.frontend.example .env.frontend

# Démarrer les services
docker-compose up -d

# Exécuter les migrations
docker-compose exec web python manage.py migrate

# Créer un superuser
docker-compose exec web python manage.py createsuperuser

# Accéder à l'application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

---

## ⚙️ Configuration

### Variables d'Environnement Backend (.env)

```env
# Django
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ahp_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Email (optionnel)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_password

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

### Variables d'Environnement Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_DEBUG=false
```

---

## 📖 Utilisation

### Workflow Principal (6 Étapes)

#### 1️⃣ Créer un Problème
- Cliquez sur "Nouveau Problème"
- Entrez le titre, description et objectif
- Confirmez

#### 2️⃣ Ajouter les Critères
- Cliquez sur "Ajouter Critère"
- Entrez le nom (ex: "Prix", "Qualité", "Délai")
- Sélectionnez le type: Quantitatif ou Catégorique
- Configurez l'échelle de préférence (Saaty)
- Répétez pour tous les critères (min 2)

#### 3️⃣ Ajouter les Alternatives
- Cliquez sur "Ajouter Alternative"
- Entrez le nom (ex: "Option A", "Option B")
- Optionnel: Ajoutez une description
- Répétez pour toutes les alternatives (min 2)

#### 4️⃣ Noter les Alternatives
- Remplissez le tableau: alternatives × critères
- Entrez les scores (0-100 ou sélectionnez valeur)
- Validation automatique

#### 5️⃣ Matrice de Comparaison
- Comparez les critères par paires
- Utilisez l'échelle de Saaty (1/9 à 9)
- Le système vérifie la réciprocité

#### 6️⃣ Afficher les Résultats
- Vérification automatique de cohérence
- Si CR ≤ 0.1 : ✅ Résultats fiables
- Si CR > 0.1 : ❌ Réviser les comparaisons
- Ranking final des alternatives
- Graphiques et statistiques

---

## 📚 Documentation

### Guides Complets (150+ pages)

1. **[SYNTHESE_CONCEPTION.md](docs/SYNTHESE_CONCEPTION.md)** ⭐ À LIRE D'ABORD
   - Vue d'ensemble architecture
   - Flux de travail utilisateur
   - Stack technologique
   - Quick reference

2. **[01_ARCHITECTURE_FULLSTACK.md](docs/01_ARCHITECTURE_FULLSTACK.md)**
   - Architecture complète
   - Models Django
   - API endpoints
   - Formules mathématiques

3. **[02_GUIDE_IMPLEMENTATION_DETAILLE.md](docs/02_GUIDE_IMPLEMENTATION_DETAILLE.md)**
   - Setup phase par phase
   - Code prêt à copier
   - Migrations BD
   - Tests

4. **[03_RECAP_PARAMETRES_CHECKLIST.md](docs/03_RECAP_PARAMETRES_CHECKLIST.md)**
   - Paramètres mathématiques
   - Checklist complète
   - Messages d'erreur
   - Variables d'env

5. **[04_EXEMPLES_CODE.md](docs/04_EXEMPLES_CODE.md)**
   - Code complet models
   - Serializers DRF
   - Components React
   - Configuration

6. **[AHP_Application_Design.md](docs/AHP_Application_Design.md)**
   - Design initial
   - Exigences complètes
   - Plan de développement

### Autre Documentation
- [API Reference](#-api-reference) (section ci-dessous)
- Admin Django: `/admin`

---

## 🔌 API Reference

### Authentication
```
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/register/
```

### Decision Problems
```
GET    /api/problems/                          # Liste tous
POST   /api/problems/                          # Créer
GET    /api/problems/{id}/                     # Détail
PUT    /api/problems/{id}/                     # Modifier
DELETE /api/problems/{id}/                     # Supprimer
POST   /api/problems/{id}/duplicate/           # Dupliquer
```

### Criteria
```
GET    /api/problems/{id}/criteria/            # Liste
POST   /api/problems/{id}/criteria/            # Créer
PUT    /api/criteria/{id}/                     # Modifier
DELETE /api/criteria/{id}/                     # Supprimer
```

### Alternatives
```
GET    /api/problems/{id}/alternatives/        # Liste
POST   /api/problems/{id}/alternatives/        # Créer
PUT    /api/alternatives/{id}/                 # Modifier
DELETE /api/alternatives/{id}/                 # Supprimer
```

### Scores
```
GET    /api/alternatives/{id}/scores/          # Liste
POST   /api/alternatives/{id}/scores/          # Ajouter
PUT    /api/scores/{id}/                       # Modifier
```

### Analysis
```
POST   /api/problems/{id}/matrix/              # Sauvegarder matrice
POST   /api/problems/{id}/matrix/validate/     # Valider matrice
POST   /api/problems/{id}/analyze/             # Lancer analyse
GET    /api/problems/{id}/results/             # Récupérer résultats
POST   /api/problems/{id}/export/              # Exporter
```

### Response Example
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Sélection de Voiture",
  "criteria_weights": {
    "cost": 0.15,
    "comfort": 0.65,
    "consumption": 0.20
  },
  "ranking": [
    {
      "rank": 1,
      "alternative": "Honda Civic",
      "score": 0.72,
      "percentage": 40.0
    }
  ],
  "is_consistent": true,
  "consistency_ratio": 0.08
}
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
pytest  # ou coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🚢 Déploiement

### Heroku

```bash
# Créer app
heroku create ahp-decision-maker

# Ajouter PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Déployer
git push heroku main

# Exécuter migrations
heroku run python manage.py migrate

# Créer superuser
heroku run python manage.py createsuperuser
```

### Railway / Render / Other

Voir [01_ARCHITECTURE_FULLSTACK.md](docs/01_ARCHITECTURE_FULLSTACK.md) - Déploiement section

---

## 🐛 Troubleshooting

### Port 5173 déjà utilisé
```bash
# Changer le port dans vite.config.js
# Ou:
npm run dev -- --port 5174
```

### PostgreSQL ne démarre pas
```bash
# Vérifier que PostgreSQL est installé
psql --version

# Démarrer PostgreSQL
# Windows: rechercher PostgreSQL et démarrer le service
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Erreur "Module not found"
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### CORS error
Vérifier `CORS_ALLOWED_ORIGINS` dans `.env` backend

### Matrice incohérente (CR > 0.1)
→ Voir [03_RECAP_PARAMETRES_CHECKLIST.md](docs/03_RECAP_PARAMETRES_CHECKLIST.md) - Troubleshooting

---

## 📞 Support

### Questions?
- Lire la documentation dans `/docs`
- Consulter les exemples dans `04_EXEMPLES_CODE.md`
- Vérifier la FAQ dans `03_RECAP_PARAMETRES_CHECKLIST.md`

### Issues
1. Ouvrir une issue sur GitHub
2. Inclure: version Python/Node, erreur exacte, étapes pour reproduire
3. Attacher les logs

---

## 🤝 Contribuer

Les contributions sont les bienvenues!

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code
- PEP 8 pour Python
- ESLint pour JavaScript
- Ajouter des tests
- Mettre à jour la documentation

---

## 📄 License

Ce projet est sous la licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Auteurs

- **Your Name** - Développeur principal
- **Contributors** - [Liste ici]

---

## 🙏 Remerciements

- [Saaty, T. L. (1980). The Analytic Hierarchy Process](https://en.wikipedia.org/wiki/Analytic_hierarchy_process)
- Université de Yaoundé - Notes du cours AHP
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)

---

## 📊 Statistiques du Projet

- **Lignes de code**: ~5000+
- **Documents**: 6 (150+ pages)
- **Tests**: 30+ cas
- **Endpoints**: 35+
- **Models**: 7
- **Components**: 20+

---

## 🗺️ Roadmap

- [x] Architecture complète
- [x] Documentation
- [x] Core features
- [ ] Authentication avancée
- [ ] Collaboration temps réel
- [ ] Mobile app
- [ ] Analytics avancées
- [ ] AI recommendations

---

## ℹ️ À Propos

**AHP Decision Maker** est une implémentation moderne de la méthode **Analytical Hierarchy Process** de Thomas L. Saaty, adaptée pour résoudre les problèmes de décision multi-critères complexes.

### Cas d'Usage
- ✅ Sélection de produits
- ✅ Choix de lieu de résidence
- ✅ Recrutement
- ✅ Allocation de budget
- ✅ Sélection de projet
- ✅ Tout problème de décision!

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: Avril 2026

---

<div align="center">

**[Lire la Documentation Complète](docs/SYNTHESE_CONCEPTION.md)** •
**[Voir les Examples](docs/04_EXEMPLES_CODE.md)** •
**[API Reference](#-api-reference)** •
**[Issues](https://github.com/yourusername/ahp-decision-maker/issues)**

</div>

