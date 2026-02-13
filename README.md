# FreelanceBoard

Outil de suivi freelance pour artiste-auteur. Néo-brutaliste, chaud, rétro et fun.

## Déploiement sur GitHub Pages

### 1. Créer le repo GitHub

1. Va sur [github.com/new](https://github.com/new)
2. Nom du repo : `freelanceboard` (ou ce que tu veux)
3. Coche **Public** (requis pour GitHub Pages gratuit)
4. Clique **Create repository**

### 2. Uploader le fichier

**Option A — Via l'interface web GitHub (le plus simple) :**

1. Dans ton repo vide, clique **"uploading an existing file"**
2. Drag & drop le fichier `index.html`
3. Commit message : `Initial commit`
4. Clique **Commit changes**

**Option B — En ligne de commande :**

```bash
git clone https://github.com/TON_USER/freelanceboard.git
cd freelanceboard
# Copie index.html dans ce dossier
git add index.html
git commit -m "Initial commit"
git push origin main
```

### 3. Activer GitHub Pages

1. Va dans **Settings** > **Pages** (menu latéral gauche)
2. Source : **Deploy from a branch**
3. Branch : **main** / dossier **(root)**
4. Clique **Save**
5. Attends ~1 minute, refresh la page
6. Tu verras l'URL : `https://TON_USER.github.io/freelanceboard/`

C'est en ligne !

---

## Utilisation

### Créer un job
- Va dans l'onglet **Jobs** > **Nouveau job**
- Remplis le nom, client, tarif (journalier ou forfait), devise, statut
- Choisis une couleur

### Pointer des jours
- Va dans **Calendrier**
- Dans le panneau **Mode peinture**, sélectionne un job
- Choisis la période : Journée / Matin / Après-midi
- Clique sur les jours du calendrier pour les assigner

### Suivre les finances
- Va dans **Résumé**
- 3 niveaux de CA : Réalisé (payé + terminé) / Sécurisé (+ en cours + confirmé) / Pipeline (+ prospects)
- Le taux d'occupation et le TJM moyen sont calculés hors prospects

### Pipeline de statuts
```
Prospect → Confirmé → En cours → Terminé → Facturé → Payé
```

---

## Données

Les données sont stockées dans le **localStorage** de ton navigateur. Elles persistent entre les sessions mais :
- Elles sont liées au navigateur (pas de sync entre appareils)
- Elles sont supprimées si tu vides le cache/données du navigateur
- Elles ne sont pas sauvegardées automatiquement en ligne

### Exporter / Importer (backup manuel)

Ouvre la console du navigateur (F12) et :

**Exporter :**
```javascript
const backup = {
  jobs: JSON.parse(localStorage.getItem('fb_jobs') || '[]'),
  entries: JSON.parse(localStorage.getItem('fb_entries') || '[]'),
  settings: JSON.parse(localStorage.getItem('fb_settings') || '{}')
};
const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
a.download = `freelanceboard-backup-${new Date().toISOString().slice(0,10)}.json`;
a.click();
```

**Importer :**
```javascript
const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
input.onchange = async (e) => {
  const text = await e.target.files[0].text();
  const data = JSON.parse(text);
  if(data.jobs) localStorage.setItem('fb_jobs', JSON.stringify(data.jobs));
  if(data.entries) localStorage.setItem('fb_entries', JSON.stringify(data.entries));
  if(data.settings) localStorage.setItem('fb_settings', JSON.stringify(data.settings));
  location.reload();
};
input.click();
```

---

## Google Sheets Sync (optionnel, pour plus tard)

Si tu veux ajouter la synchronisation Google Sheets :

### 1. Créer le Google Sheet

1. Va sur [sheets.google.com](https://sheets.google.com) > Nouveau
2. Renomme-le **FreelanceBoard Data**
3. Crée 3 onglets : `Jobs`, `Calendar`, `Settings`

### 2. Déployer le Google Apps Script

1. Dans le Google Sheet : **Extensions** > **Apps Script**
2. Colle le code du fichier `apps-script.gs` (fourni séparément si besoin)
3. **Déployer** > **Nouveau déploiement** > Type **Application Web**
4. Accès : **Tout le monde**
5. Copie l'URL générée
6. Colle-la dans **Réglages** > **URL de l'Apps Script** dans FreelanceBoard

---

## Stack technique

- **React 18** (CDN, pas de build)
- **Lucide React** (icônes flat)
- **Babel Standalone** (compilation JSX dans le navigateur)
- **Google Fonts** : Space Mono + DM Sans
- **localStorage** pour la persistance
- **frankfurter.app** pour les taux de change EUR
- **Aucune dépendance serveur** — 100% statique

## Fichier unique

Tout est dans `index.html`. Pas de build, pas de node_modules, pas de bundler. Tu ouvres le fichier dans un navigateur et ça marche.
