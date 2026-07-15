# Récapitulatif — Monitoring & Logs du projet e-commerce

## 1. Vue d'ensemble de la chaîne

```
┌─────────────────┐
│  App e-commerce  │  (backend, db, frontend, postgres-exporter)
│  docker-compose  │  → réseau "monitoring_net"
└────────┬─────────┘
         │
         ├── Métriques (/metrics) ──────► Prometheus ──────► Grafana
         │                                                       │
         └── Logs stdout/stderr ──► Promtail ──► Loki ───────────┘
                (via socket Docker)

Grafana = interface unique pour tout visualiser (métriques + logs)
```

Deux flux séparés mais complémentaires :
- **Métriques** (chiffres, compteurs, histogrammes) → Prometheus
- **Logs** (texte, événements) → Loki

---

## 2. Les logs collectés et leur utilité

| Source | Type de log | Utilité |
|---|---|---|
| **code-backend-1** | Logs applicatifs (requêtes HTTP, erreurs, événements métier) | Déboguer les bugs applicatifs, suivre le comportement de l'API, repérer les erreurs de paiement, tracer une requête via son `request_id` |
| **code-db-1** (PostgreSQL) | Logs de connexions, requêtes lentes, erreurs SQL | Identifier les problèmes de performance DB, détecter des tentatives de connexion suspectes |
| **code-frontend-1** | Logs du serveur web (Nginx/serveur statique) | Voir les erreurs 404/500 côté frontend, repérer un trafic anormal |
| **code-postgres-exporter-1** | Logs internes de l'exporter | Vérifier que la collecte de métriques DB fonctionne correctement |

### Pourquoi centraliser les logs plutôt que faire du `docker logs` à la main ?
- Recherche transversale sur tous les conteneurs en une seule requête
- Historique conservé même si un conteneur redémarre ou est supprimé
- Corrélation possible avec les métriques (ex: pic d'erreurs 500 au moment où `payment_errors_total` augmente)
- Base pour un futur système d'alerte (ex: alerte si le mot "ERROR" apparaît trop souvent)

---

## 3. La chaîne technique — comment les logs sont envoyés et reçus

### Étape 1 — Génération
Chaque conteneur applicatif écrit ses logs sur **stdout/stderr** (bonne pratique Docker : pas de fichier de log local, tout sort sur la sortie standard). Le backend est configuré pour produire des logs en **JSON structuré** (timestamp, niveau, message, request_id).

### Étape 2 — Collecte (Promtail)
**Promtail** est un agent qui tourne dans son propre conteneur, sur le réseau `monitoring_net`. Il :
- Se connecte au **socket Docker** (`/var/run/docker.sock`) monté en lecture seule
- Découvre automatiquement tous les conteneurs actifs (`docker_sd_configs`)
- Lit leurs logs directement depuis `/var/lib/docker/containers` (monté en lecture seule)
- Ajoute des labels utiles (nom du conteneur, stream stdout/stderr)

### Étape 3 — Transport
Promtail pousse les logs collectés vers **Loki** via une requête HTTP (`http://loki:3100/loki/api/v1/push`), en interne sur le réseau Docker `monitoring_net` — aucun trafic ne sort vers l'extérieur.

### Étape 4 — Stockage et indexation (Loki)
**Loki** stocke les logs mais, contrairement à Elasticsearch, n'indexe que les **labels** (nom du conteneur, niveau, etc.), pas le texte complet. Ça le rend beaucoup plus léger en ressources — adapté à un usage local/petit projet.

### Étape 5 — Visualisation (Grafana)
**Grafana** interroge Loki à la demande (langage de requête **LogQL**) pour afficher les logs dans l'interface, filtrer par conteneur, corréler avec les graphiques de métriques Prometheus sur le même dashboard.

---

## 4. Tableau récapitulatif des composants

| Composant | Rôle | Port |
|---|---|---|
| **Promtail** | Agent de collecte des logs (lit Docker, envoie à Loki) | 9080 (interne) |
| **Loki** | Base de stockage/indexation des logs | 3100 |
| **Prometheus** | Base de stockage des métriques (scrape /metrics) | 9090 |
| **Node Exporter** | Expose les métriques système de la machine hôte | 9100 |
| **Postgres Exporter** | Expose les métriques de la base PostgreSQL | 9187 |
| **Grafana** | Interface unique de visualisation (logs + métriques) | 3000 |

---

## 5. Schéma réseau Docker

Deux `docker-compose.yml` distincts, reliés par un réseau externe partagé :

- `~/monitoring/docker-compose.yml` → Prometheus, Grafana, Loki, Promtail, Node Exporter
- `~/code/docker-compose.yml` (projet e-commerce) → backend, db, frontend, postgres-exporter

Le lien entre les deux se fait via le réseau Docker **`monitoring_net`** (créé manuellement avec `docker network create monitoring_net`), sur lequel les deux stacks sont connectées. Cela permet à Prometheus de scraper `app-backend:9464/metrics` et à Promtail de lire les logs des conteneurs applicatifs, sans exposer ces flux en dehors de la machine.

---

## 6. Points de vigilance sécurité (DevSecOps)

- Le socket Docker (`/var/run/docker.sock`) donné à Promtail est monté en **lecture seule** — Promtail ne doit jamais avoir de droits d'écriture dessus
- Les logs applicatifs ne doivent **jamais contenir** : numéros de carte bancaire, mots de passe, tokens JWT/session complets (masquage appliqué côté code, ex: `card_last4`)
- Grafana/Prometheus/Loki ne sont accessibles qu'en local (`localhost`) pour l'instant — à sécuriser (auth, reverse proxy HTTPS) avant tout déploiement en dehors du poste de dev
- Prévoir une politique de rétention des logs (Loki n'en a pas par défaut en config simple) pour éviter une croissance illimitée du volume disque
