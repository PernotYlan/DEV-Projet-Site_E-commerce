-- Ajoute le type de token utilisé pour la double authentification (2FA) par
-- code email, envoyée aux comptes ADMIN à la connexion. Réutilise la table
-- Tokens_Email existante (même mécanisme que la confirmation d'inscription
-- et la réinitialisation de mot de passe).
ALTER TYPE type_token_email ADD VALUE IF NOT EXISTS 'CODE_2FA_LOGIN';
