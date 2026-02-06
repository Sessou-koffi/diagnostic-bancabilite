# 📊 Documentation Technique - Outil de Diagnostic de Bancabilité

## Table des matières
1. [Présentation du projet](#présentation-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Installation et déploiement](#installation-et-déploiement)
4. [Configuration N8N](#configuration-n8n)
5. [Guide d'utilisation](#guide-dutilisation)
6. [Logique métier et scoring](#logique-métier-et-scoring)
7. [Personnalisation](#personnalisation)
8. [Maintenance](#maintenance)

---

## 1. Présentation du projet

### 1.1 Objectif
Cet outil permet aux dirigeants d'entreprises de réaliser une auto-évaluation préliminaire de leur bancabilité pour une demande d'**Avance sur Marché**. Il sert de Lead Magnet pour générer et qualifier des prospects pour un cabinet d'Intermédiation en Opérations de Banque (IOB).

### 1.2 Fonctionnalités principales
- ✅ Formulaire multi-étapes intuitif
- ✅ Calcul automatique des ratios financiers
- ✅ Scoring sur 6 dimensions d'analyse
- ✅ Diagnostic instantané (Feu Vert/Orange/Rouge)
- ✅ Collecte de leads avec coordonnées
- ✅ Intégration N8N pour CRM et emailing
- ✅ Design responsive et professionnel

### 1.3 Structure du projet
```
diagnostic-bancabilite/
├── index.html              # Page principale
├── css/
│   └── styles.css          # Styles CSS complets
├── js/
│   ├── main.js             # Logique interface utilisateur
│   └── scoring-engine.js   # Moteur de calcul métier
├── n8n/
│   └── workflow-diagnostic-bancabilite.json  # Workflow N8N
└── README.md               # Cette documentation
```

---

## 2. Architecture technique

### 2.1 Stack technologique
| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | HTML5, CSS3, JavaScript vanilla | Interface utilisateur |
| Styling | CSS moderne (Variables, Flexbox, Grid) | Design responsive |
| Icônes | Font Awesome 6 | Iconographie |
| Police | Inter (Google Fonts) | Typographie |
| Backend | N8N (No-Code) | Automatisation et intégrations |
| Communication | Webhook HTTP POST | Liaison Front-Back |

### 2.2 Diagramme d'architecture
```
┌─────────────────────┐     HTTP POST      ┌─────────────────────┐
│                     │ ─────────────────► │                     │
│   Frontend Web      │                    │       N8N           │
│   (HTML/CSS/JS)     │                    │   (Automatisation)  │
│                     │ ◄───────────────── │                     │
└─────────────────────┘     JSON Response  └─────────────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                              ┌──────────┐    ┌──────────┐    ┌──────────┐
                              │   CRM    │    │  Email   │    │  Sheets  │
                              │ HubSpot  │    │  SMTP    │    │  Backup  │
                              └──────────┘    └──────────┘    └──────────┘
```

---

## 3. Installation et déploiement

### 3.1 Prérequis
- Serveur web (Apache, Nginx) ou hébergement statique
- Instance N8N (self-hosted ou cloud)
- Compte CRM (HubSpot, Pipedrive, ou autre)
- Serveur SMTP pour l'envoi d'emails

### 3.2 Déploiement du Frontend

#### Option A : Hébergement statique (recommandé)
1. **Netlify / Vercel**
   ```bash
   # Installer Netlify CLI
   npm install -g netlify-cli
   
   # Déployer
   cd diagnostic-bancabilite
   netlify deploy --prod
   ```

2. **GitHub Pages**
   - Pusher le code sur un repo GitHub
   - Activer GitHub Pages dans Settings > Pages
   - Sélectionner la branche `main`

#### Option B : Serveur web traditionnel
```bash
# Copier les fichiers sur le serveur
scp -r diagnostic-bancabilite/* user@server:/var/www/html/diagnostic/

# Configurer les droits
chmod -R 755 /var/www/html/diagnostic/
```

#### Option C : Intégration iframe
```html
<!-- Sur votre site existant -->
<iframe 
    src="https://votre-domaine.com/diagnostic/" 
    width="100%" 
    height="800px" 
    frameborder="0">
</iframe>
```

### 3.3 Configuration du Webhook
Dans le fichier `js/main.js`, remplacer l'URL du webhook :
```javascript
const CONFIG = {
    webhookUrl: 'https://votre-instance-n8n.com/webhook/diagnostic-bancabilite',
    // ...
};
```

---

## 4. Configuration N8N

### 4.1 Import du workflow
1. Ouvrir N8N
2. Aller dans **Workflows** > **Import from File**
3. Sélectionner `n8n/workflow-diagnostic-bancabilite.json`
4. Configurer les credentials

### 4.2 Configuration des credentials

#### SMTP (Email)
```
Host: smtp.votrefournisseur.com
Port: 587
User: votre-email@domaine.com
Password: ••••••••
SSL/TLS: STARTTLS
```

#### CRM (HubSpot exemple)
```
API Key: votre-cle-api-hubspot
```

#### Google Sheets
1. Créer un projet Google Cloud
2. Activer l'API Sheets
3. Créer des identifiants OAuth 2.0
4. Autoriser N8N

### 4.3 Structure du Google Sheet
Créer un sheet avec les colonnes suivantes :
| Date | Email | Téléphone | Entreprise | Dirigeant | Secteur | Montant Marché | Montant Demandé | Score | Pourcentage | Diagnostic | Priorité | Lead Qualifié | Statut |

### 4.4 Activation du workflow
1. Vérifier toutes les connexions
2. Tester avec des données fictives
3. Activer le workflow (toggle ON)
4. Copier l'URL du webhook

---

## 5. Guide d'utilisation

### 5.1 Parcours utilisateur
1. **Accueil** : Présentation de l'outil et CTA
2. **Étape 1** : Informations entreprise
3. **Étape 2** : Détails du marché
4. **Étape 3** : Références techniques
5. **Étape 4** : Structure de financement
6. **Étape 5** : Situation financière (bilans)
7. **Étape 6** : Endettement bancaire
8. **Étape 7** : Garanties + Coordonnées
9. **Résultats** : Diagnostic complet

### 5.2 Données collectées
| Catégorie | Champs |
|-----------|--------|
| Entreprise | Raison sociale, RCCM, Secteur, Date création, Dirigeant |
| Marché | Objet, Montant HT/TTC, Dates, Maître d'ouvrage, Clauses |
| Références | Jusqu'à 5 références avec montants et types clients |
| Financement | Montant demandé, Charges prévues, Apport |
| Finances | CA, Résultat net, EBE, Capitaux propres, Dettes... (3 années) |
| Endettement | Crédits, Cautions, Lignes autorisées, Impayés |
| Garanties | Institutionnelle (O/N), Hypothécaire (valeur) |
| Contact | Email, Téléphone, Consentement |

---

## 6. Logique métier et scoring

### 6.1 Taux de consommation du délai
```
TCD = (Date du jour - Date OS) / (Date fin prévue - Date OS)
```

| Taux | Catégorie | Signal | Points |
|------|-----------|--------|--------|
| 0-20% | Démarrage | VERT | 10 |
| 20-60% | Croisière | JAUNE | 7 |
| 60-90% | Fin de chantier | ORANGE | 3 |
| >90% | Hors délai | ROUGE | 0 |

### 6.2 Capacité technique (20 points max)

#### A. Expérience technique (7 points)
```
Ratio = Montant plus gros marché réalisé / Montant marché actuel
```
- Ratio ≥ 0.8 → 7 pts (Maîtrise totale)
- Ratio 0.4-0.8 → 4 pts (Challenge maîtrisé)
- Ratio < 0.4 → 1 pt (Saut d'échelle risqué)

#### B. Puissance de structure (7 points)
```
Indice = Montant marché actuel / Moyenne marchés exécutés
```
- Indice ≤ 1.5 → 7 pts (Structure solide)
- Indice 1.5-3 → 4 pts (Tension sur les ressources)
- Indice > 3 → 0 pt (Risque de faillite opérationnelle)

#### C. Qualité historique clients (6 points)
- Au moins 1 client public/grand groupe → 6 pts
- Uniquement privés/particuliers → 1 pt

### 6.3 Marge bénéficiaire
```
Marge = Montant HT - (Achats + Main d'œuvre + Impôts)
Taux = Marge / Montant HT × 100
```
- Taux ≥ 20% → VERT (15 pts)
- Taux 10-20% → JAUNE (10 pts)
- Taux 0-10% → ORANGE (5 pts)
- Taux < 0% → ROUGE (0 pts)

### 6.4 Ratios financiers
| Ratio | Formule | Norme |
|-------|---------|-------|
| CAF | Résultat Net + Dotations Amort | > 0 |
| Autonomie financière | Capitaux Propres / Total Bilan | > 20% |
| Capacité remboursement | Dettes Financières / CAF | < 4 |
| Rentabilité | EBE / CA | > 0 |
| Liquidité générale | Actif Circulant / Passif Circulant | > 1 |
| Trésorerie nette | Trésorerie Actif - Trésorerie Passif | > 0 |

### 6.5 Garantie hypothécaire
```
Ratio = Valeur bien / Montant demandé × 100
```
- Ratio ≥ 120% → Conforme (10 pts)
- Ratio 100-119% → Partielle (7 pts)
- Ratio < 100% → Insuffisante (3 pts)

### 6.6 Score global et diagnostic final

#### Pondération (100 points max)
| Dimension | Points max |
|-----------|------------|
| Délai | 10 |
| Maître d'ouvrage | 10 |
| Capacité technique | 20 |
| Marge | 15 |
| Ratios financiers | 20 |
| Endettement | 15 |
| Garanties | 10 |

#### Verdict final
| Score | Diagnostic | Action |
|-------|------------|--------|
| ≥ 70% | FEU VERT | Dossier favorable, déposer en banque |
| 50-69% | FEU ORANGE | Points à améliorer, accompagnement conseillé |
| < 50% | FEU ROUGE | Faiblesses significatives, diagnostic IOB recommandé |

---

## 7. Personnalisation

### 7.1 Modifier les couleurs
Dans `css/styles.css`, ajuster les variables :
```css
:root {
    --primary-color: #2563eb;    /* Bleu principal */
    --success-color: #10b981;    /* Vert */
    --warning-color: #f59e0b;    /* Orange */
    --danger-color: #ef4444;     /* Rouge */
}
```

### 7.2 Modifier les textes
- **Hero** : Dans `index.html`, section `.hero`
- **CTA** : Rechercher `Prendre rendez-vous` et modifier
- **Emails** : Dans le workflow N8N, modifier les templates HTML

### 7.3 Ajouter des champs
1. Ajouter le HTML dans la section appropriée
2. Mettre à jour la logique dans `scoring-engine.js`
3. Adapter le traitement N8N

### 7.4 Modifier les seuils de scoring
Dans `js/scoring-engine.js`, modifier l'objet `config` :
```javascript
config: {
    delaiConsommation: {
        demarrage: { min: 0, max: 0.20, ... },
        // Modifier les seuils ici
    },
    // ...
}
```

---

## 8. Maintenance

### 8.1 Logs et monitoring
- **N8N** : Historique des exécutions dans l'interface
- **Google Sheets** : Archive de tous les leads
- **Console navigateur** : Erreurs JavaScript

### 8.2 Mises à jour
```bash
# Sauvegarder avant modification
cp -r diagnostic-bancabilite/ diagnostic-bancabilite-backup/

# Appliquer les modifications
# Tester en local
# Déployer
```

### 8.3 Support
En cas de problème :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs N8N
3. Tester le webhook avec Postman/curl

### 8.4 Checklist de déploiement
- [ ] Fichiers uploadés sur le serveur
- [ ] URL webhook configurée dans main.js
- [ ] Workflow N8N importé et activé
- [ ] Credentials CRM configurés
- [ ] Credentials SMTP configurés
- [ ] Google Sheet créé et lié
- [ ] Test complet du formulaire
- [ ] Vérification réception email client
- [ ] Vérification réception notification équipe
- [ ] Vérification enregistrement CRM
- [ ] Vérification backup Google Sheets

---

## Annexes

### A. Exemple de payload webhook
```json
{
  "timestamp": "2026-02-06T10:30:00.000Z",
  "formData": {
    "raisonSociale": "ENTREPRISE EXEMPLE SARL",
    "email": "contact@exemple.com",
    "montantHT": 50000000,
    "montantDemande": 25000000
  },
  "analyses": {
    "delai": { "taux": 0.15, "signal": "VERT" },
    "capaciteTechnique": { "scoreTotal": 16 },
    "marge": { "tauxMarge": 22.5 }
  },
  "scoreGlobal": {
    "scoreTotal": 75,
    "pourcentage": 75,
    "diagnostic": { "label": "FEU VERT", "signal": "VERT" }
  }
}
```

### B. Commandes utiles
```bash
# Tester le webhook
curl -X POST https://votre-n8n.com/webhook/diagnostic-bancabilite \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Minifier le CSS (optionnel)
npx csso css/styles.css -o css/styles.min.css

# Vérifier la syntaxe JS
npx eslint js/*.js
```

---

**Version** : 1.0.0  
**Date** : 6 février 2026  
**Auteur** : DiagBancabilité Team
