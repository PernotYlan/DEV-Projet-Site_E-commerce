-- ============================================
-- TYPES ENUM
-- ============================================

CREATE TYPE role_utilisateur     AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE type_abonnement      AS ENUM ('MENSUEL', 'SEMESTRIEL', 'ANNUEL');
CREATE TYPE statut_abonnement    AS ENUM ('ACTIF', 'SUSPENDU', 'RESILIE', 'PAST_DUE');
CREATE TYPE statut_commande      AS ENUM ('PAIEMENT_ATTENTE', 'PAIEMENT_ACCEPTE', 'PAIEMENT_REFUSE');
CREATE TYPE type_token_email     AS ENUM ('CONFIRMATION_INSCRIPTION', 'RESET_MOT_DE_PASSE', 'CHANGEMENT_EMAIL');
CREATE TYPE statut_message       AS ENUM ('NOUVEAU', 'EN_COURS', 'TRAITE', 'FERME');
CREATE TYPE source_message       AS ENUM ('FORMULAIRE', 'CHATBOT');

-- ============================================
-- UTILISATEURS
-- Clients + Admins dans une seule table
-- role = CLIENT | ADMIN
-- ============================================

CREATE TABLE Utilisateurs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    mdp_hash            TEXT,                          -- bcrypt/argon2, jamais en clair
    telephone           VARCHAR(20),
    role                role_utilisateur NOT NULL DEFAULT 'CLIENT',
    email_verifie       BOOLEAN NOT NULL DEFAULT FALSE,-- doit cliquer le lien de confirmation
    d2f_secret          TEXT,                          -- secret TOTP pour 2FA (admins)
    is_d2f_actif        BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le             TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TOKENS EMAIL
-- Confirmation inscription + reset mdp (valables 24h)
-- ============================================

CREATE TABLE Tokens_Email (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id      UUID        NOT NULL REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    token_hash          TEXT        NOT NULL UNIQUE,
    type                type_token_email NOT NULL,
    expire_le           TIMESTAMP   NOT NULL,          -- NOW() + INTERVAL '24 hours'
    utilise             BOOLEAN     NOT NULL DEFAULT FALSE,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- SESSIONS
-- "Se souvenir de moi" + gestion des sessions actives
-- ============================================

CREATE TABLE Sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id      UUID        NOT NULL REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    token_hash          TEXT        NOT NULL UNIQUE,
    expire_le           TIMESTAMP   NOT NULL,
    ip_address          VARCHAR(45),                   -- IPv4 ou IPv6
    user_agent          TEXT,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADRESSES
-- Carnet d'adresses par utilisateur (plusieurs par client)
-- Utilisé pour la facturation au checkout
-- ============================================

CREATE TABLE Adresses (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id      UUID        NOT NULL REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    prenom              VARCHAR(100) NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    adresse_ligne1      VARCHAR(255) NOT NULL,
    adresse_ligne2      VARCHAR(255),                  -- complément d'adresse (optionnel)
    ville               VARCHAR(100) NOT NULL,
    region              VARCHAR(100),
    code_postal         VARCHAR(20)  NOT NULL,
    pays                VARCHAR(100) NOT NULL,
    est_defaut          BOOLEAN     NOT NULL DEFAULT FALSE,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- SOC | EDR | XDR - gérées depuis le backoffice
-- ============================================

CREATE TABLE Categories (
    id                  SERIAL      PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,          -- 'SOC', 'EDR', 'XDR'
    description         TEXT,
    image_url           TEXT,                           -- image affichée dans la grille d'accueil
    ordre_affichage     INTEGER     NOT NULL DEFAULT 0, -- modifiable depuis le backoffice
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRODUITS (Services SaaS)
-- SOC, EDR, XDR - gérés depuis le backoffice
-- ============================================

CREATE TABLE Produits (
    id                  SERIAL      PRIMARY KEY,
    categorie_id        INTEGER     NOT NULL REFERENCES Categories(id) ON DELETE RESTRICT,
    nom                 VARCHAR(100) NOT NULL,
    description         TEXT,
    specs_technique     JSONB,                          -- caractéristiques techniques flexibles
    image_url           TEXT,                           -- image principale du produit
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,  -- disponible à l'achat
    en_maintenance      BOOLEAN     NOT NULL DEFAULT FALSE, -- "Service momentanément indisponible"
    priorite            INTEGER     NOT NULL DEFAULT 0,     -- ordre d'affichage backoffice (plus c'est élevé, plus c'est en haut)
    est_top_produit     BOOLEAN     NOT NULL DEFAULT FALSE, -- section "Top Produits du moment"
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Images supplémentaires du produit (carrousel sur la page produit)
CREATE TABLE Produits_Images (
    id                  SERIAL      PRIMARY KEY,
    produit_id          INTEGER     NOT NULL REFERENCES Produits(id) ON DELETE CASCADE,
    image_url           TEXT        NOT NULL,
    ordre_affichage     INTEGER     NOT NULL DEFAULT 0,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRIX
-- Un produit peut avoir plusieurs tarifs (mensuel, semestriel, annuel)
-- ============================================

CREATE TABLE Prix (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id          INTEGER     NOT NULL REFERENCES Produits(id) ON DELETE CASCADE,
    type_abonnement     type_abonnement NOT NULL,
    montant             DECIMAL(10,2) NOT NULL,
    monnaie             VARCHAR(3)  NOT NULL DEFAULT 'EUR', -- code ISO 4217
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE(produit_id, type_abonnement)                 -- un seul prix par type par produit
);

-- ============================================
-- METHODES DE PAIEMENT
-- Jamais le vrai numéro de carte : uniquement le token Stripe
-- ============================================

CREATE TABLE Methodes_Paiement (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id          UUID    NOT NULL REFERENCES Utilisateurs(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT   NOT NULL,           -- token Stripe, jamais les données brutes
    derniers_quatre_chiffres CHAR(4) NOT NULL,           -- pour affichage uniquement
    nom_sur_carte           VARCHAR(100),
    mois_expiration         SMALLINT NOT NULL CHECK (mois_expiration BETWEEN 1 AND 12),
    annee_expiration        SMALLINT NOT NULL,
    est_defaut              BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le                 TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMMANDES
-- Une commande = un achat finalisé
-- ============================================

CREATE TABLE Commandes (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id          UUID    NOT NULL REFERENCES Utilisateurs(id) ON DELETE RESTRICT,
    adresse_facturation_id  UUID    REFERENCES Adresses(id) ON DELETE SET NULL,
    methode_paiement_id     UUID    REFERENCES Methodes_Paiement(id) ON DELETE SET NULL,
    -- Snapshot de l'adresse au moment de l'achat (au cas où l'adresse est supprimée)
    adresse_snapshot        JSONB,
    -- Snapshot des 4 derniers chiffres de la carte au moment de l'achat
    carte_derniers_chiffres CHAR(4),
    total_ht                DECIMAL(10,2) NOT NULL,
    taux_tva                DECIMAL(5,2)  NOT NULL DEFAULT 20.00,
    total_ttc               DECIMAL(10,2) NOT NULL,
    statut                  statut_commande NOT NULL DEFAULT 'PAIEMENT_ATTENTE',
    stripe_payment_intent_id TEXT,                      -- référence Stripe de la transaction
    cree_le                 TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- LIGNES DE COMMANDE
-- Détail de chaque produit dans une commande
-- ============================================

CREATE TABLE Commandes_Lignes (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id         UUID        NOT NULL REFERENCES Commandes(id) ON DELETE CASCADE,
    produit_id          INTEGER     NOT NULL REFERENCES Produits(id) ON DELETE RESTRICT,
    prix_id             UUID        NOT NULL REFERENCES Prix(id) ON DELETE RESTRICT,
    -- Snapshots au moment de l'achat (les prix peuvent changer dans le futur)
    produit_nom         VARCHAR(100) NOT NULL,
    type_abonnement     type_abonnement NOT NULL,
    prix_unitaire_ht    DECIMAL(10,2) NOT NULL,
    quantite            INTEGER     NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_total_ht       DECIMAL(10,2) NOT NULL
);

-- ============================================
-- ABONNEMENTS
-- Suivi de l'état actif de chaque souscription
-- ============================================

CREATE TABLE Abonnements (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id          UUID    NOT NULL REFERENCES Utilisateurs(id) ON DELETE RESTRICT,
    produit_id              INTEGER NOT NULL REFERENCES Produits(id) ON DELETE RESTRICT,
    prix_id                 UUID    NOT NULL REFERENCES Prix(id) ON DELETE RESTRICT,
    commande_id             UUID    REFERENCES Commandes(id) ON DELETE SET NULL,
    statut                  statut_abonnement NOT NULL DEFAULT 'ACTIF',
    type_abonnement         type_abonnement   NOT NULL,
    periode_debut           TIMESTAMP NOT NULL,
    periode_fin             TIMESTAMP,                  -- NULL si pas de date de fin
    renouvellement_auto     BOOLEAN NOT NULL DEFAULT TRUE,
    resiliation_demandee_le TIMESTAMP,                  -- NULL si pas résilié
    stripe_subscription_id  TEXT,                       -- référence Stripe de l'abonnement
    cree_le                 TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- FACTURES
-- Générées après chaque commande confirmée
-- ============================================

CREATE TABLE Factures (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id         UUID        NOT NULL REFERENCES Commandes(id) ON DELETE RESTRICT,
    numero_facture      VARCHAR(50) NOT NULL UNIQUE,    -- ex: FACT-2024-00001
    pdf_url             TEXT,                           -- chemin vers le PDF généré
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- CARROUSEL PAGE D'ACCUEIL
-- Modifiable depuis le backoffice
-- ============================================

CREATE TABLE Carrousel (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    titre               VARCHAR(100),
    description         TEXT,
    img_url             TEXT        NOT NULL,
    lien_url            TEXT,                           -- lien cliquable de la slide
    ordre_affichage     INTEGER     NOT NULL DEFAULT 0,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- TEXTE ACCUEIL
-- Texte fixe sous le carrousel, modifiable depuis le backoffice
-- ============================================

CREATE TABLE Contenu_Accueil (
    id                  SERIAL      PRIMARY KEY,
    cle                 VARCHAR(50) NOT NULL UNIQUE,    -- ex: 'texte_principal', 'titre_top_produits'
    valeur              TEXT        NOT NULL,
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- MESSAGES DE CONTACT
-- Formulaire de contact + conversations chatbot
-- Accessibles depuis le backoffice
-- ============================================

CREATE TABLE Messages_Contact (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id      UUID        REFERENCES Utilisateurs(id) ON DELETE SET NULL, -- NULL si visiteur non connecté
    email               VARCHAR(255) NOT NULL,
    sujet               VARCHAR(255),
    message             TEXT        NOT NULL,
    source              source_message NOT NULL DEFAULT 'FORMULAIRE',
    statut              statut_message NOT NULL DEFAULT 'NOUVEAU',
    traite_par          UUID        REFERENCES Utilisateurs(id) ON DELETE SET NULL, -- admin qui a traité
    cree_le             TIMESTAMP   NOT NULL DEFAULT NOW(),
    modifie_le          TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX - pour optimiser les requêtes fréquentes
-- ============================================

-- Connexion par email
CREATE INDEX idx_utilisateurs_email          ON Utilisateurs(email);
CREATE INDEX idx_utilisateurs_role           ON Utilisateurs(role);

-- Tokens non utilisés et non expirés
CREATE INDEX idx_tokens_email_token_hash     ON Tokens_Email(token_hash);
CREATE INDEX idx_tokens_email_utilisateur    ON Tokens_Email(utilisateur_id);

-- Sessions actives
CREATE INDEX idx_sessions_token_hash         ON Sessions(token_hash);
CREATE INDEX idx_sessions_utilisateur        ON Sessions(utilisateur_id);

-- Catalogue produits
CREATE INDEX idx_produits_categorie          ON Produits(categorie_id);
CREATE INDEX idx_produits_priorite          ON Produits(priorite DESC);
CREATE INDEX idx_produits_is_active          ON Produits(is_active);
CREATE INDEX idx_produits_top               ON Produits(est_top_produit) WHERE est_top_produit = TRUE;

-- Recherche full-text sur nom et description des produits
CREATE INDEX idx_produits_search             ON Produits USING gin(to_tsvector('french', nom || ' ' || COALESCE(description, '')));

-- Prix par produit
CREATE INDEX idx_prix_produit               ON Prix(produit_id);

-- Commandes par utilisateur (historique)
CREATE INDEX idx_commandes_utilisateur       ON Commandes(utilisateur_id);
CREATE INDEX idx_commandes_statut            ON Commandes(statut);
CREATE INDEX idx_commandes_date              ON Commandes(cree_le DESC);

-- Abonnements actifs par utilisateur
CREATE INDEX idx_abonnements_utilisateur     ON Abonnements(utilisateur_id);
CREATE INDEX idx_abonnements_statut          ON Abonnements(statut);
CREATE INDEX idx_abonnements_produit         ON Abonnements(produit_id);

-- Messages backoffice
CREATE INDEX idx_messages_statut             ON Messages_Contact(statut);
CREATE INDEX idx_messages_source             ON Messages_Contact(source);

-- Adresses par utilisateur
CREATE INDEX idx_adresses_utilisateur        ON Adresses(utilisateur_id);

-- Méthodes de paiement par utilisateur
CREATE INDEX idx_methodes_utilisateur        ON Methodes_Paiement(utilisateur_id);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Catégories de base
INSERT INTO Categories (nom, description, ordre_affichage) VALUES
    ('SOC', 'Security Operations Center – surveillance et détection des menaces en temps réel', 1),
    ('EDR', 'Endpoint Detection & Response – protection avancée des terminaux', 2),
    ('XDR', 'Extended Detection & Response – protection étendue multi-couches', 3);

-- Contenu modifiable de la page d'accueil
INSERT INTO Contenu_Accueil (cle, valeur) VALUES
    ('texte_sous_carrousel', 'Cyna sécurise votre avenir numérique avec des solutions SaaS de pointe.'),
    ('titre_top_produits',   'Les Top Produits du moment');

-- Admin par défaut (mot de passe à changer immédiatement)
INSERT INTO Utilisateurs (nom, prenom, email, mdp_hash, role, email_verifie) VALUES
    ('Admin', 'Cyna', 'admin@cyna-it.fr', 'CHANGER_CE_HASH', 'ADMIN', TRUE);

CREATE OR REPLACE FUNCTION set_modifie_le()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modifie_le = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_utilisateurs_modifie_le
  BEFORE UPDATE ON utilisateurs FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_adresses_modifie_le
  BEFORE UPDATE ON adresses FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_categories_modifie_le
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_produits_modifie_le
  BEFORE UPDATE ON produits FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_prix_modifie_le
  BEFORE UPDATE ON prix FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_commandes_modifie_le
  BEFORE UPDATE ON commandes FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_abonnements_modifie_le
  BEFORE UPDATE ON abonnements FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_carrousel_modifie_le
  BEFORE UPDATE ON carrousel FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_contenu_accueil_modifie_le
  BEFORE UPDATE ON contenu_accueil FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

CREATE TRIGGER trg_messages_contact_modifie_le
  BEFORE UPDATE ON messages_contact FOR EACH ROW EXECUTE FUNCTION set_modifie_le();

  