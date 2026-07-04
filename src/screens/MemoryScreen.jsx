import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Trash2 } from 'lucide-react'

export default function MemoryScreen() {
  const [memories, setMemories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tim_memories') || '[]')
    setMemories(stored)
  }, [])

  function deleteMemory(id) {
    const updated = memories.filter(m => m.id !== id)
    setMemories(updated)
    localStorage.setItem('tim_memories', JSON.stringify(updated))
  }

  if (memories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
          <Mic size={32} className="text-[#F5C842] opacity-40" />
        </div>
        <p className="text-[#F5E6C8] opacity-50 text-lg italic">
          "No memories yet. Go make something."
        </p>
        <button
          onClick={() => navigate('/record')}
          className="px-6 py-3 bg-[#F5C842] text-[#0D0D0D] font-semibold rounded-full
                     hover:bg-yellow-300 transition-all"
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
          <h2 className="text-[#F5C842] font-bold text-xl">TIM's Memory</h2>
          <p className="text-[#F5E6C8] text-sm opacity-40">
            {memories.length} session{memories.length !== 1 ? 's' : ''} — this is how I know you
          </p>
        </div>
        <button
          onClick={() => navigate('/record')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A]
                     text-[#F5E6C8] text-sm rounded-full hover:border-[#F5C842]/50 transition-all"
        >
          <Mic size={14} /> New session
        </button>
      </div>

      {/* Memory cards */}
      <div className="flex flex-col gap-4">
        {memories.map((mem, idx) => (
          <div
            key={mem.id}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5
                       hover:border-[#F5C842]/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: emoji + meta */}
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{mem.style?.emoji || '🎵'}</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5C842] font-semibold text-sm">{mem.style?.label || 'Session'}</span>
                    <span className="text-[#F5E6C8] text-xs opacity-30">·</span>
                    <span className="text-[#F5E6C8] text-xs opacity-40">{mem.date}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-[#F5C842]/20 text-[#F5C842] px-2 py-0.5 rounded-full font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                  {/* Mini static waveform */}
                  <div className="flex items-end gap-px h-4 mt-1">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-[#F5C842]"
                        style={{
                          height: `${30 + Math.sin((mem.id + i) * 0.9) * 20 + Math.sin(i * 1.7) * 15}%`,
                          opacity: 0.4,
                        }}
                      />
                    ))}
                  </div>
                  {/* Journal note */}
                  <p className="text-[#F5E6C8] text-sm opacity-70 mt-2 leading-relaxed">
                    "{mem.note}"
                  </p>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteMemory(mem.id)}
                className="text-[#F5E6C8] opacity-20 hover:opacity-60 hover:text-red-400 transition-all p-1 shrink-0"
                title="Remove memory"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Growth indicator */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col gap-2">
        <p className="text-[#F5E6C8] text-xs opacity-40 uppercase tracking-widest">TIM's growth</p>
        <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F5C842] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, memories.length * 10)}%` }}
          />
        </div>
        <p className="text-[#F5E6C8] text-xs opacity-40">
          {memories.length < 5  && "Just getting started — the more you share, the more I learn."}
          {memories.length >= 5  && memories.length < 10 && "I'm starting to hear your patterns."}
          {memories.length >= 10 && "I know your sound now."}
        </p>
      </div>
    </div>
  )
}
