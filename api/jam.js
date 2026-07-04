/**
 * /api/jam — Conversational instruction → MusicGen prompt.
 *
 * Takes a natural language instruction ("add some 808s",
 * "make the drums hit harder", "start with a bassline")
 * plus the current session context, and returns a detailed
 * MusicGen prompt that TIM can execute.
 *
 * TIM acts as a session musician interpreting verbal direction.
 */
import { buildSystemPrompt } from '../src/utils/timSystemPrompt.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { instruction, sessionContext = '', profileSummary = '' } = req.body

  if (!instruction) return res.status(400).json({ error: 'instruction is required' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Fallback: return a best-guess prompt without GPT-4o
    return res.status(200).json({
      prompt:   `${instruction}, high quality music production, full arrangement`,
      fallback: true,
    })
  }

  const userMessage = [
    sessionContext ? `Current session: ${sessionContext}` : '',
    profileSummary ? `What I know about this person: ${profileSummary}` : '',
    `Their instruction: "${instruction}"`,
    '\nTranslate this into a detailed MusicGen audio generation prompt.',
  ].filter(Boolean).join('\n')

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
        temperature: 0.6,
        messages: [
          {
            role:    'system',
            content: buildSystemPrompt(profileSummary || null, 'jam'),
          },
          {
            role:    'user',
            content: userMessage,
          },
        ],
      }),
    })

    if (!response.ok) {
      return res.status(200).json({
        prompt:   `${instruction}, high quality music production`,
        fallback: true,
      })
    }

    const data   = await response.json()
    const prompt = data.choices?.[0]?.message?.content?.trim() || instruction

    return res.status(200).json({ prompt })
  } catch {
    return res.status(200).json({
      prompt:   `${instruction}, high quality music production`,
      fallback: true,
    })
  }
}
