/**
 * Journal exercises — rotating prompts by frequency type.
 * Elder AI will eventually use these responses as emotional training signal.
 */

export const DAILY_PROMPTS = [
  "Just talk. What's on your mind right now? Nothing is wrong to say.",
  "Close your eyes. What's the first sound you remember from this morning?",
  "What feeling showed up today that you weren't expecting?",
  "If today had a color, what would it be and why?",
  "What are you carrying into right now that you haven't put down yet?",
  "Describe the last moment today where you felt completely present.",
  "What did you hear today that moved something in you — even slightly?",
  "What would the soundtrack to the last 24 hours sound like?",
  "Is there something you want to say that you haven't said out loud yet?",
  "What does your body feel like right now? Start there.",
]

export const WEEKLY_PROMPTS = [
  "What feeling have you been avoiding this week? Describe it without judging it.",
  "What made you feel most alive this week? What made you feel most distant?",
  "Where did you feel most like yourself this week?",
  "What surprised you about yourself this week?",
  "If this week were a song, what would the energy of it be?",
  "What did you create this week — even if it wasn't music?",
  "What did you let go of? What are you still holding?",
  "Who or what gave you energy this week? Who or what took it?",
]

export const MONTHLY_PROMPTS = [
  "Think back to when you were 6. What did the world sound like to you?",
  "If your life had a soundtrack right now, what would it feel like? Not sound like — feel like.",
  "Who were you 30 days ago? What has shifted in you since then?",
  "What is the emotional theme of this season of your life?",
  "What memory from your past has been showing up lately? Why do you think that is?",
  "What are you becoming? What are you leaving behind?",
  "Describe the version of yourself you're moving toward.",
]

export const SONIC_MEMORY_PROMPTS = [
  "What's the first sound you remember from childhood?",
  "What song takes you somewhere specific when you hear it?",
  "What sound makes you feel safe?",
  "What sound makes you feel uneasy, even if you can't explain why?",
  "Close your eyes. You're 10 years old. What do you hear around you?",
  "What's a sound from your past that no longer exists in your present?",
]

/**
 * Get today's prompt for a given frequency type.
 * Uses the date to rotate through prompts deterministically.
 */
export function getTodaysPrompt(type = 'daily') {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  )
  const map = {
    daily:        DAILY_PROMPTS,
    weekly:       WEEKLY_PROMPTS,
    monthly:      MONTHLY_PROMPTS,
    sonic_memory: SONIC_MEMORY_PROMPTS,
  }
  const list = map[type] || DAILY_PROMPTS
  return list[dayOfYear % list.length]
}

/**
 * Get the streak count from localStorage journal entries.
 */
export function getJournalStreak() {
  const entries = JSON.parse(localStorage.getItem('tim_journal_entries') || '[]')
  if (entries.length === 0) return 0

  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Check if journaled today or yesterday (don't break streak at midnight)
  const dates = entries.map(e => new Date(e.createdAt).toDateString())
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0

  // Count consecutive days back from today
  let streak  = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const dateStr = current.toDateString()
    if (dates.includes(dateStr)) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}
