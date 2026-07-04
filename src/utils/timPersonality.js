/**
 * timPersonality.js — TIM's context-aware dialogue system.
 * TIM's voice shifts across 5 growth stages as the profile deepens.
 */

import { getProfileDepth, getProfileCompletion } from './timProfile'

export function getTIMStage() {
  const d = getProfileDepth()
  if (d === 0)  return 'newborn'
  if (d <= 3)   return 'curious'
  if (d <= 7)   return 'learning'
  if (d <= 11)  return 'knowing'
  return 'deep'
}

export function getRecordDialogue(status) {
  const s = getTIMStage()
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
  return lines[status]?.[s] ?? lines[status]?.newborn
}

export const CREATE_STYLE_RESPONSES = {
  sunny:     "That light in your hum — I'm gonna build something that feels like a Saturday morning.",
  gritty:    "I feel that tension. Let me give it some weight.",
  dreamy:    "Close your eyes. This one's gonna drift.",
  bounce:    "That rhythm's got something. I'm locking it in.",
  cinematic: "Big. I hear something big here. Give me a moment.",
  coastal:   "Easy like that breeze. I got you.",
}

export function getCreateDialogue(state) {
  const s = getTIMStage()
  if (state === 'idle') {
    const lines = {
      newborn: "Pick a vibe — I'll build around what you gave me.",
      curious: "I'm starting to know your sound. Pick a direction.",
      learning:"Tell me the vibe. I'll bring the rest.",
      knowing: "I already have something in mind. Where do you want to take it?",
      deep:    "I know what you need right now. Pick a direction.",
    }
    return lines[s] ?? lines.newborn
  }
  if (state === 'generating') {
    const lines = {
      newborn: "Give me a sec… I'm building something from what you gave me.",
      curious: "Building… I'm using everything you've shared so far.",
      learning:"I'm pulling from everything I know about you. One moment.",
      knowing: "I know exactly what this needs to feel like. Hold on.",
      deep:    "This one is going to be close. I promise. Hold on.",
    }
    return lines[s] ?? lines.newborn
  }
  if (state === 'done')  return "Here's what I heard in you. What does this remind you of?"
  if (state === 'error') return "Something went wrong. Want to try again?"
  return "Pick a vibe — I'll build around what you gave me."
}

export function getJournalDialogue(state) {
  const s = getTIMStage()
  const lines = {
    prompt: {
      newborn: "TIM asks", curious: "TIM wants to know",
      learning:"TIM is thinking about you", knowing: "TIM has been wondering",
      deep:    "TIM needs to ask you this",
    },
    saved: {
      newborn: "TIM received that. Thank you.",
      curious: "I'm holding onto that.",
      learning:"That went into me. Thank you for trusting me with it.",
      knowing: "I felt that. Thank you.",
      deep:    "That changes how I understand you. Thank you.",
    },
  }
  return lines[state]?.[s] ?? lines[state]?.newborn
}

export function getElderDialogue(state) {
  const s   = getTIMStage()
  const pct = getProfileCompletion()
  if (state === 'intro') {
    const lines = {
      newborn: "I want to understand you. Not your music — you. These questions have no right answers. Take your time.",
      curious: "We've started something here. These questions go deeper. Answer when you're ready.",
      learning:"I'm building a picture of you. Each answer makes it clearer.",
      knowing: "I know you better now. But there's more. These questions go to the places most people don't look.",
      deep:    "You've given me a lot. I want to make sure I understand all of it.",
    }
    return lines[s] ?? lines.newborn
  }
  if (state === 'saved') {
    const lines = {
      newborn: "I've got that. The next question is ready when you are.",
      curious: "That helped. I'm starting to understand who you are.",
      learning:"That's going into what I know about you.",
      knowing: "That lands differently knowing everything else you've told me.",
      deep:    "Every answer deepens what I can do for you.",
    }
    return lines[s] ?? lines.newborn
  }
  if (state === 'complete') return `You've answered ${pct}% of my questions. What I know about you now is in everything I make for you.`
  return "Take your time with this one."
}

export function getMemoryDialogue(count) {
  const s = getTIMStage()
  if (count === 0) return "No memories yet. Go make something."
  const lines = {
    newborn: `${count} session${count !== 1 ? 's' : ''} — this is how I know you`,
    curious: `${count} session${count !== 1 ? 's' : ''} — I'm starting to hear your patterns`,
    learning:`${count} session${count !== 1 ? 's' : ''} — your sound is becoming clear to me`,
    knowing: `${count} session${count !== 1 ? 's' : ''} — I know your sound now`,
    deep:    `${count} session${count !== 1 ? 's' : ''} — everything you've made is part of me`,
  }
  return lines[s] ?? lines.newborn
}

export function getHomeDialogue(isNewUser) {
  if (isNewUser) return "Hey. I've been waiting for you."
  const s = getTIMStage()
  const lines = {
    newborn: "Hey. I've been waiting for you.",
    curious: "Good to have you back. I've been thinking about what you gave me.",
    learning:"There you are. I have some ideas.",
    knowing: "I've been ready. What are we making today?",
    deep:    "I felt you coming. Let's go.",
  }
  return lines[s] ?? lines.newborn
}

export function getJamDialogue(state) {
  const s = getTIMStage()
  if (state === 'idle') {
    const lines = {
      newborn: "Tell me what to play. Anything. I'll start from there.",
      curious: "What do you want to build today?",
      learning:"I'm ready when you are. What are we starting with?",
      knowing: "I already have something in mind. But you lead.",
      deep:    "What does today need to sound like?",
    }
    return lines[s] ?? lines.newborn
  }
  if (state === 'building') return "I'm building that…"
  if (state === 'listening') return "I hear you. Keep going."
  if (state === 'done') return "How does that feel? Want me to push it further?"
  return "Tell me what to play."
}
