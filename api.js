import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

// Providers 

const PROVIDERS = {
  mistral: {
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
  },
};

// Historique partagé (durée de vie du serveur) 

const sessionHistory = [
  {
    role: 'system',
    content: 'Tu es un assistant utile et concis. Tu te souviens de tout ce qui a été dit dans cette conversation.',
  },
];

// Appel LLM sans streaming 

async function askLLM(messages, provider) {
  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  return response.json();
}

//  GET /chat?q=<message>&provider=<nom>

app.get('/chat', async (req, res) => {
  const { q, provider: providerName = 'mistral' } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Paramètre q requis.' });
  }

  const provider = PROVIDERS[providerName.toLowerCase()];
  if (!provider) {
    return res.status(400).json({
      error: `Provider inconnu : "${providerName}". Disponibles : ${Object.keys(PROVIDERS).join(', ')}`,
    });
  }

  sessionHistory.push({ role: 'user', content: q });

  try {
    const data = await askLLM(sessionHistory, provider);
    const reply = data.choices[0].message.content;
    const tokens = data.usage?.total_tokens ?? 0;

    sessionHistory.push({ role: 'assistant', content: reply });

    res.json({ reply, provider: providerName, tokens });
  } catch (err) {
    sessionHistory.pop();
    res.status(500).json({ error: err.message });
  }
});

// DELETE /history 

app.delete('/history', (_req, res) => {
  sessionHistory.splice(1);
  res.json({ message: 'Historique réinitialisé.' });
});

//  Démarrage 

app.listen(3000, () => {
  console.log('API Chatbot sur http://localhost:3000');
  console.log('  GET  /chat?q=<message>&provider=<mistral|groq>');
  console.log('  DELETE /history');
});
