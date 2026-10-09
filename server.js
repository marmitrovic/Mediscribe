// MediScribe backend (opciono): proxy ka OpenAI API-ju. Potreban Node 18+.
// API ključ se NIKAD ne stavlja u frontend. Postavi ga kao promenljivu okruženja:
//   Mac/Linux: export OPENAI_API_KEY="sk-..."      Windows (cmd): set OPENAI_API_KEY=sk-...
import express from 'express';
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const SYSTEM = `You are a medical documentation assistant. From the doctor's dictation (English, Spanish, Serbian, Croatian or Bosnian)
extract the data into JSON with exactly these keys: "history" (patient complaints), "exam" (physical examination findings),
"diagnosis" (suggested diagnosis with ICD-10 code), "treatment" (medication, doses, follow-up).
Write the values in the same language as the dictation. Do not invent data that is not in the dictation.
If something is missing, return an empty string for that field.`;

app.post('/api/structure', async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY; // <-- ovde se koristi tvoj API ključ
    if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY nije postavljen' });
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // <-- promeni model po želji
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: req.body.text || '' }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(JSON.parse(data.choices[0].message.content));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Opciono: umesto Web Speech API možeš dodati /api/transcribe koji šalje snimljeni audio
// na https://api.openai.com/v1/audio/transcriptions (model "whisper-1", language "en" or "es").
app.listen(3000, () => console.log('MediScribe: http://localhost:3000'));
