/**
 * /api/generate — Vercel serverless function
 * Proxies requests to Replicate's MusicGen model.
 * The REPLICATE_API_TOKEN env var is set in Vercel dashboard (never in code).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, duration = 15, humBlobUrl = null } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'Replicate API token not configured' })
  }

  try {
    // If a hum blob URL was provided, upload it to Replicate for melody conditioning
    let melodyUrl = null
    if (humBlobUrl) {
      try {
        const audioRes = await fetch(humBlobUrl)
        const audioBlob = await audioRes.arrayBuffer()

        const uploadRes = await fetch('https://api.replicate.com/v1/files', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'audio/webm',
          },
          body: audioBlob,
        })
        if (uploadRes.ok) {
          const fileData = await uploadRes.json()
          melodyUrl = fileData.urls?.get || null
        }
      } catch (uploadErr) {
        console.warn('Melody upload failed, falling back to text-only:', uploadErr.message)
      }
    }

    // Build input — use melody conditioning if upload succeeded
    const input = {
      prompt,
      duration,
      output_format:          'mp3',
      normalization_strategy: 'peak',
    }

    if (melodyUrl) {
      // melody model: follows the actual pitch/rhythm of the hum
      input.model_version = 'melody'
      input.melody        = melodyUrl
    } else {
      input.model_version = 'stereo-large'
    }

    // Step 1 — Create a prediction using the versioned API endpoint
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'Prefer':        'wait',
      },
      body: JSON.stringify({
        version: '671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb',
        input,
      }),
    })

    const prediction = await createRes.json()

    if (!createRes.ok) {
      console.error('Replicate error:', prediction)
      return res.status(createRes.status).json({ error: prediction.detail || 'Replicate API error' })
    }

    // Step 2 — Poll if not done yet (fallback when Prefer: wait times out)
    let result = prediction
    let attempts = 0
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      result = await pollRes.json()
      attempts++
    }

    if (result.status === 'failed') {
      return res.status(500).json({ error: result.error || 'Generation failed' })
    }

    // MusicGen returns an array with one URL
    const audioUrl = Array.isArray(result.output) ? result.output[0] : result.output

    return res.status(200).json({ audioUrl })

  } catch (err) {
    console.error('Handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
