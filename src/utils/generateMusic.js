/**
 * uploadBlob — uploads the recorded hum blob to Replicate's file upload API,
 * returning a public URL that MusicGen can fetch for melody conditioning.
 */
async function uploadHumToReplicate(blobUrl, token) {
  try {
    const response = await fetch(blobUrl)
    const blob     = await response.blob()

    const uploadRes = await fetch('https://api.replicate.com/v1/files', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body:    blob,
    })

    if (!uploadRes.ok) return null
    const data = await uploadRes.json()
    return data.urls?.get || null
  } catch {
    return null
  }
}

/**
 * generateMusic — calls the Replicate MusicGen API via our Vercel serverless proxy.
 * Takes the detected notes + style choice + hum blob URL, returns generated audio URL.
 */
export async function generateMusic({ notes, style, durationSeconds = 15, humBlobUrl = null }) {

  // Analyze the hum: range, density, and movement shape the prompt
  const uniqueNotes = [...new Set(notes.map(n => n.note))]
  const noteCount   = uniqueNotes.length
  const duration    = notes.length > 0
    ? notes[notes.length - 1].time - notes[0].time
    : 0

  // Describe the melodic character from what was detected
  let melodicCharacter = ''
  if (noteCount === 0) {
    melodicCharacter = 'based on a rhythmic pulse, no defined melody'
  } else if (noteCount <= 2) {
    melodicCharacter = 'built around a simple, repetitive two-note motif, minimal and hypnotic'
  } else if (noteCount <= 4) {
    melodicCharacter = 'built around a short melodic phrase, focused and intentional'
  } else {
    melodicCharacter = 'built around a flowing melodic line with several distinct notes, expressive'
  }

  // Tempo feel from how long the hum was
  const tempoFeel = duration < 3
    ? 'short and punchy'
    : duration < 6
    ? 'medium length, conversational'
    : 'extended, developed'

  // Rich style descriptors — what MusicGen actually responds to well
  const stylePrompts = {
    sunny: [
      'upbeat feel-good pop instrumental',
      'bright acoustic guitar and light percussion',
      'warm and inviting, like a sunny Saturday morning',
      'clean mix, radio-ready production',
    ],
    gritty: [
      'dark brooding hip hop instrumental',
      'heavy 808 bass, dusty samples, gritty lo-fi texture',
      'hard-hitting drums, underground rap beat',
      'raw and authentic, not polished',
    ],
    dreamy: [
      'ethereal ambient instrumental',
      'lush reverb-soaked synth pads, floating and weightless',
      'slow evolving textures, no hard drums',
      'cinematic and introspective, like drifting through clouds',
    ],
    bounce: [
      'energetic bouncy hip hop beat',
      'punchy snare, tight hi-hats, groovy bass line',
      'playful and rhythmic, makes you want to move',
      'trap influenced with melodic elements',
    ],
    cinematic: [
      'epic orchestral cinematic score',
      'sweeping strings, powerful brass, emotional build',
      'large dynamic range, film soundtrack quality',
      'dramatic and emotionally resonant',
    ],
    coastal: [
      'chill lo-fi coastal instrumental',
      'soft acoustic guitar, gentle waves in background, laid-back groove',
      'warm vinyl texture, relaxed bossa nova influence',
      'peaceful and unhurried, like watching a sunset',
    ],
  }

  const descriptors = stylePrompts[style] || [style]
  const prompt = [
    descriptors.join(', '),
    melodicCharacter,
    tempoFeel,
    'high quality professional music production, full arrangement',
  ].join(', ')

  // Pass the hum blob URL so the backend can use it for melody conditioning
  const response = await fetch('/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      prompt,
      duration:   durationSeconds,
      humBlobUrl: humBlobUrl || null,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Generation failed (${response.status})`)
  }

  const data = await response.json()
  return data.audioUrl  // string URL to the generated .wav
}
