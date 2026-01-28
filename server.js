import express from 'express';
const app = express();

app.use(express.json());

// CORS - allow all
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('Claude Proxy Server Running ✓');
});

app.post('/chat', async (req, res) => {
  const { message, systemPrompt } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: message }]
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'API request failed'
      });
    }

    return res.json({ 
      response: data.content[0].text,
      usage: data.usage 
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
