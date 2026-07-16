/**
 * Graphiques SVG légers et sans dépendance pour le tableau de bord.
 * BarChart (histogramme des ventes) et PieChart (répartition par catégorie).
 */

const COULEURS = ['#E49AB0', '#5D737E', '#1f2d33', '#c97f96', '#7a93a0', '#eebbc9'];

/** Formate un montant court (ex: 1.2k). */
function court(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

/**
 * Couleur stable pour une catégorie, indépendante de l'ordre d'affichage du
 * graphique (camembert trié par total, histogramme trié alphabétiquement…) :
 * l'index de couleur est calculé sur les noms triés, pas sur l'ordre reçu.
 */
function couleurCategorie(nom, categories) {
  const triees = [...categories].sort((a, b) => a.localeCompare(b));
  return COULEURS[triees.indexOf(nom) % COULEURS.length];
}

/**
 * Histogramme vertical.
 * @param {{data: Array<{label: string, total: number}>, titre: string}} props
 */
export function BarChart({ data, titre }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const largeur = 100 / data.length;
  return (
    <div className="chart-carte">
      <h3>{titre}</h3>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 180 }} role="img" aria-label={titre}>
        {data.map((d, i) => {
          const h = (d.total / max) * 48;
          return (
            <g key={i}>
              <rect
                x={i * largeur + largeur * 0.15}
                y={52 - h}
                width={largeur * 0.7}
                height={h}
                fill="var(--noir)"
                rx="0.6"
              />
            </g>
          );
        })}
      </svg>
      <div className="chart-legende">
        {data.map((d, i) => (
          <span key={i}>
            <strong>{court(d.total)} €</strong>
            <em style={{ color: 'var(--gris)', fontStyle: 'normal' }}>
              {d.label.slice(5)}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Histogramme multi-couches (empilé) : une barre par période, divisée en
 * segments colorés par catégorie.
 * @param {{data: Array<{label: string, [categorie: string]: number}>, categories: string[], titre: string}} props
 */
export function StackedBarChart({ data, categories, titre }) {
  const totaux = data.map((d) => categories.reduce((s, c) => s + (d[c] || 0), 0));
  const max = Math.max(1, ...totaux);
  const largeur = 100 / data.length;
  return (
    <div className="chart-carte">
      <h3>{titre}</h3>
      <div className="chart-legende" style={{ marginTop: 0, marginBottom: 10 }}>
        {categories.map((cat) => (
          <span key={cat}><i style={{ background: couleurCategorie(cat, categories) }} />{cat}</span>
        ))}
      </div>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 180 }} role="img" aria-label={titre}>
        {data.map((d, i) => {
          let y = 52;
          return (
            <g key={i}>
              {categories.map((cat) => {
                const valeur = d[cat] || 0;
                const h = (valeur / max) * 48;
                y -= h;
                return (
                  <rect
                    key={cat}
                    x={i * largeur + largeur * 0.15}
                    y={y}
                    width={largeur * 0.7}
                    height={h}
                    fill={couleurCategorie(cat, categories)}
                    rx="0.4"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="chart-legende">
        {data.map((d, i) => (
          <span key={i}>
            <strong>{court(totaux[i])} €</strong>
            <em style={{ color: 'var(--gris)', fontStyle: 'normal' }}>
              {d.label.slice(5)}
            </em>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Camembert.
 * @param {{data: Array<{label: string, total: number}>, titre: string}} props
 */
export function PieChart({ data, titre }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  const noms = data.map((d) => d.label);
  let angle = -90; // départ en haut

  /** Coordonnées d'un point sur le cercle (rayon 16, centre 18,18). */
  const point = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [18 + 16 * Math.cos(rad), 18 + 16 * Math.sin(rad)];
  };

  return (
    <div className="chart-carte">
      <h3>{titre}</h3>
      {total === 0 ? (
        <p style={{ color: 'var(--gris)' }}>Aucune vente sur la période.</p>
      ) : (
        <>
          <svg viewBox="0 0 36 36" style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }} role="img" aria-label={titre}>
            {data.map((d, i) => {
              if (d.total === 0) return null;
              const part = d.total / total;
              const fin = angle + part * 360;
              const [x1, y1] = point(angle);
              const [x2, y2] = point(fin);
              const grand = part > 0.5 ? 1 : 0;
              const chemin = `M18,18 L${x1.toFixed(2)},${y1.toFixed(2)} A16,16 0 ${grand},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
              angle = fin;
              return <path key={i} d={chemin} fill={couleurCategorie(d.label, noms)} />;
            })}
          </svg>
          <div className="chart-legende">
            {data.map((d, i) => (
              <span key={i}>
                <i style={{ background: couleurCategorie(d.label, noms) }} />
                {d.label} — {total ? Math.round((d.total / total) * 100) : 0}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
