import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Visuel from '../components/ui/Visuel';
import Button from '../components/ui/Button';
import { euros } from '../components/ui/ProductCard';

/**
 * Page panier : liste des services (type d'abonnement et quantité
 * modifiables), récapitulatif HT/TVA/TTC et passage à la caisse
 * (redirige vers /login si non connecté).
 */
export default function Panier() {
  const { items, removeItem, updateItem, totalHt, tva, totalTtc } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  /** Vers le checkout, en passant par la connexion si nécessaire. */
  function passerALaCaisse() {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  }

  if (items.length === 0) {
    return (
      <div className="conteneur">
        <p className="vide">
          <span className="emoji">🛒</span>
          Votre panier est vide.
          <br />
          <Link to="/" className="btn btn-rose" style={{ marginTop: 18 }}>
            Découvrir nos services
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="conteneur">
      <h1 className="section-titre">Mon panier</h1>
      <div className="layout-panier">
        <div>
          {items.map((item) => (
            <div key={item.prix_id} className="ligne-panier">
              <Visuel couleur={item.couleur} className="ligne-panier-visuel" icone="🛡️" />
              <div>
                <strong>{item.nom}</strong>
                <div className="ligne-panier-controles">
                  <select
                    value={item.type_abonnement}
                    onChange={(e) => updateItem(item.prix_id, { type_abonnement: e.target.value })}
                    aria-label="Type d’abonnement"
                  >
                    <option value="MENSUEL">Mensuel</option>
                    <option value="SEMESTRIEL">Semestriel</option>
                    <option value="ANNUEL">Annuel</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantite}
                    onChange={(e) => updateItem(item.prix_id, { quantite: Math.max(1, Number(e.target.value)) })}
                    aria-label="Quantité"
                  />
                  <strong>{euros(item.prix_unitaire_ht * item.quantite)} HT</strong>
                  <button className="lien-supprimer" onClick={() => removeItem(item.prix_id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="recap">
          <h2 style={{ fontSize: '1.15rem', marginBottom: 10 }}>Récapitulatif</h2>
          <div className="recap-ligne"><span>Total HT</span><span>{euros(totalHt)}</span></div>
          <div className="recap-ligne"><span>TVA (20%)</span><span>{euros(tva)}</span></div>
          <div className="recap-ligne recap-total"><span>Total TTC</span><span>{euros(totalTtc)}</span></div>
          <Button variante="rose" bloc style={{ marginTop: 16 }} onClick={passerALaCaisse}>
            Passer à la caisse
          </Button>
          {!user && (
            <p style={{ fontSize: '0.85rem', color: 'var(--gris)', marginTop: 10, textAlign: 'center' }}>
              Vous devrez vous connecter pour finaliser la commande.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
