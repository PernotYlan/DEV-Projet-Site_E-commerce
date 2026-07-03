import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, MOCK } from '../api';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import PaiementStripe from '../components/checkout/PaiementStripe';
import { euros } from '../components/ui/ProductCard';

/** Formulaire vierge pour une nouvelle adresse. */
const ADRESSE_VIDE = {
  prenom: '', nom: '', adresse_ligne1: '', adresse_ligne2: '',
  ville: '', region: '', code_postal: '', pays: 'France',
};

/**
 * Checkout en 3 étapes : adresse de facturation → paiement → récapitulatif.
 * Mode API réelle : le paiement est confirmé via Stripe (CardElement +
 * confirmCardPayment). Mode démo : le paiement est simulé.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalHt, tva, totalTtc, clearCart } = useCart();

  const [etape, setEtape] = useState(1);
  const [adresses, setAdresses] = useState(null);
  const [cartes, setCartes] = useState(null);
  const [adresseChoisie, setAdresseChoisie] = useState(null);
  const [carteChoisie, setCarteChoisie] = useState(null);
  const [nouvelleAdresse, setNouvelleAdresse] = useState(null); // null = liste, objet = formulaire
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  // Charge adresses et cartes enregistrées
  useEffect(() => {
    Promise.all([api.adresses(), api.paiements()])
      .then(([listeAdresses, listeCartes]) => {
        setAdresses(listeAdresses);
        setCartes(listeCartes);
        setAdresseChoisie(listeAdresses.find((a) => a.est_defaut) || listeAdresses[0] || null);
        setCarteChoisie(listeCartes.find((c) => c.est_defaut) || listeCartes[0] || null);
      })
      .catch(() => setErreur('Impossible de charger vos informations.'));
  }, []);

  // Panier vide → retour
  useEffect(() => {
    if (items.length === 0 && !enCours) navigate('/panier');
  }, [items, enCours, navigate]);

  /** Enregistre la nouvelle adresse saisie puis la sélectionne. */
  async function enregistrerAdresse(e) {
    e.preventDefault();
    try {
      const creee = await api.creerAdresse(nouvelleAdresse);
      setAdresses([...adresses, creee]);
      setAdresseChoisie(creee);
      setNouvelleAdresse(null);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur lors de l’enregistrement de l’adresse.');
    }
  }

  /** Construit le corps de la commande envoyé à l'API (superset mock + réel). */
  function construireCommande() {
    return {
      adresse_id: adresseChoisie.id,
      methode_paiement_id: carteChoisie?.id,
      items: items.map((i) => ({
        produit_id: i.produit_id,
        prix_id: i.prix_id,
        quantite: i.quantite,
        nom: i.nom,
        type_abonnement: i.type_abonnement,
        prix_unitaire_ht: i.prix_unitaire_ht,
      })),
      adresse: adresseChoisie,
      carte: carteChoisie,
    };
  }

  /** Succès du paiement : vide le panier et redirige vers la confirmation. */
  function onSucces(commandeId) {
    clearCart();
    navigate(`/confirmation/${commandeId}`);
  }

  /** Confirme la commande en mode démo (paiement simulé). */
  async function confirmerAchatMock() {
    setEnCours(true);
    setErreur('');
    try {
      const { commande_id } = await api.creerCommande(construireCommande());
      onSucces(commande_id);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Le paiement a échoué. Veuillez réessayer.');
      setEnCours(false);
    }
  }

  if (!adresses || !cartes) return <Spinner />;

  return (
    <div className="conteneur" style={{ maxWidth: 760 }}>
      <h1 className="section-titre">Finaliser ma commande</h1>

      {/* Indicateur de progression */}
      <div className="etapes">
        <div className={`etape ${etape === 1 ? 'active' : etape > 1 ? 'faite' : ''}`} data-num="1">Adresse</div>
        <div className={`etape ${etape === 2 ? 'active' : etape > 2 ? 'faite' : ''}`} data-num="2">Paiement</div>
        <div className={`etape ${etape === 3 ? 'active' : ''}`} data-num="3">Confirmation</div>
      </div>

      {erreur && <p className="message-erreur">{erreur}</p>}

      {/* ----- Étape 1 : adresse de facturation ----- */}
      {etape === 1 && (
        <div className="carte-bloc">
          <h2>Adresse de facturation</h2>

          {nouvelleAdresse === null ? (
            <>
              {adresses.map((adresse) => (
                <button
                  key={adresse.id}
                  className={`carte-choix ${adresseChoisie?.id === adresse.id ? 'choisi' : ''}`}
                  onClick={() => setAdresseChoisie(adresse)}
                >
                  <strong>{adresse.prenom} {adresse.nom}</strong>
                  {adresse.est_defaut && <span className="badge badge-rose" style={{ marginLeft: 8 }}>Par défaut</span>}
                  <br />
                  {adresse.adresse_ligne1}{adresse.adresse_ligne2 ? `, ${adresse.adresse_ligne2}` : ''}
                  <br />
                  {adresse.code_postal} {adresse.ville}, {adresse.pays}
                </button>
              ))}
              {adresses.length === 0 && <p style={{ color: 'var(--gris)' }}>Aucune adresse enregistrée.</p>}
              <Button variante="contour" petit onClick={() => setNouvelleAdresse(ADRESSE_VIDE)}>
                + Nouvelle adresse
              </Button>
              <div className="modal-actions">
                <Button variante="rose" disabled={!adresseChoisie} onClick={() => setEtape(2)}>
                  Continuer
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={enregistrerAdresse}>
              <div className="groupe-2">
                <Input label="Prénom" required value={nouvelleAdresse.prenom}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, prenom: e.target.value })} />
                <Input label="Nom" required value={nouvelleAdresse.nom}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, nom: e.target.value })} />
              </div>
              <Input label="Adresse" required value={nouvelleAdresse.adresse_ligne1}
                onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, adresse_ligne1: e.target.value })} />
              <Input label="Complément d’adresse (optionnel)" value={nouvelleAdresse.adresse_ligne2}
                onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, adresse_ligne2: e.target.value })} />
              <div className="groupe-2">
                <Input label="Ville" required value={nouvelleAdresse.ville}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, ville: e.target.value })} />
                <Input label="Région (optionnel)" value={nouvelleAdresse.region}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, region: e.target.value })} />
              </div>
              <div className="groupe-2">
                <Input label="Code postal" required value={nouvelleAdresse.code_postal}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, code_postal: e.target.value })} />
                <Input label="Pays" required value={nouvelleAdresse.pays}
                  onChange={(e) => setNouvelleAdresse({ ...nouvelleAdresse, pays: e.target.value })} />
              </div>
              <div className="modal-actions">
                <Button type="button" variante="contour" onClick={() => setNouvelleAdresse(null)}>Annuler</Button>
                <Button type="submit" variante="rose">Enregistrer</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ----- Étape 2 : paiement ----- */}
      {etape === 2 && (
        <div className="carte-bloc">
          <h2>Méthode de paiement</h2>
          {cartes.map((carte) => (
            <button
              key={carte.id}
              className={`carte-choix ${carteChoisie?.id === carte.id ? 'choisi' : ''}`}
              onClick={() => setCarteChoisie(carte)}
            >
              💳 •••• •••• •••• {carte.derniers_quatre_chiffres}
              <span style={{ color: 'var(--gris)', marginLeft: 10 }}>
                exp. {String(carte.mois_expiration).padStart(2, '0')}/{carte.annee_expiration}
              </span>
              {carte.est_defaut && <span className="badge badge-rose" style={{ marginLeft: 8 }}>Par défaut</span>}
            </button>
          ))}
          <p className="message-info">
            {MOCK
              ? 'Mode démo : sélectionnez une carte enregistrée (le paiement est simulé).'
              : 'Vous saisirez votre carte bancaire de façon sécurisée (Stripe) à l’étape suivante.'}
          </p>
          <div className="modal-actions">
            <Button variante="contour" onClick={() => setEtape(1)}>Retour</Button>
            <Button variante="rose" disabled={MOCK && !carteChoisie} onClick={() => setEtape(3)}>Continuer</Button>
          </div>
        </div>
      )}

      {/* ----- Étape 3 : récapitulatif + paiement ----- */}
      {etape === 3 && (
        <div className="carte-bloc">
          <h2>Récapitulatif</h2>
          {items.map((item) => (
            <div key={item.prix_id} className="recap-ligne">
              <span>
                {item.nom} × {item.quantite} <em style={{ color: 'var(--gris)' }}>({item.type_abonnement.toLowerCase()})</em>
              </span>
              <span>{euros(item.prix_unitaire_ht * item.quantite)}</span>
            </div>
          ))}
          <div className="recap-ligne" style={{ marginTop: 10 }}><span>Total HT</span><span>{euros(totalHt)}</span></div>
          <div className="recap-ligne"><span>TVA (20%)</span><span>{euros(tva)}</span></div>
          <div className="recap-ligne recap-total"><span>Total TTC</span><span>{euros(totalTtc)}</span></div>

          <h3>Facturation</h3>
          <p style={{ fontSize: '0.93rem' }}>
            {adresseChoisie.prenom} {adresseChoisie.nom} — {adresseChoisie.adresse_ligne1},{' '}
            {adresseChoisie.code_postal} {adresseChoisie.ville}, {adresseChoisie.pays}
            {MOCK && carteChoisie && (
              <>
                <br />💳 Carte se terminant par {carteChoisie.derniers_quatre_chiffres}
              </>
            )}
          </p>

          {/* Paiement : Stripe en mode réel, simulé en mode démo */}
          {MOCK ? (
            <div className="modal-actions">
              <Button variante="contour" onClick={() => setEtape(2)} disabled={enCours}>Retour</Button>
              <Button variante="rose" onClick={confirmerAchatMock} disabled={enCours}>
                {enCours ? 'Paiement en cours…' : 'Confirmer l’achat'}
              </Button>
            </div>
          ) : (
            <PaiementStripe
              construireCommande={construireCommande}
              titulaire={`${adresseChoisie.prenom} ${adresseChoisie.nom}`}
              onSucces={onSucces}
              onRetour={() => setEtape(2)}
            />
          )}
        </div>
      )}
    </div>
  );
}
