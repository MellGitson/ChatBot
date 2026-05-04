import readline from 'node:readline';
import dotenv from 'dotenv';

dotenv.config();

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

// Phase 1: Appel simple sans mémoire
async function askMistral(userMessage) {
  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
  console.log('Chatbot CLI - Phase 1. (Ctrl+C pour quitter)\n');

  while (true) {
    const input = await question('Vous : ');
    
    if (!input.trim()) {
      continue;
    }

    try {
      const reply = await askMistral(input);
      console.log(`IA : ${reply}\n`);
    } catch (error) {
      console.error(`Erreur : ${error.message}\n`);
    }
  }
}

main().catch(console.error);
