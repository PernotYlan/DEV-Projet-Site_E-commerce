-- ============================================================
-- Seed du catalogue CYNA (produits, prix, carrousel).
-- Idempotent : ne fait rien si des produits existent déjà.
-- Prix : semestriel = mensuel*6*0.9, annuel = mensuel*12*0.8.
-- ============================================================

DO $$
DECLARE
  soc INT; edr INT; xdr INT; pid INT;
BEGIN
  IF (SELECT COUNT(*) FROM Produits) > 0 THEN
    RAISE NOTICE 'Produits déjà présents — seed ignoré.';
    RETURN;
  END IF;

  SELECT id INTO soc FROM Categories WHERE nom = 'SOC';
  SELECT id INTO edr FROM Categories WHERE nom = 'EDR';
  SELECT id INTO xdr FROM Categories WHERE nom = 'XDR';

  -- ---------- SOC ----------
  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (soc, 'Cyna SOC Essentials',
    'Supervision continue de votre infrastructure par notre centre opérationnel de sécurité. Détection des incidents, alertes en temps réel et rapports mensuels. Idéal pour les PME qui souhaitent externaliser leur sécurité.',
    '{"Surveillance":"24/7","Temps de réponse (SLA)":"< 30 minutes","Sources analysées":"Jusqu''à 20 équipements","Rapports":"Mensuels","Support":"Email et téléphone"}'::jsonb,
    TRUE, FALSE, 10, TRUE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',299),(pid,'SEMESTRIEL',1614.60),(pid,'ANNUEL',2870.40);

  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (soc, 'Cyna SOC Premium',
    'Notre offre SOC la plus complète : analyse comportementale, threat hunting proactif, réponse à incident managée et accès à un analyste dédié. Pour les entreprises aux exigences élevées.',
    '{"Surveillance":"24/7","Temps de réponse (SLA)":"< 15 minutes","Sources analysées":"Illimitées","Threat hunting":"Hebdomadaire","Analyste dédié":"Oui","Rapports":"Hebdomadaires"}'::jsonb,
    TRUE, FALSE, 8, TRUE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',799),(pid,'SEMESTRIEL',4314.60),(pid,'ANNUEL',7670.40);

  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (soc, 'Cyna SOC Audit',
    'Audit ponctuel de votre posture de sécurité par les analystes du SOC : revue de configuration, analyse des journaux et plan de remédiation priorisé.',
    '{"Durée":"2 semaines","Livrables":"Rapport + plan de remédiation","Restitution":"Présentation dédiée"}'::jsonb,
    FALSE, FALSE, 0, FALSE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',1490),(pid,'SEMESTRIEL',8046),(pid,'ANNUEL',14304);

  -- ---------- EDR ----------
  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (edr, 'Cyna EDR Protect',
    'Protection des terminaux nouvelle génération : détection comportementale, isolation automatique des postes compromis et remédiation à distance. Déploiement en quelques minutes.',
    '{"Postes couverts":"Par licence","OS supportés":"Windows, macOS, Linux","Isolation automatique":"Oui","Rollback ransomware":"Oui","Console cloud":"Incluse"}'::jsonb,
    TRUE, FALSE, 9, TRUE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',12.90),(pid,'SEMESTRIEL',69.66),(pid,'ANNUEL',123.84);

  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (edr, 'Cyna EDR Protect Plus',
    'Toutes les fonctionnalités d''EDR Protect, plus l''analyse forensique approfondie, le contrôle des périphériques USB et l''intégration SIEM native.',
    '{"Postes couverts":"Par licence","Forensique":"Avancée","Contrôle périphériques":"USB, Bluetooth","Intégration SIEM":"Native","Support":"Prioritaire 24/7"}'::jsonb,
    TRUE, FALSE, 5, FALSE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',19.90),(pid,'SEMESTRIEL',107.46),(pid,'ANNUEL',191.04);

  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (edr, 'Cyna EDR Mobile',
    'Étendez la protection EDR à vos flottes mobiles Android et iOS : détection du phishing, des applications malveillantes et des réseaux compromis.',
    '{"OS supportés":"Android, iOS","Anti-phishing":"Oui","MDM compatible":"Intune, Jamf"}'::jsonb,
    TRUE, FALSE, 0, FALSE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',6.90),(pid,'SEMESTRIEL',37.26),(pid,'ANNUEL',66.24);

  -- ---------- XDR ----------
  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (xdr, 'Cyna XDR Platform',
    'La plateforme de détection étendue qui corrèle les signaux de vos endpoints, réseaux, identités et applications cloud pour ne manquer aucune attaque.',
    '{"Sources corrélées":"Endpoints, réseau, cloud, identité","Rétention des données":"12 mois","IA de corrélation":"Oui","Playbooks automatisés":"50+ inclus","API ouverte":"REST"}'::jsonb,
    TRUE, FALSE, 7, TRUE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',499),(pid,'SEMESTRIEL',2694.60),(pid,'ANNUEL',4790.40);

  INSERT INTO Produits (categorie_id, nom, description, specs_technique, is_active, en_maintenance, priorite, est_top_produit)
  VALUES (xdr, 'Cyna XDR Intelligence',
    'XDR Platform enrichie par notre flux de threat intelligence propriétaire : indicateurs de compromission actualisés en continu et priorisation des alertes par criticité métier.',
    '{"Threat intelligence":"Flux propriétaire temps réel","Scoring des alertes":"Criticité métier","Rétention des données":"24 mois","Intégrations":"100+ connecteurs"}'::jsonb,
    TRUE, TRUE, 6, FALSE) RETURNING id INTO pid;
  INSERT INTO Prix (produit_id, type_abonnement, montant) VALUES (pid,'MENSUEL',899),(pid,'SEMESTRIEL',4854.60),(pid,'ANNUEL',8630.40);

  RAISE NOTICE 'Catalogue seedé : 8 produits.';
END $$;

-- ---------- Carrousel ----------
INSERT INTO Carrousel (titre, description, img_url, lien_url, ordre_affichage, is_active)
SELECT * FROM (VALUES
  ('Protégez votre entreprise avec CYNA', 'Solutions SaaS de cybersécurité : SOC, EDR et XDR opérés par des experts.', 'https://placehold.co/1200x400/1f2d33/ffffff?text=CYNA', '/catalogue/1', 1, TRUE),
  ('EDR Protect : -20% sur l''abonnement annuel', 'Déployez la protection des terminaux nouvelle génération en quelques minutes.', 'https://placehold.co/1200x400/E49AB0/000000?text=EDR', '/produit/4', 2, TRUE),
  ('Nouveau : Cyna XDR Platform', 'Corrélez tous vos signaux de sécurité dans une seule console.', 'https://placehold.co/1200x400/5D737E/ffffff?text=XDR', '/produit/7', 3, TRUE)
) AS v(titre, description, img_url, lien_url, ordre_affichage, is_active)
WHERE NOT EXISTS (SELECT 1 FROM Carrousel);
