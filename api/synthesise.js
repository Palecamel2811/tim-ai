/**
 * /api/synthesise — Vercel serverless function
 *
 * Takes the user's psychological profile answers and calls GPT-4o to
 * synthesise them into an "emotional brief" — a paragraph that describes
 * who this person is emotionally and what their music should feel like.
 *
 * This brief is then injected into the MusicGen prompt so the generated
 * music reflects the person's actual psychology, not just a vibe selection.
 *
 * Requires: OPENAI_API_KEY env var set in Vercel dashboard.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { profileContext } = req.body

  if (!profileContext) {
    return res.status(400).json({ error: 'profileContext is required' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Graceful degradation — if no key, return a fallback so Create still works
    return res.status(200).json({
      brief: null,
      fallback: true,
    })
  }

  const systemPrompt = `You are the Elder AI layer of a music generation system called TIM (This Is Mine).

Your job is to read a user's psychological profile — their answers about their life, work, goals, coping patterns, and sonic identity — and synthesise it into a concise emotional brief that a music generation model can use.

The brief must:
- Be 2-3 sentences maximum
- Describe the emotional texture of this person's current life
- Translate their psychology into musical language (tension, space, movement, colour)
- Feel empathetic, not clinical
- End with a specific music production direction (e.g. "The music should feel like...")

Do not use jargon. Do not list bullet points. Write as flowing prose.`

  const userPrompt = `Here are this person's profile answers:\n\n${profileContext}\n\nWrite the emotional brief.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'gpt-4o',
        max_tokens:  200,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('OpenAI error:', err)
      return res.status(200).json({ brief: null, fallback: true })
    }

    const data  = await response.json()
    const brief = data.choices?.[0]?.message?.content?.trim() || null

    return res.status(200).json({ brief })

  } catch (err) {
    console.error('Synthesise error:', err)
    // Never block music generation — return fallback gracefully
    return res.status(200).json({ brief: null, fallback: true })
  }
}
