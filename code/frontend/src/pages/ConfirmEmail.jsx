import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/ui/Spinner';

/** Page appelée depuis le lien email : confirme l'inscription au chargement. */
export default function ConfirmEmail() {
  const [params] = useSearchParams();
  const [statut, setStatut] = useState('chargement'); // chargement | succes | erreur

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatut('erreur');
      return;
    }
    api
      .confirmEmail(token)
      .then(() => setStatut('succes'))
      .catch(() => setStatut('erreur'));
  }, [params]);

  return (
    <div className="conteneur">
      <div className="carte-auth" style={{ textAlign: 'center' }}>
        {statut === 'chargement' && <Spinner />}
        {statut === 'succes' && (
          <>
            <span style={{ fontSize: '3rem' }}>✅</span>
            <h1>Email confirmé !</h1>
            <p>Votre compte est activé, vous pouvez maintenant vous connecter.</p>
            <Link to="/login" className="btn btn-rose" style={{ marginTop: 16 }}>Se connecter</Link>
          </>
        )}
        {statut === 'erreur' && (
          <>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <h1>Lien invalide ou expiré</h1>
            <p>Le lien de confirmation n’est plus valable. Inscrivez-vous à nouveau ou contactez-nous.</p>
            <Link to="/register" className="btn btn-contour" style={{ marginTop: 16 }}>Retour à l’inscription</Link>
          </>
        )}
      </div>
    </div>
  );
}
