import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import { BarChart, PieChart } from '../../components/admin/Charts';
import { euros } from '../../components/ui/ProductCard';

/** Tableau de bord : cartes KPI, histogramme des ventes, camembert par catégorie. */
export default function AdminDashboard() {
  const [periode, setPeriode] = useState('7j');
  const [stats, setStats] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setStats(null);
    api.admin.dashboard(periode).then(setStats).catch(() => setErreur('Impossible de charger les statistiques.'));
  }, [periode]);

  if (erreur) return <p className="message-erreur">{erreur}</p>;
  if (!stats) return <Spinner />;

  const { kpi } = stats;
  const titreVentes = periode === '7j' ? 'Ventes des 7 derniers jours' : 'Ventes des 5 dernières semaines';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1>Tableau de bord</h1>
        <select value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Période">
          <option value="7j">7 derniers jours</option>
          <option value="5s">5 dernières semaines</option>
        </select>
      </div>

      <div className="kpi-grille">
        <div className="kpi"><div className="valeur">{euros(kpi.revenu_periode)}</div><div className="libelle">Revenu période</div></div>
        <div className="kpi"><div className="valeur">{kpi.commandes_periode}</div><div className="libelle">Commandes</div></div>
        <div className="kpi"><div className="valeur">{kpi.abonnements_actifs}</div><div className="libelle">Abonnements actifs</div></div>
        <div className="kpi"><div className="valeur">{kpi.nouveaux_utilisateurs_7j}</div><div className="libelle">Nouveaux clients (7j)</div></div>
      </div>

      <div className="admin-dashboard-charts">
        <BarChart data={stats.ventes} titre={titreVentes} />
        <PieChart data={stats.ventes_par_categorie} titre="Répartition des ventes par catégorie" />
      </div>
    </>
  );
}
