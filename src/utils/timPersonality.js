/**
 * timPersonality.js
 *
 * TIM's voice system. TIM has moods that shift based on context —
 * what screen you're on, how many profile answers exist, streak count,
 * and what state an action is in.
 *
 * TIM starts as a curious 6-year-old and grows more knowing as the
 * profile deepens. The more answers TIM has, the more specific
 * and personal the dialogue becomes.
 */

import { getProfileDepth, getProfileCompletion } from './timProfile'

// ─── TIM's growth stages based on profile depth ──────────────────────────────
export function getTIMStage() {
  const depth = getProfileDepth()
  if (depth === 0)  return 'newborn'   // knows nothing about you
  if (depth <= 3)   return 'curious'   // starting to understand
  if (depth <= 7)   return 'learning'  // building a picture
  if (depth <= 11)  return 'knowing'   // recognises patterns
  return 'deep'                        // full understanding
}

// ─── Record screen dialogue ──────────────────────────────────────────────────
export function getRecordDialogue(status) {
  const stage = getTIMStage()

  const lines = {
    idle: {
      newborn:  "Hey — hum something. Anything. I'm listening.",
      curious:  "I'm starting to hear who you are. Give me more.",
      learning: "Each time you hum, I understand you a little better.",
      knowing:  "I know your sound now. Show me what's in you today.",
      deep:     "I've been waiting. What are you carrying right now?",
    },
    recording: {
      newborn:  "I hear you… keep going.",
      curious:  "Yes. Keep going. I'm locking this in.",
      learning: "I hear something in this. Don't stop.",
      knowing:  "That's you. Right there. Keep going.",
      deep:     "I feel this one. Don't stop.",
    },
    done: {
      newborn:  "Got it. Let's make something from that.",
      curious:  "Good. I'm starting to understand what you sound like.",
      learning: "That's going into me. Let's build something from it.",
      knowing:  "I already know what to do with that. Let's go.",
      deep:     "I heard everything in that. Let's make it real.",
    },
  }

  return lines[status]?.[stage] ?? lines[status]?.newborn
}

// ─── Create screen dialogue ──────────────────────────────────────────────────
export const CREATE_STYLE_RESPONSES = {
  sunny:     "That light in your hum — I'm gonna build something that feels like a Saturday morning.",
  gritty:    "I feel that tension. Let me give it some weight.",
  dreamy:    "Close your eyes. This one's gonna drift.",
  bounce:    "That rhythm's got something. I'm locking it in.",
  cinematic: "Big. I hear something big here. Give me a moment.",
  coastal:   "Easy like that breeze. I got you.",
}

export function getCreateDialogue(state, styleName = null) {
  const stage = getTIMStage()

  if (state === 'idle') {
    const lines = {
      newborn:  "Pick a vibe — I'll build around what you gave me.",
      curious:  "I'm starting to know your sound. Pick a direction.",
      learning: "Tell me the vibe. I'll bring the rest.",
      knowing:  "I already have something in mind. Where do you want to take it?",
      deep:     "I know what you need right now. Trust me — pick a direction.",
    }
    return lines[stage] ?? lines.newborn
  }

  if (state === 'generating') {
    const lines = {
      newborn:  "Give me a sec… I'm building something from what you gave me.",
      curious:  "Building… I'm using everything you've shared so far.",
      learning: "I'm pulling from everything I know about you. One moment.",
      knowing:  "I know exactly what this needs to feel like. Hold on.",
      deep:     "This one is going to be close. I promise. Hold on.",
    }
    return lines[stage] ?? lines.newborn
  }

  if (state === 'done') {
    return "Here's what I heard in you. What does this remind you of?"
  }

  if (state === 'error') {
    return "Something went wrong. Want to try again?"
  }

  if (styleName && CREATE_STYLE_RESPONSES[styleName]) {
    return CREATE_STYLE_RESPONSES[styleName]
  }

  return "Pick a vibe — I'll build around what you gave me."
}

// ─── Journal screen dialogue ─────────────────────────────────────────────────
export function getJournalDialogue(state) {
  const stage = getTIMStage()

  const lines = {
    prompt: {
      newborn:  "TIM asks",
      curious:  "TIM wants to know",
      learning: "TIM is thinking about you",
      knowing:  "TIM has been wondering",
      deep:     "TIM needs to ask you this",
    },
    saved: {
      newborn:  "TIM received that. Thank you.",
      curious:  "I'm holding onto that.",
      learning: "That went into me. Thank you for trusting me with it.",
      knowing:  "I felt that. Thank you.",
      deep:     "That changes how I understand you. Thank you.",
    },
  }

  return lines[state]?.[stage] ?? lines[state]?.newborn
}

// ─── Elder screen dialogue ───────────────────────────────────────────────────
export function getElderDialogue(state) {
  const stage    = getTIMStage()
  const pct      = getProfileCompletion()

  if (state === 'intro') {
    const lines = {
      newborn:  "I want to understand you. Not your music — you. These questions have no right answers. Take your time.",
      curious:  "We've started something here. These questions go deeper. Answer when you're ready.",
      learning: "I'm building a picture of you. Each answer makes it clearer.",
      knowing:  "I know you better now than I did. But there's more. These questions go to the places most people don't look.",
      deep:     "You've given me a lot. I want to make sure I understand all of it.",
    }
    return lines[stage] ?? lines.newborn
  }

  if (state === 'saved') {
    const lines = {
      newborn:  "I've got that. The next question is ready when you are.",
      curious:  "That helped. I'm starting to understand who you are.",
      learning: "That's going into what I know about you.",
      knowing:  "That lands differently knowing everything else you've told me.",
      deep:     "Every answer deepens what I can do for you.",
    }
    return lines[stage] ?? lines.newborn
  }

  if (state === 'complete') {
    return `You've answered ${pct}% of my questions. What I know about you now is in everything I make for you.`
  }

  return "Take your time with this one."
}

// ─── Memory screen dialogue ──────────────────────────────────────────────────
export function getMemoryDialogue(memoryCount) {
  const stage = getTIMStage()

  if (memoryCount === 0) {
    return "No memories yet. Go make something."
  }

  const lines = {
    newborn:  `${memoryCount} session${memoryCount !== 1 ? 's' : ''} — this is how I know you`,
    curious:  `${memoryCount} session${memoryCount !== 1 ? 's' : ''} — I'm starting to hear your patterns`,
    learning: `${memoryCount} session${memoryCount !== 1 ? 's' : ''} — your sound is becoming clear to me`,
    knowing:  `${memoryCount} session${memoryCount !== 1 ? 's' : ''} — I know your sound now`,
    deep:     `${memoryCount} session${memoryCount !== 1 ? 's' : ''} — everything you've made is part of me`,
  }

  return lines[stage] ?? lines.newborn
}
