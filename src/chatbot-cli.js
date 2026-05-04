import readline from 'node:readline';
import dotenv from 'dotenv';

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

// Phase 2: Historique côté client
const history = [
  {
    role: 'system',
    content: 'Tu es un assistant utile et concis. Tu te souviens de tout ce qui a été dit dans cette conversation.'
  }
];

// Phase 2: Appel avec mémoire complète
async function chat(userMessage) {
  // TODO 1: ajouter le message user à history
  history.push({
    role: 'user',
    content: userMessage
  });

  // TODO 2: envoyer TOUT l'historique
  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: history,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content;

  // TODO 3: ajouter la réponse de l'assistant à history (APRÈS l'appel)
  history.push({
    role: 'assistant',
    content: assistantMessage
  });

  return assistantMessage;
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
  console.log('Chatbot CLI - Phase 2 (avec mémoire). (Ctrl+C pour quitter)\n');
  console.log('Commandes spéciales: /history\n');

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

    try {
      const reply = await chat(input);
      console.log(`IA : ${reply}\n`);
    } catch (error) {
      console.error(`Erreur : ${error.message}\n`);
    }
  }
}

main().catch(console.error);
