import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Check, ChevronRight, ChevronLeft, Volume2, Brain } from 'lucide-react'
import { getOrderedQuestions, CATEGORY_STYLE } from '../utils/elderQuestions'
import { saveAnswer, getAnswer, getProfileDepth, getProfileCompletion } from '../utils/timProfile'
import { getElderDialogue } from '../utils/timPersonality'
import TIMSphere from '../components/TIMSphere'
import TIMVoice from '../components/TIMVoice'

export default function ElderScreen() {
  const questions = getOrderedQuestions()

  const firstUnanswered   = questions.findIndex(q => !getAnswer(q.id))
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

  const question   = questions[currentIdx]
  const isAnswered = answeredIds.includes(question?.id)
  const completion = getProfileCompletion()
  const allDone    = answeredIds.length === questions.length

  useEffect(() => {
    if (!question) return
    const existing = getAnswer(question.id)
    setAnswerText(existing?.answer || '')
    setVoiceBlobUrl(null)
    setSaved(false)
    if (allDone) setTimLine(getElderDialogue('complete'))
    else if (profileDepth === 0 && currentIdx === 0) setTimLine(getElderDialogue('intro'))
    else setTimLine(question.question)
  }, [currentIdx, question?.id])

  useEffect(() => { setTimLine(getElderDialogue('intro')) }, [])

  async function startVoice() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      setVoiceBlobUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: 'audio/webm' })))
      stream.getTracks().forEach(t => t.stop())
      clearInterval(timerRef.current)
    }
    recorder.start()
    setRecordingVoice(true)
    setVoiceSeconds(0)
    timerRef.current = setInterval(() => setVoiceSeconds(s => s + 1), 1000)
  }

  function stopVoice() { mediaRecorderRef.current?.stop(); setRecordingVoice(false) }

  function handleSave() {
    if (!answerText.trim() && !voiceBlobUrl) return
    saveAnswer({
      questionId: question.id, category: question.category,
      question: question.question, answer: answerText.trim() || '(voice note)',
      hasVoice: !!voiceBlobUrl,
    })
    const updated = [...new Set([...answeredIds, question.id])]
    setAnsweredIds(updated)
    setProfileDepth(updated.length)
    setSaved(true)
    setTimLine(getElderDialogue('saved'))
    setTimeout(() => {
      const next = questions.findIndex((q, i) => i > currentIdx && !updated.includes(q.id))
      if (next !== -1) setCurrentIdx(next)
      else if (updated.length === questions.length) setTimLine(getElderDialogue('complete'))
    }, 1800)
  }

  const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const canSave = (answerText.trim().length > 0 || voiceBlobUrl) && !saved

  if (!question) return null

  const cs = CATEGORY_STYLE[question.category] || CATEGORY_STYLE.life_work

  return (
    <div className="flex-1 flex flex-col px-5 py-6 gap-5 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-[#8878D0]" />
          <span className="text-[#8878D0] font-medium text-sm">Elder AI</span>
          <span className="text-[#2A3550] text-xs">·</span>
          <span className="text-[#6A7A9A] text-xs">{answeredIds.length} of {questions.length} answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1 bg-[#2A3550] rounded-full overflow-hidden">
            <div className="h-full bg-[#8878D0] rounded-full transition-all duration-700"
              style={{ width: `${completion}%` }} />
          </div>
          <span className="text-[#8878D0] text-xs font-mono">{completion}%</span>
        </div>
      </div>

      {/* Sphere — smaller, present */}
      <div className="flex flex-col items-center gap-3">
        <TIMSphere state="idle" size={100} />
        <TIMVoice line={timLine} className="max-w-lg text-base" />
      </div>

      {/* Question dots */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {questions.map((q, i) => {
          const isAns = answeredIds.includes(q.id)
          const isCur = i === currentIdx
          const qs    = CATEGORY_STYLE[q.category] || CATEGORY_STYLE.life_work
          return (
            <button key={q.id} onClick={() => { setCurrentIdx(i) }} title={q.question}
              className={`rounded-full transition-all duration-200
                ${isCur ? 'w-3 h-3 scale-125 ring-2 ring-[#8878D0]/40' : 'w-2.5 h-2.5 hover:scale-125'}`}
              style={{
                backgroundColor: isAns ? qs.color : '#2A3550',
                opacity: isCur ? 1 : isAns ? 0.75 : 0.4,
              }} />
          )
        })}
      </div>

      {/* Question card */}
      <div className="bg-[#12192A] rounded-2xl p-5 flex flex-col gap-4 border"
        style={{ borderColor: cs.color + '30' }}>
        <span className="text-xs font-medium uppercase tracking-widest px-2.5 py-1 rounded-full self-start"
          style={{ backgroundColor: cs.bg, color: cs.color }}>
          {cs.label}
        </span>
        {isAnswered && (
          <span className="text-[10px] px-2 py-0.5 rounded-full self-start font-medium"
            style={{ backgroundColor: cs.bg, color: cs.color }}>Answered</span>
        )}
        <p className="text-[#F0F4FF] text-lg leading-relaxed font-medium">{question.question}</p>
        {question.followUp && (
          <p className="text-[#6A7A9A] text-sm italic border-l-2 pl-3"
            style={{ borderColor: cs.color + '40' }}>
            {question.followUp}
          </p>
        )}
      </div>

      {/* Answer textarea */}
      <div className="flex flex-col gap-2">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">Your answer</p>
        <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} rows={5}
          placeholder={question.placeholder}
          className="w-full bg-[#0A0E1A] border border-[#2A3550] rounded-xl p-4
                     text-[#F0F4FF] text-sm placeholder:text-[#3A4A6A] leading-relaxed
                     focus:outline-none focus:border-[#8878D0]/50 resize-none transition-colors" />
        {answerText.length > 0 && (
          <p className="text-[#3A4A6A] text-xs text-right">{answerText.length} characters</p>
        )}
      </div>

      {/* Voice */}
      <div className="flex flex-col gap-3">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">Or speak it</p>
        <div className="flex items-center gap-4">
          <button onClick={recordingVoice ? stopVoice : startVoice}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
              ${recordingVoice
                ? 'bg-[#E05870] scale-110 mic-recording'
                : 'bg-[#12192A] border border-[#2A3550] hover:border-[#8878D0]/40 knob'
              }`}>
            {recordingVoice ? <Square size={18} className="text-white" /> : <Mic size={18} className="text-[#8878D0]" />}
          </button>
          {recordingVoice && (
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 h-6">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="w-1 rounded-full bg-[#8878D0] wave-bar"
                    style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <span className="text-[#8878D0] font-mono text-sm">{fmt(voiceSeconds)}</span>
            </div>
          )}
          {voiceBlobUrl && !recordingVoice && (
            <div className="flex items-center gap-3 flex-1">
              <Volume2 size={16} className="text-[#8878D0] shrink-0" />
              <audio controls src={voiceBlobUrl} className="flex-1 h-8" />
            </div>
          )}
          {!recordingVoice && !voiceBlobUrl && (
            <p className="text-[#3A4A6A] text-xs">Tap to record your answer instead</p>
          )}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={!canSave}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium
          text-sm transition-all duration-300
          ${saved
            ? 'bg-[#8878D0]/10 border border-[#8878D0]/30 text-[#8878D0] save-burst'
            : canSave
            ? 'bg-[#8878D0]/20 border border-[#8878D0]/30 text-[#F0F4FF] hover:bg-[#8878D0]/30 knob'
            : 'bg-[#12192A] border border-[#2A3550] text-[#3A4A6A] cursor-not-allowed'
          }`}>
        {saved ? <><Check size={16} /> TIM received that.</> : 'Give this to TIM'}
      </button>

      {/* Nav */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 text-[#6A7A9A] text-sm hover:text-[#B8C8E8] disabled:opacity-30 transition-all">
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-[#2A3550] text-xs font-mono">{currentIdx + 1} / {questions.length}</span>
        <button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
          disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1.5 text-[#6A7A9A] text-sm hover:text-[#B8C8E8] disabled:opacity-30 transition-all">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
