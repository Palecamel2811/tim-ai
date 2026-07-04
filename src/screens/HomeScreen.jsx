import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TIMSphere from '../components/TIMSphere'
import TIMVoice from '../components/TIMVoice'
import { getHomeDialogue } from '../utils/timPersonality'
import { getProfileDepth } from '../utils/timProfile'

export default function HomeScreen() {
  const [timLine, setTimLine]   = useState('')
  const [ready, setReady]       = useState(false)
  const navigate                = useNavigate()
  const isNewUser               = getProfileDepth() === 0

  useEffect(() => {
    // Let the sphere render first, then TIM speaks
    const t = setTimeout(() => {
      setTimLine(getHomeDialogue(isNewUser))
      setReady(true)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center fern-bg
                    px-6 gap-10 relative" style={{ minHeight: 0 }}>

      {/* All content sits above fern layer */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">

        {/* The sphere — centre, dominant, alive */}
        <div className={`transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <TIMSphere state="idle" size={220} />
        </div>

        {/* TIM's first words */}
        <TIMVoice line={timLine} className="max-w-xs" />

        {/* First-time CTA */}
        {isNewUser && ready && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              onClick={() => navigate('/record')}
              className="px-8 py-3 bg-[#B8C8E8]/10 border border-[#B8C8E8]/30
                         text-[#F0F4FF] text-sm font-medium rounded-full
                         hover:bg-[#B8C8E8]/20 transition-all knob"
            >
              Start with a hum
            </button>
            <button
              onClick={() => navigate('/elder')}
              className="text-[#6A7A9A] text-xs hover:text-[#B8C8E8] transition-colors"
            >
              or let TIM get to know you first
            </button>
          </div>
        )}

        {/* Returning user — quick actions */}
        {!isNewUser && ready && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => navigate('/record')}
              className="px-5 py-2.5 bg-[#B8C8E8]/10 border border-[#B8C8E8]/20
                         text-[#F0F4FF] text-sm rounded-full hover:bg-[#B8C8E8]/20 transition-all"
            >
              Record
            </button>
            <button
              onClick={() => navigate('/jam')}
              className="px-5 py-2.5 bg-[#7A9FD9]/20 border border-[#7A9FD9]/30
                         text-[#B8C8E8] text-sm rounded-full hover:bg-[#7A9FD9]/30 transition-all"
            >
              Jam with TIM
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
