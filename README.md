# Chatbot CLI multi-provider

Chatbot en ligne de commande Node.js avec mémoire conversationnelle, streaming SSE, compression automatique du contexte et mini API Express.

## Prérequis

- Node.js v18+
- Clés API Mistral et Groq

## Installation

```bash
npm install
```

Créer un fichier `.env` à partir de `.env.example` :

```
MISTRAL_API_KEY=votre_clé_mistral
GROQ_API_KEY=votre_clé_groq
```

## Utilisation

### CLI interactif

```bash
node chatbot-cli.js
```

### API HTTP

```bash
node api.js
```

## Architecture

```
chatbot-cli.js
│
├── readline interface     ← input/output terminal
├── history[]              ← tableau de messages, état de la conversation
├── currentProvider        ← { url, key, model } — mutable via /provider
│
├── chatStream()           ← envoie + streame la réponse
├── compressHistory()      ← résumé automatique quand history > MAX
├── resumeConversation()   ← méta-commande /resume, ne touche pas history
└── translateLast()        ← méta-commande /translate, ne touche pas history
```

## Commandes CLI

| Commande | Description |
|---|---|
| `/provider <nom>` | Change de provider (`mistral` ou `groq`) |
| `/history` | Affiche l'état interne de la conversation |
| `/resume` | Génère un résumé bullet points de la conversation |
| `/translate <langue>` | Traduit le dernier message de l'IA |
| `Ctrl+C` | Quitter |

## API HTTP

### GET /chat

Envoie un message et reçoit une réponse.

```bash
curl "http://localhost:3000/chat?q=Bonjour&provider=mistral"
```

**Paramètres :**
- `q` (requis) — le message
- `provider` (optionnel, défaut : `mistral`) — `mistral` ou `groq`

**Réponse :**
```json
{ "reply": "Bonjour !", "provider": "mistral", "tokens": 42 }
```

### DELETE /history

Réinitialise l'historique de conversation.

```bash
curl -X DELETE "http://localhost:3000/history"
```

**Réponse :**
```json
{ "message": "Historique réinitialisé." }
```

## Providers

| Provider | Modèle | Points forts |
|---|---|---|
| Mistral | `mistral-small-latest` | Qualité, RGPD |
| Groq | `llama-3.3-70b-versatile` | Vitesse (TTFT ~100ms) |

## Fonctionnalités

- **Mémoire conversationnelle** — historique côté client renvoyé à chaque appel
- **Streaming SSE** — tokens affichés au fil de l'eau comme ChatGPT
- **Compression automatique** — résumé déclenché automatiquement au-delà de 20 messages
- **Switch provider à la volée** — sans relancer le script, la conversation continue
- **Métriques** — latence, tokens estimés et coût affiché après chaque réponse
- **Prompt injection hardening** — system prompt résistant aux tentatives de contournement
