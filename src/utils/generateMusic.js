/**
 * generateMusic — calls the Replicate MusicGen API via our Vercel serverless proxy.
 * Takes the detected notes + style choice and returns a URL to the generated audio.
 */
export async function generateMusic({ notes, style, durationSeconds = 8 }) {
  // Build a natural-language prompt from the detected notes + chosen style
  const noteList   = notes.length > 0
    ? [...new Set(notes.map(n => n.note))].slice(0, 6).join(', ')
    : null
  const stylePrompts = {
    sunny:     'upbeat, warm, feel-good pop instrumental, bright acoustic guitar, sunny day',
    gritty:    'dark, raw, hard-hitting hip hop beat, heavy bass, gritty texture',
    dreamy:    'ethereal, ambient, floating atmospheric music, soft pads, dreamy reverb',
    bounce:    'energetic, rhythmic, bouncy hip hop, punchy drums, playful melody',
    cinematic: 'epic cinematic orchestral score, sweeping strings, emotional, powerful',
    coastal:   'chill lo-fi beach vibes, relaxed bossa nova, breezy acoustic, laid-back',
  }

  const noteContext = noteList ? `with melodic elements around the notes ${noteList}, ` : ''
  const prompt = `${stylePrompts[style] || style}, ${noteContext}high quality, professional music production`

  const response = await fetch('/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt, duration: durationSeconds }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Generation failed (${response.status})`)
  }

  const data = await response.json()
  return data.audioUrl  // string URL to the generated .wav
}
