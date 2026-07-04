import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Trash2, Brain } from 'lucide-react'
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
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white border border-[#C8D4EC]
                        flex items-center justify-center mic-idle knob">
          <Mic size={28} className="text-[#B8C8E0]" />
        </div>
        <TIMVoice line="No memories yet. Go make something." className="max-w-xs" />
        <button
          onClick={() => navigate('/record')}
          className="px-6 py-3 bg-[#4A8FD9] text-white font-medium rounded-full
                     hover:bg-[#3A7FC9] transition-all knob"
        >
          Start recording
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-10 gap-6 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1A2038] font-bold text-xl">TIM's Memory</h2>
          <p className="text-[#8A9AB8] text-sm">
            {getMemoryDialogue(memories.length)}
          </p>
        </div>
        <button
          onClick={() => navigate('/record')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#C8D4EC]
                     text-[#5A6A8A] text-sm rounded-full hover:border-[#6A9FD8]
                     hover:text-[#1A2038] transition-all"
        >
          <Mic size={14} /> New session
        </button>
      </div>

      {/* TIM's voice */}
      <TIMVoice line={timLine} className="text-sm" dim />

      {/* Memory cards */}
      <div className="flex flex-col gap-4">
        {memories.map((mem, idx) => (
          <div
            key={mem.id}
            className="bg-white border border-[#C8D4EC] rounded-2xl p-5
                       hover:border-[#6A9FD8] transition-all duration-200 card-enter"
            style={{ animationDelay: `${idx * 0.07}s` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#4A8FD9] font-semibold text-sm">
                    {mem.style?.label || 'Session'}
                  </span>
                  <span className="text-[#B8C8E0] text-xs">·</span>
                  <span className="text-[#8A9AB8] text-xs">{mem.date}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-[#D6E8F8] text-[#4A8FD9] px-2 py-0.5
                                     rounded-full font-medium border border-[#B8C8E0]">
                      Latest
                    </span>
                  )}
                </div>

                {/* Mini static waveform — silver on light bg */}
                <div className="flex items-end gap-px h-4 mt-1">
                  {Array.from({ length: 28 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-[#B8C8E0]"
                      style={{
                        height: `${30 + Math.sin((mem.id + i) * 0.9) * 20 + Math.sin(i * 1.7) * 15}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Elder AI brief */}
                {mem.brief && (
                  <div className="mt-2 flex items-start gap-1.5 bg-[#E4E0F8] rounded-lg px-3 py-2">
                    <Brain size={11} className="text-[#8078C8] mt-0.5 shrink-0" />
                    <p className="text-[#8078C8] text-xs leading-relaxed italic">
                      {mem.brief}
                    </p>
                  </div>
                )}

                {/* Journal note */}
                <p className="text-[#5A6A8A] text-sm mt-2 leading-relaxed">
                  "{mem.note}"
                </p>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteMemory(mem.id)}
                className="text-[#B8C8E0] hover:text-[#D95050] transition-all p-1 shrink-0"
                title="Remove memory"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Growth indicator */}
      <div className="bg-white border border-[#C8D4EC] rounded-2xl p-5 flex flex-col gap-2">
        <p className="text-[#8A9AB8] text-xs uppercase tracking-widest">TIM's growth</p>
        <div className="h-1.5 bg-[#E4EAF6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4A8FD9] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, memories.length * 10)}%` }}
          />
        </div>
        <p className="text-[#8A9AB8] text-xs">
          {memories.length < 5   && "Just getting started — the more you share, the more I learn."}
          {memories.length >= 5  && memories.length < 10 && "I'm starting to hear your patterns."}
          {memories.length >= 10 && "I know your sound now."}
        </p>
      </div>
    </div>
  )
}
