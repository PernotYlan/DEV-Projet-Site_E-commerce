# CYNA DEV — Plateforme e-commerce de cybersécurité

> Projet Fil Rouge — Bachelor BSI — Institut Limayrac  
> Groupe 4 · Ylan PERNOT · Charlotte MOERMAN · Nathan NOELIJAONA · Karl NEGREVERGNE

---

## Présentation du projet

**CYNA** est une entreprise spécialisée en cybersécurité, fondée en 2021, proposant des solutions SaaS de protection informatique (EDR, XDR, SOC). Actuellement distribuées via un réseau commercial traditionnel, ces offres souffrent d'un manque de digitalisation.

**CYNA DEV** vise à concevoir et développer une plateforme e-commerce sécurisée permettant aux clients de découvrir, souscrire et gérer leurs abonnements en autonomie.

---

## Problématique

> Comment concevoir une plateforme SaaS e-commerce **sécurisée**, **évolutive** et **performante** permettant à CYNA de digitaliser ses services tout en garantissant un haut niveau de sécurité et de conformité ?

---

## Fonctionnalités principales

### Côté client
- Consultation et comparaison des offres de cybersécurité
- Création de compte et authentification sécurisée (JWT + 2FA)
- Souscription en ligne et paiement sécurisé (Stripe)
- Gestion du profil, des abonnements et de l'historique de paiements
- Tableau de bord personnel

### Côté administrateur
- CRUD complet sur les offres (création, modification, suppression)
- Supervision des comptes clients et des abonnements actifs
- Consultation des statistiques et des paiements
- Gestion des incidents et demandes

---

## Stack technique

### Frontend
- **HTML / CSS / JavaScript**
- **React.js** — SPA responsive (approche Mobile-First)
- Context API pour la gestion d'état

### Backend
- **Node.js / Express** — API RESTful centralisée
- **PostgreSQL** — base de données relationnelle
- **JWT** — authentification et sessions sécurisées
- **Stripe** — intégration paiement

### Sécurité
- Protection XSS, CSRF, injections SQL
- Chiffrement des données sensibles (SSL/TLS)
- Gestion des rôles et permissions (RBAC)
- Journalisation des actions critiques
- Conformité RGPD (*privacy by design*)

### DevSecOps
- **GitHub** — versioning avec stratégie de branches
- **Docker** — conteneurisation (optionnel)
- Monitoring et logs applicatifs

---

## Architecture

```
COUCHE PRÉSENTATION
└── React.js — Site web responsive (PC / Mobile)

COUCHE APPLICATIVE (Back-end / Serveur)
└── API RESTful centralisée
    ├── Authentification sécurisée (JWT)
    ├── Logique métier SaaS & Abonnements
    ├── Passerelle Paiement (Stripe/PayPal)
    └── Validation & Gestion des erreurs

COUCHE DONNÉES
└── PostgreSQL
    ├── Données personnelles & RGPD
    └── Catalogue & Transactions
```

---

## Structure du site

```
Site e-commerce CYNA
├── Pages principales
│   ├── Accueil
│   ├── Catalogue (par catégorie)
│   └── Recherche avancée
├── Pages de commande
│   ├── Panier
│   ├── Checkout (paiement sécurisé)
│   └── Confirmation
└── Pages compte utilisateur
    ├── Mon compte (profil, abonnements, paramètres)
    ├── Créer un compte
    ├── Se connecter
    └── Mot de passe oublié
```

---

## Organisation de l'équipe

| Membre | Rôle |
|--------|------|
| Charlotte MOERMAN | Responsable de projet |
| Nathan NOELIJAONA | Responsable Front-end |
| Karl NEGREVERGNE | Responsable Back-end |
| Ylan PERNOT | Responsable DevSecOps |

---

## Méthodologie

Le projet est conduit en **Agile / Scrum** avec un découpage en 7 sprints :

| Sprint | Période | Objectif |
|--------|---------|----------|
| Sprint 1 | 14/01 → 19/02 | Phase d'analyse & cadrage |
| Sprint 2 | 20/02 → 24/03 | Infrastructure & architecture technique |
| Sprint 3 | 25/03 → 21/04 | Authentification complète & sécurisation |
| Sprint 4 | 22/04 → 19/05 | Catalogue complet (front + back) |
| Sprint 5 | 20/05 → 16/06 | Abonnement & paiement sécurisé |
| Sprint 6 | 17/06 → 07/07 | Backoffice administrateur |
| Sprint 7 | 08/07 → 16/07 | Déploiement & finalisation |

Outil de gestion de projet : **Notion** (Kanban, backlog, suivi des sprints).

---

## Calendrier des rendus

| Date | Livrable |
|------|----------|
| 19/02 | Rendu note de cadrage (Bloc 1) |
| 20/02 | Jury Bloc 1 — oral individuel (10 min/élève) |
| 21/04 | Jury Bloc 2 — soutenance + démo |
| 16/07 | Jury final — rendu complet + démo |
| 2-3 sept. | Rattrapages |

---

## Livrables

- Note de cadrage
- Architecture technique et diagrammes (UML, cas d'utilisation, schéma SI)
- Repositories Git (web, back-office)
- Application web fonctionnelle (responsive + mobile)
- Documentation technique complète
- Document de test
- Document de suivi de projet
- Document de fin de projet

---

## Contraintes & conformité

- **RGPD** — minimisation des données, droits utilisateurs, politique de confidentialité
- **Sécurité by Design** — intégrée dès la conception
- **Mobile-First obligatoire**
- **Numérique responsable** — optimisation du code, réduction de l'empreinte carbone
- **Accessibilité** — respect des critères WCAG

---

## Risques principaux

| Risque | Criticité | Mesure |
|--------|-----------|--------|
| Mauvais responsive (mobile) | 9 | Développement Mobile-First strict |
| Retards dans les sprints | 9 | Rétrospectives hebdomadaires |
| Non-conformité RGPD | 8 | Chiffrement + registre de traitement |
| Failles de sécurité (XSS/SQL) | 8 | Security by Design + tests réguliers |
| Indisponibilité API/backend | 6 | Architecture scalable + monitoring |
| Difficultés intégration Stripe | 6 | Environnement Sandbox avant prod |

---

## Lancer le projet (développement local)

```bash
# Cloner le dépôt
git clone https://github.com/<org>/cyna-dev.git
cd cyna-dev

# Backend
cd backend
cp .env.example .env    # configurer les variables d'environnement
npm install
npm run dev

# Frontend
cd ../frontend
npm install
npm start
```

> L'hébergement cible est local dans le cadre pédagogique.  
> Configurer les variables `DATABASE_URL`, `JWT_SECRET` et `STRIPE_SECRET_KEY` dans le fichier `.env`.

---

*Projet réalisé dans le cadre du Bachelor BSI — Institut Limayrac — Promotion 2024/2025*
