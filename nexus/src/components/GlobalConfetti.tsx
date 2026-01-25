import { useState, useEffect } from 'react'
import { Confetti, setGlobalConfettiTrigger } from './Confetti'

export function GlobalConfetti() {
  const [trigger, setTrigger] = useState(false)

  useEffect(() => {
    // Register the global trigger
    setGlobalConfettiTrigger(() => {
      setTrigger(true)
    })
  }, [])

  const handleComplete = () => {
    setTrigger(false)
  }

  return <Confetti trigger={trigger} onComplete={handleComplete} />
}
