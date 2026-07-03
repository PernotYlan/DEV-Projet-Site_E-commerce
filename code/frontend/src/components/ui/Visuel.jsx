/**
 * "Image" de produit ou catégorie : dégradé généré à partir de la couleur,
 * avec icône. Remplace les vraies images en attendant les uploads.
 * @param {{couleur: string, icone?: string, className?: string}} props
 */
export default function Visuel({ couleur = '#5D737E', icone = '🛡️', className = '', children }) {
  return (
    <div
      className={className}
      style={{ background: `linear-gradient(135deg, ${couleur} 0%, #1a2226 130%)` }}
    >
      {children || <span aria-hidden="true">{icone}</span>}
    </div>
  );
}
