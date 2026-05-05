# 🤖 Chatbot Multi-Provider - Rapport Complet

## 📋 Vue d'ensemble

Un système chatbot CLI et API Express avancé avec streaming LLM, mémoire conversationnelle, support multi-provider, compression contextuelle et export de statistiques en PDF professionnel.

**Architecture :** Node.js 18+ | ES Modules | Express 4.18.2 | Multi-LLM  
**Phases complétées :** 1-7 (Core) + Phase 8 (API) + Phase 9 (PDF Export)

---

## 🚀 Installation & Configuration

### 1. Prérequis
```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### 2. Cloner et installer

```bash
# Cloner le repository
git clone https://github.com/MellGitson/ChatBot.git
cd ChatBot

# Installer les dépendances
npm install
```

### 3. Configuration des API Keys

Créer un fichier `.env` à la racine du projet :

```bash
# Mistral AI (France)
MISTRAL_API_KEY=your_mistral_key_here

# Groq Cloud (Gratuit - Free tier)
GROQ_API_KEY=your_groq_key_here

# HuggingFace (Gratuit - Free tier)
HUGGINGFACE_TOKEN=your_huggingface_token_here

# Optionnel: Pinecone (future vectorization)
PINECONE_API_KEY=your_pinecone_key_here
```

**Où obtenir les clés :**
- **Mistral AI** : https://console.mistral.ai/keys
- **Groq Cloud** : https://console.groq.com/keys
- **HuggingFace** : https://huggingface.co/settings/tokens



---

##  Utilisation

### Mode 1 : CLI (Interface en ligne de commande)

#### Lancer le chatbot CLI

```bash
npm start
# ou
node src/chatbot-cli.js
```

#### Commandes disponibles dans le CLI

```
/history          → Afficher l'historique de conversation
/provider         → Voir le provider actuel
/provider groq    → Changer de provider (groq, mistral, huggingface)
/metrics          → Afficher métriques tokens/coûts/latence
/resume           → Résumer la conversation en 5 points clés
/translate en     → Traduire dernière réponse en anglais
/clear            → Effacer l'historique
exit              → Quitter
```

#### Exemple de conversation CLI

```bash
$ npm start

📱 Chatbot CLI - Phase 1-7
🔌 Provider: mistral
📌 Tapez vos questions (ou /help pour les commandes)

> Bonjour, qui es-tu?
[Stream token-by-token...]
Bonjour! Je suis un assistant IA multimodal...

> /metrics
📊 Métriques de session:
   ✓ Tokens: 234 (input: 45, output: 189)
   ✓ Coût: $0.000089
   ✓ Latence: 2345ms
   ✓ Provider: Mistral

> /provider groq
✓ Provider changé vers Groq
> Quelles sont tes capabilities?

> /resume
📌 Résumé de la conversation:
   1. L'utilisateur se présente
   2. Je me suis présenté comme assistant IA
   3. Discussion sur les capabilities
   4. ...

> exit
Au revoir! 👋
```

---

### Mode 2 : API Express (HTTP Server)

#### Lancer l'API

```bash
# Développement avec auto-reload
npm run api:dev

# Production
npm run api
```

Le serveur démarre sur **http://localhost:3000**

#### Routes disponibles

##### 1️⃣ Chat - Envoyer un message

```bash
GET /chat?q=<message>&provider=<name>&client_id=<id>
```

**Paramètres :**
- `q` (requis) : Message utilisateur (URL encoded)
- `provider` (optionnel) : mistral, groq, huggingface (défaut: mistral)
- `client_id` (optionnel) : Identifiant session (défaut: "default")

**Réponse :**
```json
{
  "reply": "Réponse du chatbot...",
  "provider": "mistral",
  "tokens": 156
}
```

**Exemples curl :**

```bash
# Message simple
curl 'http://localhost:3000/chat?q=Bonjour'

# Avec provider spécifique
curl 'http://localhost:3000/chat?q=Hello&provider=groq'

# Avec client_id (pour isoler les sessions)
curl 'http://localhost:3000/chat?q=Mon+nom+est+Alice&client_id=user123'

# URL encodée (caractères spéciaux)
curl 'http://localhost:3000/chat?q=Quel+est+ton+nom%3F'
```

---

##### 2️⃣ Historique - Voir la conversation

```bash
GET /history?client_id=<id>
```

**Réponse :**
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
  "clientId": "user123"
}
```

**Exemple :**
```bash
curl 'http://localhost:3000/history?client_id=user123'
```

---

##### 3️⃣ Métriques - Statistiques de session

```bash
GET /metrics?client_id=<id>
```

**Réponse :**
```json
{
  "sessionMetrics": {
    "totalTokens": 892,
    "totalCost": 0.00034,
    "requestCount": 5
  },
  "clientId": "user123"
}
```

---

##### 4️⃣ Export PDF - Rapport détaillé

```bash
GET /export/pdf?client_id=<id>
```

**Retour :** Fichier PDF téléchargeable

**Contenu du PDF :**
- Page 1 : Résumé global (4 cartes colorées)
  - Total requêtes
  - Total tokens
  - Coût session
  - Durée moyenne
- Pages suivantes : Historique détaillé de chaque requête
  - Numéro, timestamp
  - Message utilisateur
  - Tokens consommés
  - Coût USD
  - Durée en ms
  - Provider utilisé

**Exemple :**
```bash
curl 'http://localhost:3000/export/pdf?client_id=user123' -o rapport.pdf
open rapport.pdf
```

---

##### 5️⃣ Liste des Providers

```bash
GET /providers
```

**Réponse :**
```json
{
  "providers": [
    { "name": "mistral", "displayName": "Mistral" },
    { "name": "groq", "displayName": "Groq" },
    { "name": "huggingface", "displayName": "HuggingFace" }
  ]
}
```

---

##### 6️⃣ Effacer l'historique

```bash
DELETE /history?client_id=<id>
```

**Réponse :**
```json
{
  "success": true,
  "message": "History cleared"
}
```

---

##### 7️⃣ Health Check

```bash
GET /health
```

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2026-05-04T15:25:19.697Z"
}
```

---

## 📊 Exemple d'utilisation API complète

```bash
# 1. Créer une session
curl 'http://localhost:3000/chat?q=Je+m%27appelle+Alice&client_id=alice'

# 2. Continuer la conversation
curl 'http://localhost:3000/chat?q=Quelle+est+ma+professionn?&client_id=alice'

# 3. Changer de provider
curl 'http://localhost:3000/chat?q=Utilise+Groq&provider=groq&client_id=alice'

# 4. Voir l'historique
curl 'http://localhost:3000/history?client_id=alice' | jq

# 5. Voir les métriques
curl 'http://localhost:3000/metrics?client_id=alice' | jq

# 6. Exporter en PDF
curl 'http://localhost:3000/export/pdf?client_id=alice' -o alice-report.pdf
```

---

## 🏗️ Architecture & Phases

### Phases complétées (1-7) - Core Functionality

| Phase | Feature | Status | Fichier |
|-------|---------|--------|---------|
| 1 | CLI basique + Mistral API streaming | ✅ | chatbot-cli.js |
| 2 | Mémoire conversationnelle (/history) | ✅ | chatbot-cli.js |
| 3 | Streaming token-by-token | ✅ | chatbot-cli.js |
| 4 | Multi-provider (/provider) | ✅ | chatbot-cli.js |
| 5 | Auto-compression (MAX_HISTORY=20) | ✅ | chatbot-core.js |
| 6 | /resume - Résumer conversation | ✅ | chatbot-cli.js |
| 7 | /translate + Métriques détaillées | ✅ | chatbot-core.js |

### Phases bonus (8-9) - API & Export

| Phase | Feature | Status | Fichier |
|-------|---------|--------|---------|
| 8 | Express API + Multi-sessions | ✅ | api.js |
| 9 | Export PDF professionnel | ✅ | api.js |

---

## 📁 Structure du projet

```
ChatBot/
├── src/
│   ├── chatbot-cli.js          # CLI principal (Phases 1-7)
│   ├── chatbot-core.js         # Classe Chatbot réutilisable
│   └── api.js                  # Express API (Phases 8-9)
├── output/                     # Dossier PDFs (généré)
│   └── example-report.pdf
├── .env                        # Variables d'environnement (ignoré)
├── .gitignore
├── package.json                # Dépendances
├── package-lock.json
└── README.md                   # Cette documentation
```

---

## 🔧 Dépendances principales

```json
{
  "dotenv": "^16.3.1",           // Gestion .env
  "express": "^4.18.2",          // Framework API
  "pdfkit": "^0.13.0"            // Génération PDF
}
```

---

## 💰 Modèle de coûts

### Providers supportés

| Provider | Input/1M tokens | Output/1M tokens | Type |
|----------|----------------|-----------------|------|
| Mistral | $0.14 | $0.42 | Payant |
| Groq | $0.00 | $0.00 | Gratuit |
| HuggingFace | $0.00 | $0.00 | Gratuit |

### Calcul des coûts

```
Coût = (promptTokens × inputPrice) + (completionTokens × outputPrice)
Exemple Mistral:
  - Input: 45 tokens × ($0.14/1M) = $0.000063
  - Output: 189 tokens × ($0.42/1M) = $0.00007938
  - Total: $0.0000893
```

---

## 🎮 Cas d'usage

### 1. Analyse de coûts multi-provider
```bash
curl 'http://localhost:3000/chat?q=Quelle+est+ta+meilleure+feature&provider=mistral'
curl 'http://localhost:3000/chat?q=Quelle+est+ta+meilleure+feature&provider=groq'
curl 'http://localhost:3000/export/pdf' -o comparison.pdf
```

### 2. Chatbot multi-utilisateurs
```bash
curl 'http://localhost:3000/chat?q=Bonjour&client_id=user1'
curl 'http://localhost:3000/chat?q=Bonjour&client_id=user2'
# Historiques complètement isolés
```

### 3. Monitoring et reporting
```bash
# Générer rapport quotidien
curl 'http://localhost:3000/export/pdf?client_id=global' -o \
  daily-$(date +%Y%m%d).pdf
```

---

## 🐛 Troubleshooting

### Erreur: "API key missing"
```
Solution: Vérifier le fichier .env contient toutes les clés requises
```

### Erreur: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### PDF vide ou mal formaté
```
Solution: Assurez-vous d'avoir au moins 1 requête avant d'exporter
```

### Provider n'existe pas
```bash
# Vérifier les providers disponibles
curl http://localhost:3000/providers
```

---

## 🚀 Performance

### Benchmarks typiques

```
Request latency (Mistral): 2-3 secondes
Request latency (Groq):    1-2 secondes
PDF generation:            <500ms
Memory usage:              ~50MB
Max history items:         20 messages (auto-compression)
```

---

## 📝 Notes développeur

### Ajouter un nouveau provider

1. Ajouter configuration dans `src/chatbot-core.js` :
```javascript
export const PROVIDERS = {
  newprovider: {
    url: 'https://api.provider.com/v1/chat',
    apiKey: process.env.NEWPROVIDER_KEY,
    model: 'model-name',
    name: 'Display Name'
  }
}
```

2. Ajouter pricing :
```javascript
export const PRICING = {
  newprovider: { input: 0.01, output: 0.02, name: 'New Provider' }
}
```

3. Tester :
```bash
curl 'http://localhost:3000/chat?q=test&provider=newprovider'
```

---

## 📄 Licence & Crédits

Projet IPSSI - ChatBot Multi-Provider  
Développé avec Node.js, Express et pdfkit

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier la section Troubleshooting
2. Consulter les logs du serveur
3. Vérifier les configurations .env

---

**Dernière mise à jour:** 04/05/2026  
**Version:** 2.0 (Phases 1-9)
