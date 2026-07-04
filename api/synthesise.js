/**
 * /api/synthesise — GPT-4o emotional brief synthesis.
 * Takes profile answers, returns a music-production brief
 * written through TIM's 6-year-old lens.
 */
import { buildSystemPrompt } from '../src/utils/timSystemPrompt.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { profileContext } = req.body
  if (!profileContext) return res.status(400).json({ error: 'profileContext is required' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(200).json({ brief: null, fallback: true })

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'gpt-4o',
        max_tokens:  180,
        temperature: 0.5,
        messages: [
          {
            role:    'system',
            content: buildSystemPrompt(null, 'synthesis'),
          },
          {
            role:    'user',
            content: `Here are this person's profile answers:\n\n${profileContext}\n\nWrite the emotional brief now.`,
          },
        ],
      }),
    })

    if (!response.ok) return res.status(200).json({ brief: null, fallback: true })

    const data  = await response.json()
    const brief = data.choices?.[0]?.message?.content?.trim() || null

    // Safeguard: strip any clinical terms that slipped through
    const clinical = ['diagnose', 'disorder', 'anxiety disorder', 'depression', 'trauma response', 'therapy', 'treatment']
    const safe = brief && !clinical.some(term => brief.toLowerCase().includes(term))

    return res.status(200).json({ brief: safe ? brief : null })
  } catch {
    return res.status(200).json({ brief: null, fallback: true })
  }
}
