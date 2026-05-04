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

// Phase 3: Appel avec streaming
async function chatStream(userMessage) {
  // Ajouter le message user à history
  history.push({
    role: 'user',
    content: userMessage
  });

  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: history,
      temperature: 0.7,
      stream: true  // Phase 3: Activer le streaming
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
  }

  // Phase 3: Lire le stream et accumuler la réponse
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
            process.stdout.write(token);  // Phase 3: Afficher au fur et à mesure
          }
        } catch (e) {
          // Ignorer les erreurs de parse
        }
      }
    }
  }

  // Ajouter la réponse complète à l'historique (APRÈS avoir tout reçu)
  history.push({
    role: 'assistant',
    content: fullMessage
  });

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
  console.log('Chatbot CLI - Phase 3 (avec streaming). (Ctrl+C pour quitter)\n');
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
      // Phase 3: Utiliser chatStream à la place de chat
      await chatStream(input);
      console.log('\n');  // Saut de ligne après le stream
    } catch (error) {
      console.error(`Erreur : ${error.message}\n`);
    }
  }
}

main().catch(console.error);
