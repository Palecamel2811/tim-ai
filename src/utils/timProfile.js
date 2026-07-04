/**
 * timProfile.js
 *
 * Reads and writes TIM's growing psychological profile of the user.
 * All answers are stored in localStorage under 'tim_profile'.
 *
 * Each answer record:
 * {
 *   questionId:  string,
 *   category:    string,
 *   question:    string,
 *   answer:      string,
 *   hasVoice:    boolean,
 *   mood:        object | null,    — mood at time of answering
 *   answeredAt:  ISO string,
 * }
 *
 * The profile structure is intentionally flat and verbose so it can be
 * passed directly to an LLM synthesis layer (or future quantum model)
 * without any pre-processing.
 */

const STORAGE_KEY = 'tim_profile'

/** Returns all saved answers */
export function getProfile() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
}

/** Save or update an answer for a given question */
export function saveAnswer({ questionId, category, question, answer, hasVoice = false, mood = null }) {
  const existing = getProfile()
  const idx = existing.findIndex(a => a.questionId === questionId)
  const record = {
    questionId,
    category,
    question,
    answer: answer.trim(),
    hasVoice,
    mood,
    answeredAt: new Date().toISOString(),
  }
  if (idx >= 0) {
    existing[idx] = record   // update in place
  } else {
    existing.push(record)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  return existing
}

/** Returns the answer for a specific question, or null */
export function getAnswer(questionId) {
  return getProfile().find(a => a.questionId === questionId) || null
}

/** How many questions have been answered */
export function getProfileDepth() {
  return getProfile().length
}

/** Returns a % completion (0–100) based on 14 total questions */
export function getProfileCompletion() {
  return Math.min(100, Math.round((getProfileDepth() / 14) * 100))
}

/**
 * getProfileContext()
 *
 * Generates a plain-text summary of the profile suitable for injection
 * into an LLM prompt or MusicGen conditioning prompt.
 *
 * Example output:
 *   "This person is a software engineer who feels disconnected from their work.
 *    They are working toward building something of their own. When things get
 *    heavy, they reach for music and isolation. Their sonic identity is rooted
 *    in early memories of their grandmother's voice and hip hop from their teens."
 */
export function getProfileContext() {
  const answers = getProfile()
  if (answers.length === 0) return null

  const lines = answers.map(a => `[${a.category}] ${a.question}\n→ ${a.answer}`)
  return lines.join('\n\n')
}

/**
 * getProfileSummaryForMusic()
 *
 * Returns a short music-conditioning string derived from profile answers.
 * Used to enrich the MusicGen prompt even without the synthesis API.
 */
export function getProfileSummaryForMusic() {
  const answers = getProfile()
  if (answers.length === 0) return ''

  // Pull the most emotionally loaded answers
  const sonicAnswers  = answers.filter(a => a.category === 'sonic_memory').map(a => a.answer)
  const copingAnswers = answers.filter(a => a.category === 'coping').map(a => a.answer)
  const goalAnswers   = answers.filter(a => a.category === 'goals_drive').map(a => a.answer)

  const parts = []
  if (sonicAnswers.length > 0)  parts.push(`sonic world: ${sonicAnswers[0].slice(0, 120)}`)
  if (copingAnswers.length > 0) parts.push(`emotional state: ${copingAnswers[0].slice(0, 120)}`)
  if (goalAnswers.length > 0)   parts.push(`inner drive: ${goalAnswers[0].slice(0, 120)}`)

  return parts.join(', ')
}
