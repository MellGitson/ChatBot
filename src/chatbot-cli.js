import readline from 'node:readline';
import dotenv from 'dotenv';

dotenv.config();

// Phase 4: Configuration multi-provider
const PROVIDERS = {
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
    name: 'Mistral'
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    name: 'Groq'
  },
  huggingface: {
    url: 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf/v1/chat/completions',
    apiKey: process.env.HUGGINGFACE_TOKEN,
    model: 'meta-llama/Llama-2-7b-chat-hf',
    name: 'HuggingFace'
  }
};

let currentProvider = 'mistral';

// Phase 5: Limite de messages avant compression
const MAX_HISTORY = 20;  // Nombre maximal de messages avant compression

// Historique côté client
const history = [
  {
    role: 'system',
    content: 'Tu es un assistant utile et concis. Tu te souviens de tout ce qui a été dit dans cette conversation.'
  }
];

// Phase 4: Appel avec streaming et provider configurable
async function chatStream(userMessage) {
  const provider = PROVIDERS[currentProvider];
  
  // Ajouter le message user à history
  history.push({
    role: 'user',
    content: userMessage
  });

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: history,
      temperature: 0.7,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`${provider.name} API error: ${response.status} ${response.statusText}`);
  }

  // Lire le stream et accumuler la réponse
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices[0].delta.content;
          if (token) {
            fullMessage += token;
            process.stdout.write(token);
          }
        } catch (e) {
          // Ignorer les erreurs de parse
        }
      }
    }
  }

  // Ajouter la réponse complète à l'historique
  history.push({
    role: 'assistant',
    content: fullMessage
  });

  // Phase 5: Compresser l'historique si trop long
  await compressHistory();

  return fullMessage;
}

// Afficher l'historique compressé
function printHistory() {
  console.log('\n📋 Historique:');
  history.forEach((msg, idx) => {
    const preview = msg.content.substring(0, 80).replace(/\n/g, ' ');
    console.log(`  [${idx}] ${msg.role}: ${preview}${msg.content.length > 80 ? '...' : ''}`);
  });
  console.log();
}

// Phase 4: Changer le provider actif
function switchProvider(name) {
  const providerName = name.toLowerCase();
  
  if (!PROVIDERS[providerName]) {
    const available = Object.keys(PROVIDERS).join(', ');
    console.log(`❌ Provider '${providerName}' introuvable. Disponibles: ${available}\n`);
    return false;
  }

  if (!PROVIDERS[providerName].apiKey) {
    console.log(`❌ Clé API manquante pour ${PROVIDERS[providerName].name}\n`);
    return false;
  }

  currentProvider = providerName;
  console.log(`✅ Switched to ${PROVIDERS[providerName].name}\n`);
  return true;
}

// Phase 5: Compression automatique du contexte
async function compressHistory() {
  // Si historique trop long, résumer les anciens messages
  if (history.length <= MAX_HISTORY) {
    return;  // Rien à faire
  }

  console.log(`\n⚠️ Contexte compressé (${history.length} → ${MAX_HISTORY} messages)...`);

  // Garder le system prompt [0]
  // Résumer les messages [1] à [history.length - 10]
  // Garder les 10 derniers messages pour contexte frais
  const keepLast = 10;
  const endCompress = history.length - keepLast;
  const messagesToCompress = history.slice(1, endCompress);

  // Créer un résumé des messages compressés
  const conversationText = messagesToCompress
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');

  const provider = PROVIDERS[currentProvider];
  const summaryPrompt = `Résume en 2-3 phrases clés les points importants de cette conversation. Sois concis:\n\n${conversationText}`;

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3,  // Bas pour un résumé déterministe
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.choices[0].message.content;

      // Remplacer l'historique compressé par le résumé
      history.splice(1, messagesToCompress.length, {
        role: 'assistant',
        content: `[Contexte résumé] ${summary}`
      });
    }
  } catch (e) {
    console.error(`⚠️ Erreur compression: ${e.message}`);
  }
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('Chatbot CLI - Phase 5 (compression contexte). (Ctrl+C pour quitter)\n');
  console.log('Commandes spéciales:');
  console.log('  /history        - Afficher l\'historique');
  console.log('  /provider       - Afficher le provider actuel');
  console.log('  /provider NAME  - Changer de provider (mistral, groq, huggingface)\n');
  console.log(`Note: Compression auto quand historique > ${MAX_HISTORY} messages\n`);

  while (true) {
    const input = await question('Vous : ');
    
    if (!input.trim()) {
      continue;
    }

    // Commande /history
    if (input.trim() === '/history') {
      printHistory();
      continue;
    }

    // Commande /provider
    if (input.trim() === '/provider') {
      console.log(`\n📌 Provider actuel: ${PROVIDERS[currentProvider].name}\n`);
      continue;
    }

    // Phase 4: Changer le provider
    if (input.trim().startsWith('/provider ')) {
      const providerName = input.trim().slice(9).trim();
      switchProvider(providerName);
      continue;
    }

    try {
      await chatStream(input);
      console.log('\n');
    } catch (error) {
      console.error(`Erreur : ${error.message}\n`);
    }
  }
}

main().catch(console.error);
