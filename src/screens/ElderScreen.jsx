import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Check, ChevronRight, ChevronLeft, Volume2, Brain } from 'lucide-react'
import { getOrderedQuestions, CATEGORY_META } from '../utils/elderQuestions'
import { saveAnswer, getAnswer, getProfileDepth, getProfileCompletion } from '../utils/timProfile'
import { getElderDialogue } from '../utils/timPersonality'
import TIMVoice from '../components/TIMVoice'

// Remap Elder category colours to the new celestial palette
const ELDER_COLORS = {
  life_work:    { color: '#4A8FD9', bg: '#D6E8F8', border: '#B8C8E0', label: 'Life & Work'      },
  goals_drive:  { color: '#4AAE8C', bg: '#D6F0E8', border: '#B0D8CA', label: 'Goals & Drive'    },
  coping:       { color: '#8078C8', bg: '#E4E0F8', border: '#C0BAE8', label: 'Coping & Feeling' },
  sonic_memory: { color: '#5AA0D9', bg: '#D6ECF8', border: '#B0CCEC', label: 'Sonic Identity'   },
}

export default function ElderScreen() {
  const questions = getOrderedQuestions()

  const firstUnanswered = questions.findIndex(q => !getAnswer(q.id))
  const [currentIdx, setCurrentIdx]     = useState(firstUnanswered === -1 ? 0 : firstUnanswered)
  const [answerText, setAnswerText]     = useState('')
  const [saved, setSaved]               = useState(false)
  const [answeredIds, setAnsweredIds]   = useState(() => questions.map(q => q.id).filter(id => !!getAnswer(id)))
  const [profileDepth, setProfileDepth] = useState(getProfileDepth())
  const [timLine, setTimLine]           = useState('')

  const [recordingVoice, setRecordingVoice] = useState(false)
  const [voiceBlobUrl, setVoiceBlobUrl]     = useState(null)
  const [voiceSeconds, setVoiceSeconds]     = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const timerRef         = useRef(null)

  const question       = questions[currentIdx]
  const isAnswered     = answeredIds.includes(question?.id)
  const completion     = getProfileCompletion()
  const allDone        = answeredIds.length === questions.length

  useEffect(() => {
    if (!question) return
    const existing = getAnswer(question.id)
    setAnswerText(existing?.answer || '')
    setVoiceBlobUrl(null)
    setSaved(false)

    if (allDone) {
      setTimLine(getElderDialogue('complete'))
    } else if (profileDepth === 0 && currentIdx === 0) {
      setTimLine(getElderDialogue('intro'))
    } else {
      setTimLine(question.question)
    }
  }, [currentIdx, question?.id])

  useEffect(() => {
    setTimLine(getElderDialogue('intro'))
  }, [])

  async function startVoice() {
    chunksRef.current = []
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setVoiceBlobUrl(URL.createObjectURL(blob))
      stream.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
    recorder.start()
    setRecordingVoice(true)
    setVoiceSeconds(0)
    timerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000)
  }

  function stopVoice() {
    mediaRecorderRef.current?.stop()
    setRecordingVoice(false)
  }

  function handleSave() {
    if (!answerText.trim() && !voiceBlobUrl) return

    saveAnswer({
      questionId: question.id,
      category:   question.category,
      question:   question.question,
      answer:     answerText.trim() || '(voice note)',
      hasVoice:   !!voiceBlobUrl,
    })

    const updated = [...new Set([...answeredIds, question.id])]
    setAnsweredIds(updated)
    setProfileDepth(updated.length)
    setSaved(true)
    setTimLine(getElderDialogue('saved'))

    setTimeout(() => {
      const nextUnanswered = questions.findIndex((q, i) => i > currentIdx && !updated.includes(q.id))
      if (nextUnanswered !== -1) {
        setCurrentIdx(nextUnanswered)
      } else if (updated.length === questions.length) {
        setTimLine(getElderDialogue('complete'))
      }
    }, 1800)
  }

  function goTo(idx) {
    if (idx < 0 || idx >= questions.length) return
    setCurrentIdx(idx)
  }

  const fmt = s =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const canSave = (answerText.trim().length > 0 || voiceBlobUrl) && !saved

  if (!question) return null

  const catStyle = ELDER_COLORS[question.category] || ELDER_COLORS.life_work

  return (
    <div className="flex-1 flex flex-col px-6 py-8 gap-6 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-[#8078C8]" />
          <span className="text-[#8078C8] font-semibold text-sm">Elder AI</span>
          <span className="text-[#B8C8E0] text-xs">·</span>
          <span className="text-[#8A9AB8] text-xs">
            {answeredIds.length} of {questions.length} answered
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-[#E4EAF6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8078C8] rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-[#8078C8] text-xs font-mono">{completion}%</span>
        </div>
      </div>

      {/* TIM's voice */}
      <TIMVoice line={timLine} className="max-w-lg mx-auto" />

      {/* Question dots navigation */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {questions.map((q, i) => {
          const isAns = answeredIds.includes(q.id)
          const isCur = i === currentIdx
          const cs    = ELDER_COLORS[q.category] || ELDER_COLORS.life_work
          return (
            <button
              key={q.id}
              onClick={() => goTo(i)}
              title={q.question}
              className={`rounded-full transition-all duration-200
                ${isCur ? 'w-3 h-3 scale-125 ring-2 ring-[#8078C8]/40' : 'w-2.5 h-2.5 hover:scale-125'}
              `}
              style={{
                backgroundColor: isAns ? cs.color : '#D8E2F4',
                opacity: isCur ? 1 : isAns ? 0.75 : 0.5,
              }}
            />
          )
        })}
      </div>

      {/* Question card */}
      <div
        className="bg-white rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 border"
        style={{ borderColor: catStyle.border }}
      >
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
          >
            {catStyle.label}
          </span>
          {isAnswered && (
            <span
              className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
            >
              Answered
            </span>
          )}
        </div>

        {/* The question */}
        <p className="text-[#1A2038] text-lg leading-relaxed font-medium">
          {question.question}
        </p>

        {/* Follow-up */}
        {question.followUp && (
          <p className="text-[#8A9AB8] text-sm italic border-l-2 border-[#D8E2F4] pl-3">
            {question.followUp}
          </p>
        )}
      </div>

      {/* Write your answer */}
      <div className="flex flex-col gap-2">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">Your answer</p>
        <textarea
          value={answerText}
          onChange={e => setAnswerText(e.target.value)}
          rows={5}
          placeholder={question.placeholder}
          className="w-full bg-[#EEF2FA] border border-[#C8D4EC] rounded-xl p-4
                     text-[#1A2038] text-sm placeholder:text-[#8A9AB8] leading-relaxed
                     focus:outline-none focus:border-[#8078C8]/50 resize-none transition-colors"
        />
        {answerText.length > 0 && (
          <p className="text-[#8A9AB8] text-xs text-right">{answerText.length} characters</p>
        )}
      </div>

      {/* Or speak it */}
      <div className="flex flex-col gap-3">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">Or speak it</p>
        <div className="flex items-center gap-4">
          <button
            onClick={recordingVoice ? stopVoice : startVoice}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
              ${recordingVoice
                ? 'bg-[#D95050] scale-110 mic-recording'
                : 'bg-white border border-[#C8D4EC] hover:border-[#8078C8]/40 knob'
              }`}
          >
            {recordingVoice
              ? <Square size={18} className="text-white" />
              : <Mic size={18} className="text-[#8078C8]" />
            }
          </button>

          {recordingVoice && (
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 h-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-[#8078C8] wave-bar"
                    style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.07}s` }}
                  />
                ))}
              </div>
              <span className="text-[#8078C8] font-mono text-sm">{fmt(voiceSeconds)}</span>
            </div>
          )}

          {voiceBlobUrl && !recordingVoice && (
            <div className="flex items-center gap-3 flex-1">
              <Volume2 size={16} className="text-[#8078C8] shrink-0" />
              <audio controls src={voiceBlobUrl} className="flex-1 h-8" />
            </div>
          )}

          {!recordingVoice && !voiceBlobUrl && (
            <p className="text-[#8A9AB8] text-xs">Tap to record your answer instead</p>
          )}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium
                    text-sm transition-all duration-300
                    ${saved
                      ? 'bg-[#8078C8]/10 border border-[#8078C8]/30 text-[#8078C8] save-burst'
                      : canSave
                      ? 'bg-[#8078C8] text-white hover:bg-[#6A68B8] knob'
                      : 'bg-white border border-[#C8D4EC] text-[#8A9AB8] cursor-not-allowed'
                    }`}
      >
        {saved
          ? <><Check size={16} /> TIM received that.</>
          : 'Give this to TIM'
        }
      </button>

      {/* Prev / Next */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => goTo(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 text-[#8A9AB8] text-sm
                     hover:text-[#5A6A8A] disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-[#B8C8E0] text-xs font-mono">
          {currentIdx + 1} / {questions.length}
        </span>
        <button
          onClick={() => goTo(currentIdx + 1)}
          disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1.5 text-[#8A9AB8] text-sm
                     hover:text-[#5A6A8A] disabled:opacity-30 transition-all"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

    </div>
  )
}
