# 📖 Guide d'Utilisation Détaillé - Chatbot Multi-Provider

## 🎯 Sommaire

1. [Installation étape par étape](#installation)
2. [Mode CLI](#mode-cli)
3. [Mode API](#mode-api)
4. [Exemples pratiques](#exemples)
5. [FAQ & Dépannage](#faq)

---

## Installation

### Étape 1 : Obtenir les API Keys

#### Mistral AI
1. Aller sur https://console.mistral.ai/keys
2. Se connecter / Créer un compte
3. Générer une nouvelle clé
4. Copier la clé

#### Groq Cloud (Gratuit!)
1. Aller sur https://console.groq.com/keys
2. Se connecter / Créer un compte
3. Générer une nouvelle clé
4. Copier la clé

#### HuggingFace (Gratuit!)
1. Aller sur https://huggingface.co/settings/tokens
2. Se connecter / Créer un compte
3. Créer un token d'accès
4. Copier le token

### Étape 2 : Configurer le projet

```bash
# 1. Cloner le repository
git clone https://github.com/MellGitson/ChatBot.git
cd ChatBot

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cat > .env << EOF
MISTRAL_API_KEY=votre_cle_mistral
GROQ_API_KEY=votre_cle_groq
HUGGINGFACE_TOKEN=votre_token_huggingface
EOF

# 4. Vérifier que .env existe
ls -la .env
```

✅ **Installation complète!**

---

## Mode CLI

### Démarrer le chatbot

```bash
npm start
```

Vous verrez:
```
📱 Chatbot CLI - Phase 1-7
🔌 Provider: mistral
📌 Tapez vos questions (ou /help pour les commandes)

>
```

### Commandes disponibles

| Commande | Fonction | Exemple |
|----------|----------|---------|
| `/history` | Voir tous les messages | `/history` |
| `/provider` | Voir le provider actuel | `/provider` |
| `/provider groq` | Changer de provider | `/provider groq` |
| `/metrics` | Afficher coûts et tokens | `/metrics` |
| `/resume` | Résumer la conversation | `/resume` |
| `/translate en` | Traduire en anglais | `/translate en` |
| `/clear` | Effacer l'historique | `/clear` |
| `exit` | Quitter | `exit` |

### Exemple de session complète

```bash
$ npm start

> Bonjour, qui es-tu?
Je suis Claude, un assistant IA créé par Anthropic...

> /metrics
📊 Métriques de session:
   ✓ Tokens totaux: 234
   ✓ Coût total: $0.000089
   ✓ Latence: 2345ms
   ✓ Requêtes: 1

> /provider groq
✓ Provider changé vers Groq

> Explique-moi la mécanique quantique
[Réponse de Groq...]

> /resume
📌 Résumé:
   1. L'utilisateur se présente au bot
   2. Discussion sur l'identité du bot
   3. Changement vers Groq provider
   4. Question sur la mécanique quantique
   5. Résumé généré avec Groq

> /translate es
[Traduction en espagnol de la dernière réponse]

> exit
Au revoir! 👋
```

---

## Mode API

### Démarrer le serveur

```bash
# Développement (auto-reload si modifications)
npm run api:dev

# Production
npm run api
```

Vous verrez:
```
🚀 Chatbot API - Phase 8 + Phase 9
📍 Serveur démarré sur http://localhost:3000

📚 Routes disponibles:
  GET  /chat?q=...&provider=mistral&client_id=...
  GET  /history?client_id=...
  GET  /metrics?client_id=...
  GET  /providers
  GET  /export/pdf?client_id=...
  DELETE /history?client_id=...
  GET  /health
```

### Routes détaillées

#### 1. Envoyer un message `/chat`

```bash
# Format simple
curl 'http://localhost:3000/chat?q=Bonjour'

# Avec provider spécifique
curl 'http://localhost:3000/chat?q=Pourquoi+le+ciel+est+bleu&provider=groq'

# Avec session client
curl 'http://localhost:3000/chat?q=Je+suis+Alice&client_id=alice'

# Avec tous les paramètres
curl 'http://localhost:3000/chat?q=Quelles+sont+tes+capabilities&provider=mistral&client_id=alice'
```

**Réponse:**
```json
{
  "reply": "Bonjour! Comment puis-je t'aider aujourd'hui?",
  "provider": "mistral",
  "tokens": 156
}
```

#### 2. Voir l'historique `/history`

```bash
# Session par défaut
curl 'http://localhost:3000/history'

# Session spécifique
curl 'http://localhost:3000/history?client_id=alice'
```

**Réponse:**
```json
{
  "history": [
    {
      "role": "system",
      "content": "Tu es un assistant utile..."
    },
    {
      "role": "user",
      "content": "Bonjour"
    },
    {
      "role": "assistant",
      "content": "Bonjour! Comment puis-je t'aider?"
    }
  ],
  "count": 3,
  "clientId": "alice"
}
```

#### 3. Voir les métriques `/metrics`

```bash
curl 'http://localhost:3000/metrics?client_id=alice'
```

**Réponse:**
```json
{
  "sessionMetrics": {
    "totalTokens": 892,
    "totalCost": 0.00034,
    "requestCount": 5
  },
  "clientId": "alice"
}
```

#### 4. Exporter en PDF `/export/pdf`

```bash
# Télécharger le PDF
curl 'http://localhost:3000/export/pdf?client_id=alice' -o rapport-alice.pdf

# Ouvrir directement (sur macOS)
curl 'http://localhost:3000/export/pdf?client_id=alice' | open -f

# Vérifier le fichier
file rapport-alice.pdf
```

**Contenu du PDF:**
- Page 1: Dashboard avec 4 cartes (requêtes, tokens, coûts, durée)
- Pages suivantes: Historique détaillé de chaque requête

#### 5. Lister les providers `/providers`

```bash
curl 'http://localhost:3000/providers'
```

**Réponse:**
```json
{
  "providers": [
    {"name": "mistral", "displayName": "Mistral"},
    {"name": "groq", "displayName": "Groq"},
    {"name": "huggingface", "displayName": "HuggingFace"}
  ]
}
```

#### 6. Effacer l'historique `/history` (DELETE)

```bash
curl -X DELETE 'http://localhost:3000/history?client_id=alice'
```

**Réponse:**
```json
{
  "success": true,
  "message": "History cleared"
}
```

---

## Exemples pratiques

### Cas 1: Conversation multilingue

```bash
# 1. Poser une question
curl 'http://localhost:3000/chat?q=Explique-moi+Einstein&client_id=physics_session'

# Réponse:
# "Albert Einstein est un physicien théoricien..."

# 2. Tracer l'historique
curl 'http://localhost:3000/history?client_id=physics_session'

# 3. Continuer la conversation avec un autre provider
curl 'http://localhost:3000/chat?q=Mais+sa+theorie+est+elle+utilisee&provider=groq&client_id=physics_session'

# 4. Exporter le rapport
curl 'http://localhost:3000/export/pdf?client_id=physics_session' -o physics-report.pdf
```

### Cas 2: Comparaison de providers

```bash
# Session Mistral
curl 'http://localhost:3000/chat?q=Comment+mieux+coder&provider=mistral&client_id=compare1'
curl 'http://localhost:3000/metrics?client_id=compare1' | jq '.sessionMetrics.totalCost'

# Session Groq
curl 'http://localhost:3000/chat?q=Comment+mieux+coder&provider=groq&client_id=compare2'
curl 'http://localhost:3000/metrics?client_id=compare2' | jq '.sessionMetrics.totalCost'

# Groq devrait afficher $0.00 (gratuit!)
```

### Cas 3: Chatbot pour plusieurs utilisateurs

```bash
# Alice
curl 'http://localhost:3000/chat?q=Bonjour&client_id=alice'
curl 'http://localhost:3000/chat?q=Mon+hobby+est+le+code&client_id=alice'
curl 'http://localhost:3000/history?client_id=alice'

# Bob
curl 'http://localhost:3000/chat?q=Bonjour&client_id=bob'
curl 'http://localhost:3000/chat?q=Mon+hobby+est+la+danse&client_id=bob'
curl 'http://localhost:3000/history?client_id=bob'

# Historiques complètement isolés!
```

### Cas 4: Script batch pour rapport quotidien

```bash
#!/bin/bash
# daily_report.sh

DATE=$(date +%Y%m%d)
REPORT="reports/rapport-$DATE.pdf"

# Générer rapport
curl 'http://localhost:3000/export/pdf?client_id=daily' \
  -o "$REPORT"

# Afficher statistiques
curl 'http://localhost:3000/metrics?client_id=daily' | jq

echo "Rapport généré: $REPORT"
```

Usage:
```bash
chmod +x daily_report.sh
./daily_report.sh
```

---

## FAQ & Dépannage

### Q: Erreur "MISTRAL_API_KEY is not defined"

**R:** Le fichier `.env` manque ou n'est pas correct.

```bash
# Vérifier que .env existe
cat .env

# Vérifier les valeurs
grep MISTRAL_API_KEY .env

# Relancer le serveur après correction
npm run api
```

### Q: "Provider 'xyz' not found"

**R:** Vérifier les providers disponibles:

```bash
curl http://localhost:3000/providers
```

Les providers valides sont: `mistral`, `groq`, `huggingface`

### Q: Le PDF est vide

**R:** Vous devez avoir au moins 1 message avant d'exporter.

```bash
# Envoyer un message d'abord
curl 'http://localhost:3000/chat?q=test&client_id=myid'

# Puis exporter
curl 'http://localhost:3000/export/pdf?client_id=myid' -o report.pdf
```

### Q: Comment réinitialiser une session?

**R:** Utiliser DELETE /history:

```bash
curl -X DELETE 'http://localhost:3000/history?client_id=alice'
```

### Q: Peut-on utiliser sans API keys payantes?

**R:** Oui! Groq et HuggingFace sont gratuits:

```bash
# Utiliser que Groq (gratuit)
curl 'http://localhost:3000/chat?q=Bonjour&provider=groq'

# Coût: $0.00
```

### Q: Comment tester en local sans internet?

**R:** Impossible - les APIs requièrent une connexion internet pour fonctionner.

### Q: Erreur "Port 3000 already in use"

**R:** Port 3000 est déjà utilisé. Solution:

```bash
# Option 1: Utiliser un autre port
PORT=3001 npm run api

# Option 2: Trouver et tuer le processus
lsof -i :3000
kill -9 <PID>
```

### Q: Comment optimiser les coûts?

**R:** Utiliser Groq (gratuit) ou augmenter MAX_HISTORY pour compresser plus souvent:

```bash
# Actuellement: MAX_HISTORY = 20 messages
# Réduire à 10 pour compresser plus souvent
# (dans src/chatbot-core.js)
this.MAX_HISTORY = 10;
```

### Q: Peut-on utiliser avec un frontend?

**R:** Oui! L'API accepte les requêtes CORS. Exemple React:

```javascript
const response = await fetch(
  'http://localhost:3000/chat?q=' + encodeURIComponent(message)
);
const data = await response.json();
setReply(data.reply);
```

---

## 📊 Comparaison Providers

```
┌──────────┬─────────────┬──────────┬────────┐
│ Provider │ Input Cost  │ Latency  │ Gratuit│
├──────────┼─────────────┼──────────┼────────┤
│ Mistral  │ $0.14/1M    │ 2-3s     │ ❌     │
│ Groq     │ $0.00/1M    │ 1-2s     │ ✅     │
│ HF       │ $0.00/1M    │ 2-3s     │ ✅     │
└──────────┴─────────────┴──────────┴────────┘
```

**Recommandation:**
- 💰 Budget limité → **Groq** (gratuit + rapide)
- 🏆 Meilleure qualité → **Mistral** (premium)
- 🔄 Fallback → **HuggingFace** (gratuit)

---

## 🎓 Concepts clés

### Sessions client
Chaque `client_id` a son propre historique et métriques:
```
Alice (client_id=alice):
  - Historique: Message 1, Message 2, ...
  - Coût: $0.0005

Bob (client_id=bob):
  - Historique: Autre Message 1, ...
  - Coût: $0.00002
```

### Auto-compression
Après 20 messages, les anciens sont résumés:
```
Avant: [msg1, msg2, ..., msg20, msg21]
Après: [msg1-20 résumé, msg21]
```

### Streaming
Les réponses arrivent token-par-token (mode CLI) ou tout d'un coup (mode API).

---

**Besoin d'aide?** Consultez le README.md pour plus de détails techniques!
