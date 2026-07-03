-- Ajoute la colonne stripe_customer_id à Utilisateurs (nécessaire pour
-- rattacher les cartes et réutiliser les moyens de paiement enregistrés).
ALTER TABLE Utilisateurs ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
