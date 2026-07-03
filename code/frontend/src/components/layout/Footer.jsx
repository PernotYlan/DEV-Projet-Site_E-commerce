import { Link } from 'react-router-dom';

/**
 * Pied de page — visible uniquement sur desktop (masqué en CSS sur mobile,
 * où son contenu est intégré au menu burger). Non fixe : défile avec la page.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grille">
        <div>
          <h4>CYNA</h4>
          <p style={{ fontSize: '0.92rem', opacity: 0.85 }}>
            Solutions SaaS de cybersécurité pour les entreprises : SOC, EDR et XDR opérés par des experts.
          </p>
        </div>
        <div>
          <h4>Informations</h4>
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/cgu">Conditions Générales d’Utilisation</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h4>Suivez-nous</h4>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://www.x.com" target="_blank" rel="noreferrer">X (Twitter)</a>
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
        </div>
      </div>
      <div className="footer-bas">© {new Date().getFullYear()} CYNA — 10 rue de Penthièvre, 75008 Paris</div>
    </footer>
  );
}
