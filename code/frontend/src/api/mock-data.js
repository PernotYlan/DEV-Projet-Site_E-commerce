/**
 * Données de démonstration (mode VITE_MOCK=1).
 * Permettent de faire tourner tout le site sans backend, par exemple
 * pour une démo locale. Les "images" sont des dégradés CSS générés
 * par les composants à partir du champ `couleur`.
 */

export const categories = [
  {
    id: 1,
    nom: 'SOC',
    description:
      'Security Operations Center — surveillance et détection des menaces en temps réel par nos experts, 24h/24 et 7j/7.',
    couleur: '#5D737E',
    icone: '🛡️',
    ordre_affichage: 1,
    is_active: true,
  },
  {
    id: 2,
    nom: 'EDR',
    description:
      'Endpoint Detection & Response — protection avancée des postes de travail et serveurs contre les menaces sophistiquées.',
    couleur: '#E49AB0',
    icone: '💻',
    ordre_affichage: 2,
    is_active: true,
  },
  {
    id: 3,
    nom: 'XDR',
    description:
      'Extended Detection & Response — vision consolidée et corrélée des menaces sur l’ensemble de votre système d’information.',
    couleur: '#1f2d33',
    icone: '🌐',
    ordre_affichage: 3,
    is_active: true,
  },
];

/** Génère les 3 prix d'un produit à partir du tarif mensuel. */
function prix(produitId, mensuel) {
  return [
    { id: `${produitId}-m`, type_abonnement: 'MENSUEL', montant: mensuel, monnaie: 'EUR', is_active: true },
    { id: `${produitId}-s`, type_abonnement: 'SEMESTRIEL', montant: Math.round(mensuel * 6 * 0.9 * 100) / 100, monnaie: 'EUR', is_active: true },
    { id: `${produitId}-a`, type_abonnement: 'ANNUEL', montant: Math.round(mensuel * 12 * 0.8 * 100) / 100, monnaie: 'EUR', is_active: true },
  ];
}

export const produits = [
  {
    id: 1,
    categorie_id: 1,
    nom: 'Cyna SOC Essentials',
    description:
      'Supervision continue de votre infrastructure par notre centre opérationnel de sécurité. Détection des incidents, alertes en temps réel et rapports mensuels. Idéal pour les PME qui souhaitent externaliser leur sécurité.',
    specs_technique: {
      'Surveillance': '24/7',
      'Temps de réponse (SLA)': '< 30 minutes',
      'Sources analysées': 'Jusqu’à 20 équipements',
      'Rapports': 'Mensuels',
      'Support': 'Email et téléphone',
    },
    couleur: '#5D737E',
    is_active: true,
    en_maintenance: false,
    priorite: 10,
    est_top_produit: true,
    prix: prix(1, 299),
    cree_le: '2026-01-15',
  },
  {
    id: 2,
    categorie_id: 1,
    nom: 'Cyna SOC Premium',
    description:
      'Notre offre SOC la plus complète : analyse comportementale, threat hunting proactif, réponse à incident managée et accès à un analyste dédié. Pour les entreprises aux exigences élevées.',
    specs_technique: {
      'Surveillance': '24/7',
      'Temps de réponse (SLA)': '< 15 minutes',
      'Sources analysées': 'Illimitées',
      'Threat hunting': 'Hebdomadaire',
      'Analyste dédié': 'Oui',
      'Rapports': 'Hebdomadaires',
    },
    couleur: '#41545e',
    is_active: true,
    en_maintenance: false,
    priorite: 8,
    est_top_produit: true,
    prix: prix(2, 799),
    cree_le: '2026-02-01',
  },
  {
    id: 3,
    categorie_id: 2,
    nom: 'Cyna EDR Protect',
    description:
      'Protection des terminaux nouvelle génération : détection comportementale, isolation automatique des postes compromis et remédiation à distance. Déploiement en quelques minutes.',
    specs_technique: {
      'Postes couverts': 'Par licence',
      'OS supportés': 'Windows, macOS, Linux',
      'Isolation automatique': 'Oui',
      'Rollback ransomware': 'Oui',
      'Console cloud': 'Incluse',
    },
    couleur: '#E49AB0',
    is_active: true,
    en_maintenance: false,
    priorite: 9,
    est_top_produit: true,
    prix: prix(3, 12.9),
    cree_le: '2026-02-20',
  },
  {
    id: 4,
    categorie_id: 2,
    nom: 'Cyna EDR Protect Plus',
    description:
      'Toutes les fonctionnalités d’EDR Protect, plus l’analyse forensique approfondie, le contrôle des périphériques USB et l’intégration SIEM native.',
    specs_technique: {
      'Postes couverts': 'Par licence',
      'Forensique': 'Avancée',
      'Contrôle périphériques': 'USB, Bluetooth',
      'Intégration SIEM': 'Native',
      'Support': 'Prioritaire 24/7',
    },
    couleur: '#c97f96',
    is_active: true,
    en_maintenance: false,
    priorite: 5,
    est_top_produit: false,
    prix: prix(4, 19.9),
    cree_le: '2026-03-05',
  },
  {
    id: 5,
    categorie_id: 3,
    nom: 'Cyna XDR Platform',
    description:
      'La plateforme de détection étendue qui corrèle les signaux de vos endpoints, réseaux, identités et applications cloud pour ne manquer aucune attaque.',
    specs_technique: {
      'Sources corrélées': 'Endpoints, réseau, cloud, identité',
      'Rétention des données': '12 mois',
      'IA de corrélation': 'Oui',
      'Playbooks automatisés': '50+ inclus',
      'API ouverte': 'REST',
    },
    couleur: '#1f2d33',
    is_active: true,
    en_maintenance: false,
    priorite: 7,
    est_top_produit: true,
    prix: prix(5, 499),
    cree_le: '2026-03-10',
  },
  {
    id: 6,
    categorie_id: 3,
    nom: 'Cyna XDR Intelligence',
    description:
      'XDR Platform enrichie par notre flux de threat intelligence propriétaire : indicateurs de compromission actualisés en continu et priorisation des alertes par criticité métier.',
    specs_technique: {
      'Threat intelligence': 'Flux propriétaire temps réel',
      'Scoring des alertes': 'Criticité métier',
      'Rétention des données': '24 mois',
      'Intégrations': '100+ connecteurs',
    },
    couleur: '#0e171b',
    is_active: true,
    en_maintenance: true,
    priorite: 6,
    est_top_produit: false,
    prix: prix(6, 899),
    cree_le: '2026-04-01',
  },
  {
    id: 7,
    categorie_id: 1,
    nom: 'Cyna SOC Audit',
    description:
      'Audit ponctuel de votre posture de sécurité par les analystes du SOC : revue de configuration, analyse des journaux et plan de remédiation priorisé.',
    specs_technique: {
      'Durée': '2 semaines',
      'Livrables': 'Rapport + plan de remédiation',
      'Restitution': 'Présentation dédiée',
    },
    couleur: '#7a93a0',
    is_active: false,
    en_maintenance: false,
    priorite: 0,
    est_top_produit: false,
    prix: prix(7, 1490),
    cree_le: '2026-01-05',
  },
  {
    id: 8,
    categorie_id: 2,
    nom: 'Cyna EDR Mobile',
    description:
      'Étendez la protection EDR à vos flottes mobiles Android et iOS : détection du phishing, des applications malveillantes et des réseaux compromis.',
    specs_technique: {
      'OS supportés': 'Android, iOS',
      'Anti-phishing': 'Oui',
      'MDM compatible': 'Intune, Jamf',
    },
    couleur: '#eebbc9',
    is_active: true,
    en_maintenance: false,
    priorite: 0,
    est_top_produit: false,
    prix: prix(8, 6.9),
    cree_le: '2026-05-01',
  },
];

export const carrousel = [
  {
    id: 'c1',
    titre: 'Protégez votre entreprise avec CYNA',
    description: 'Solutions SaaS de cybersécurité : SOC, EDR et XDR opérés par des experts.',
    couleur: '#1f2d33',
    lien_url: '/catalogue/1',
    ordre_affichage: 1,
  },
  {
    id: 'c2',
    titre: 'EDR Protect : -20% sur l’abonnement annuel',
    description: 'Déployez la protection des terminaux nouvelle génération en quelques minutes.',
    couleur: '#E49AB0',
    lien_url: '/produit/3',
    ordre_affichage: 2,
  },
  {
    id: 'c3',
    titre: 'Nouveau : Cyna XDR Platform',
    description: 'Corrélez tous vos signaux de sécurité dans une seule console.',
    couleur: '#5D737E',
    lien_url: '/produit/5',
    ordre_affichage: 3,
  },
];

export const contenuAccueil = {
  texte_sous_carrousel: 'Cyna sécurise votre avenir numérique avec des solutions SaaS de pointe.',
  titre_top_produits: 'Les Top Produits du moment',
};

/** Utilisateur de démonstration (connexion avec n'importe quel mot de passe). */
export const utilisateurDemo = {
  id: 'demo-user-1',
  nom: 'Dupont',
  prenom: 'Marie',
  email: 'demo@cyna-it.fr',
  telephone: '06 12 34 56 78',
  role: 'CLIENT',
  email_verifie: true,
};

export const adressesDemo = [
  {
    id: 'adr-1',
    prenom: 'Marie',
    nom: 'Dupont',
    adresse_ligne1: '12 avenue des Champs-Élysées',
    adresse_ligne2: '',
    ville: 'Paris',
    region: 'Île-de-France',
    code_postal: '75008',
    pays: 'France',
    telephone: '06 12 34 56 78',
    est_defaut: true,
  },
];

export const paiementsDemo = [
  {
    id: 'pm-1',
    derniers_quatre_chiffres: '4242',
    nom_sur_carte: 'MARIE DUPONT',
    mois_expiration: 8,
    annee_expiration: 2028,
    est_defaut: true,
  },
];

export const abonnementsDemo = [
  {
    id: 'ab-1',
    produit_id: 3,
    produit_nom: 'Cyna EDR Protect',
    statut: 'ACTIF',
    type_abonnement: 'MENSUEL',
    periode_debut: '2026-05-01',
    periode_fin: '2026-07-01',
    renouvellement_auto: true,
    resiliation_demandee_le: null,
  },
  {
    id: 'ab-2',
    produit_id: 1,
    produit_nom: 'Cyna SOC Essentials',
    statut: 'ACTIF',
    type_abonnement: 'ANNUEL',
    periode_debut: '2026-01-15',
    periode_fin: '2027-01-15',
    renouvellement_auto: true,
    resiliation_demandee_le: null,
  },
];

export const commandesDemo = [
  {
    id: 'cmd-2026-001',
    cree_le: '2026-05-01',
    statut: 'PAIEMENT_ACCEPTE',
    total_ht: 12.9,
    taux_tva: 20,
    total_ttc: 15.48,
    carte_derniers_chiffres: '4242',
    adresse_snapshot: adressesDemo[0],
    lignes: [
      { id: 'l1', produit_nom: 'Cyna EDR Protect', type_abonnement: 'MENSUEL', prix_unitaire_ht: 12.9, quantite: 1, prix_total_ht: 12.9 },
    ],
  },
  {
    id: 'cmd-2026-002',
    cree_le: '2026-01-15',
    statut: 'PAIEMENT_ACCEPTE',
    total_ht: 2870.4,
    taux_tva: 20,
    total_ttc: 3444.48,
    carte_derniers_chiffres: '4242',
    adresse_snapshot: adressesDemo[0],
    lignes: [
      { id: 'l2', produit_nom: 'Cyna SOC Essentials', type_abonnement: 'ANNUEL', prix_unitaire_ht: 2870.4, quantite: 1, prix_total_ht: 2870.4 },
    ],
  },
  {
    id: 'cmd-2025-001',
    cree_le: '2025-11-03',
    statut: 'PAIEMENT_REFUSE',
    total_ht: 499,
    taux_tva: 20,
    total_ttc: 598.8,
    carte_derniers_chiffres: '4242',
    adresse_snapshot: adressesDemo[0],
    lignes: [
      { id: 'l3', produit_nom: 'Cyna XDR Platform', type_abonnement: 'MENSUEL', prix_unitaire_ht: 499, quantite: 1, prix_total_ht: 499 },
    ],
  },
];
