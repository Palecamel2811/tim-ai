import { useState, useEffect, useRef } from 'react'

/**
 * TIMVoice — TIM's animated speech bubble with typewriter effect.
 */
export default function TIMVoice({ line = '', speed = 28, className = '', dim = false }) {
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

    timeoutRef.current = setTimeout(type, 120)
    return () => clearTimeout(timeoutRef.current)
  }, [line, speed])

  return (
    <p
      className={`
        text-[#1A2038] text-lg text-center leading-relaxed italic
        transition-opacity duration-500
        ${dim ? 'opacity-40' : 'opacity-75'}
        ${className}
      `}
    >
      "{displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[1em] bg-[#4A8FD9] ml-[1px] align-middle tim-cursor" />
      )}
      {done && '"'}
    </p>
  )
}
