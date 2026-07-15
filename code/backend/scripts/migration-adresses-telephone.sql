-- Ajoute le numéro de téléphone aux adresses (cahier des charges : "Numéro de
-- téléphone mobile (pour d'éventuelles notifications liées aux services SaaS
-- ou la facturation)"). Nullable ici pour ne pas casser les adresses déjà
-- enregistrées ; le formulaire (front + validation back) le rend obligatoire
-- pour toute nouvelle adresse.
ALTER TABLE Adresses ADD COLUMN IF NOT EXISTS telephone VARCHAR(20);
