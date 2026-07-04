import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Trash2, Brain } from 'lucide-react'
import TIMSphere from '../components/TIMSphere'
import TIMVoice from '../components/TIMVoice'
import { getMemoryDialogue } from '../utils/timPersonality'

export default function MemoryScreen() {
  const [memories, setMemories] = useState([])
  const [timLine, setTimLine]   = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    setMemories(stored)
    setTimLine(getMemoryDialogue(stored.length))
  }, [])

  function deleteMemory(id) {
    const updated = memories.filter(m => m.id !== id)
    setMemories(updated)
    localStorage.setItem('tim_memories', JSON.stringify(updated))
    setTimLine(getMemoryDialogue(updated.length))
  }

  if (memories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center fern-bg">
        <div className="relative z-10 flex flex-col items-center gap-6">
          <TIMSphere state="idle" size={120} />
          <TIMVoice line="No memories yet. Go make something." className="max-w-xs" />
          <button onClick={() => navigate('/record')}
            className="px-6 py-3 bg-[#B8C8E8]/10 border border-[#B8C8E8]/20 text-[#F0F4FF]
                       font-medium rounded-full hover:bg-[#B8C8E8]/20 transition-all knob">
            Start recording
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-5 py-8 gap-5 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#F0F4FF] font-bold text-xl">TIM's Memory</h2>
          <p className="text-[#6A7A9A] text-sm">{getMemoryDialogue(memories.length)}</p>
        </div>
        <button onClick={() => navigate('/record')}
          className="flex items-center gap-2 px-4 py-2 bg-[#12192A] border border-[#2A3550]
                     text-[#B8C8E8] text-sm rounded-full hover:border-[#6A8AC8] transition-all">
          <Mic size={14} /> New session
        </button>
      </div>

      <TIMVoice line={timLine} className="text-sm" dim />

      {/* Memory cards */}
      <div className="flex flex-col gap-3">
        {memories.map((mem, idx) => (
          <div key={mem.id}
            className="bg-[#12192A] border border-[#2A3550] rounded-2xl p-5
                       hover:border-[#B8C8E8]/20 transition-all duration-200 card-enter"
            style={{ animationDelay: `${idx * 0.06}s` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#B8C8E8] font-medium text-sm">{mem.style?.label || 'Session'}</span>
                  <span className="text-[#2A3550] text-xs">·</span>
                  <span className="text-[#6A7A9A] text-xs">{mem.date}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-[#B8C8E8]/10 text-[#B8C8E8] px-2 py-0.5
                                     rounded-full border border-[#2A3550]">Latest</span>
                  )}
                </div>

                {/* Waveform — silver tiles at rest */}
                <div className="flex items-end gap-px h-4 mt-1">
                  {Array.from({ length: 32 }, (_, i) => (
                    <div key={i} className="w-1 rounded-full bg-[#B8C8E8]"
                      style={{
                        height: `${25 + Math.sin((mem.id + i) * 0.9) * 18 + Math.sin(i * 1.7) * 12}%`,
                        opacity: 0.25,
                      }}
                    />
                  ))}
                </div>

                {mem.brief && (
                  <div className="mt-1.5 flex items-start gap-1.5 bg-[#1A1A35] rounded-lg px-3 py-2">
                    <Brain size={11} className="text-[#8878D0] mt-0.5 shrink-0" />
                    <p className="text-[#8878D0] text-xs leading-relaxed italic">{mem.brief}</p>
                  </div>
                )}

                <p className="text-[#6A7A9A] text-sm mt-1 leading-relaxed">"{mem.note}"</p>
              </div>

              <button onClick={() => deleteMemory(mem.id)}
                className="text-[#2A3550] hover:text-[#E05870] transition-all p-1 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Growth */}
      <div className="bg-[#12192A] border border-[#2A3550] rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-[#6A7A9A] text-xs uppercase tracking-widest">TIM's growth</p>
        <div className="h-1 bg-[#2A3550] rounded-full overflow-hidden">
          <div className="h-full bg-[#B8C8E8] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, memories.length * 10)}%` }} />
        </div>
        <p className="text-[#6A7A9A] text-xs">
          {memories.length < 5   && "Just getting started — the more you share, the more I learn."}
          {memories.length >= 5  && memories.length < 10 && "I'm starting to hear your patterns."}
          {memories.length >= 10 && "I know your sound now."}
        </p>
      </div>
    </div>
  )
}
