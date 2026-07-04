/**
 * elderQuestions.js — TIM's probing question bank.
 * 14 questions across 4 psychological categories.
 * Ordered to build depth progressively — not a survey, a conversation.
 */

export const ELDER_QUESTIONS = [
  // Life & Work
  {
    id: 'lw_01', category: 'life_work', categoryLabel: 'Life & Work',
    question: "What do you do for a living — and does it feel like you, or like something you wear?",
    followUp: "Most people separate who they are from what they do. Where do you land on that?",
    placeholder: "Take your time. No right answer here.",
  },
  {
    id: 'lw_02', category: 'life_work', categoryLabel: 'Life & Work',
    question: "What does a hard day actually look like for you?",
    followUp: "Not the surface stuff — what's the weight underneath it?",
    placeholder: "Describe it like you're telling someone who really gets you.",
  },
  {
    id: 'lw_03', category: 'life_work', categoryLabel: 'Life & Work',
    question: "What part of your life right now feels most out of your control?",
    followUp: null,
    placeholder: "No judgment. This is just between you and TIM.",
  },

  // Goals & Drive
  {
    id: 'gd_01', category: 'goals_drive', categoryLabel: 'Goals & Drive',
    question: "What are you working toward right now — the thing that actually keeps you going?",
    followUp: "Not what you're supposed to want. What you actually want.",
    placeholder: "It can be big or small. Just true.",
  },
  {
    id: 'gd_02', category: 'goals_drive', categoryLabel: 'Goals & Drive',
    question: "What would it feel like to get there? Describe the feeling, not the achievement.",
    followUp: null,
    placeholder: "Close your eyes first if that helps.",
  },
  {
    id: 'gd_03', category: 'goals_drive', categoryLabel: 'Goals & Drive',
    question: "What's the thing you keep almost starting but haven't yet?",
    followUp: "What's between you and it?",
    placeholder: "The honest version.",
  },

  // Coping & Feeling
  {
    id: 'cp_01', category: 'coping', categoryLabel: 'Coping & Feeling',
    question: "When things get heavy, what do you reach for first?",
    followUp: "Not what you think you should reach for — what you actually do.",
    placeholder: "Music, people, isolation, movement… anything.",
  },
  {
    id: 'cp_02', category: 'coping', categoryLabel: 'Coping & Feeling',
    question: "Is there a feeling you've been carrying for a long time that doesn't have a name yet?",
    followUp: "Try to describe it without naming it. What does it feel like in your body?",
    placeholder: "This one's hard. Take as long as you need.",
  },
  {
    id: 'cp_03', category: 'coping', categoryLabel: 'Coping & Feeling',
    question: "What's your relationship with stillness? Can you sit with silence, or does it make you uncomfortable?",
    followUp: null,
    placeholder: "There's no wrong answer — both are deeply human.",
  },
  {
    id: 'cp_04', category: 'coping', categoryLabel: 'Coping & Feeling',
    question: "What do you wish people understood about you that they usually don't?",
    followUp: null,
    placeholder: "Say it here. TIM is listening.",
  },

  // Sonic Identity
  {
    id: 'si_01', category: 'sonic_memory', categoryLabel: 'Sonic Identity',
    question: "What's a song that holds a specific memory — somewhere it takes you every time you hear it?",
    followUp: "Where do you go? What do you feel?",
    placeholder: "The song, the place, the feeling.",
  },
  {
    id: 'si_02', category: 'sonic_memory', categoryLabel: 'Sonic Identity',
    question: "What's the first sound you remember from your childhood?",
    followUp: "Not music necessarily. Just a sound that was just… there.",
    placeholder: "A voice, a place, a machine, the street outside.",
  },
  {
    id: 'si_03', category: 'sonic_memory', categoryLabel: 'Sonic Identity',
    question: "If your life right now had a soundtrack, what would it feel like? Not sound like — feel like.",
    followUp: "Heavy? Searching? Building? Quiet? Something else?",
    placeholder: "Describe the texture of it.",
  },
  {
    id: 'si_04', category: 'sonic_memory', categoryLabel: 'Sonic Identity',
    question: "What kind of music do you make when nobody is listening — or would make, if you could?",
    followUp: "No genre rules. Just what comes from the truest part of you.",
    placeholder: "This is what TIM is here to help you find.",
  },
]

export const CATEGORY_STYLE = {
  life_work:    { color: '#7A9FD9', bg: '#1A2A40', label: 'Life & Work'     },
  goals_drive:  { color: '#4AAEA0', bg: '#1A2A28', label: 'Goals & Drive'   },
  coping:       { color: '#8878D0', bg: '#221A40', label: 'Coping & Feeling'},
  sonic_memory: { color: '#B8C8E8', bg: '#1A2235', label: 'Sonic Identity'  },
}

export function getOrderedQuestions() {
  const order = ['lw_01','si_01','gd_01','cp_01','lw_02','si_02','gd_02','cp_02','si_03','lw_03','gd_03','cp_03','cp_04','si_04']
  return order.map(id => ELDER_QUESTIONS.find(q => q.id === id)).filter(Boolean)
}
