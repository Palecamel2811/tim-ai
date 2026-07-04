import { useState, useEffect, useRef } from 'react'

/**
 * TIMVoice — TIM's animated speech bubble with typewriter effect.
 * The cursor blinks in silver-blue until the sentence completes.
 */
export default function TIMVoice({ line = '', speed = 26, className = '', dim = false }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)
  const timeoutRef                = useRef(null)
  const prevLineRef               = useRef('')

  useEffect(() => {
    if (!line) return
    if (line === prevLineRef.current) return
    prevLineRef.current = line

    setDisplayed('')
    setDone(false)
    clearTimeout(timeoutRef.current)

    let i = 0
    function type() {
      i++
      setDisplayed(line.slice(0, i))
      if (i < line.length) {
        timeoutRef.current = setTimeout(type, speed)
      } else {
        setDone(true)
      }
    }

    timeoutRef.current = setTimeout(type, 140)
    return () => clearTimeout(timeoutRef.current)
  }, [line, speed])

  return (
    <p className={`text-[#F0F4FF] text-lg text-center leading-relaxed italic
                   transition-opacity duration-500
                   ${dim ? 'opacity-35' : 'opacity-90'}
                   ${className}`}>
      "{displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[1em] bg-[#B8C8E8]
                         ml-[1px] align-middle tim-cursor" />
      )}
      {done && '"'}
    </p>
  )
}
