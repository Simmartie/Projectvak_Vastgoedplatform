require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function test() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Zijn er voetbalclubs dichtbij de Meir in Antwerpen?" }] }],
      tools: [{ googleSearch: {} }]
    })
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

test();
