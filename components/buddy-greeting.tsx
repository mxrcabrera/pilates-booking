'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { BuddyStatus } from '@/lib/use-buddy-state'

interface BuddyGreetingProps {
  status: BuddyStatus
  urls: {
    greeting: string | null
    celebrate: string | null
    zen: string | null
  }
}

const MESSAGES: Record<BuddyStatus, string[]> = {
  zen: [
    '¡Día libre, modo zen activado!',
    'Namaste. Hoy descansamos',
    'Sin clases hoy, a disfrutar',
  ],
  peace: [
    '¡Vamos con todo hoy!',
    '¡A dar lo mejor!',
    'Hoy va a ser un gran día',
  ],
  celebrate: [
    '¡Se viene el finde!',
    '¡Quedan lugares disponibles!',
    '¡Genial! Ya terminamos por hoy',
  ],
}

function getAnimationClass(status: BuddyStatus): string {
  switch (status) {
    case 'zen':
      return 'buddy-float-zen'
    case 'peace':
      return 'buddy-float-peace'
    case 'celebrate':
      return 'buddy-float-celebrate'
  }
}

export function BuddyGreeting({ status, urls }: BuddyGreetingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [lastStatus, setLastStatus] = useState<BuddyStatus | null>(null)
  const [messageIndex] = useState(() => Math.floor(Math.random() * 3))

  let buddyImage = null
  if (status === 'zen' && urls.zen) buddyImage = urls.zen
  else if (status === 'celebrate' && urls.celebrate) buddyImage = urls.celebrate
  else if (status === 'peace' && urls.greeting) buddyImage = urls.greeting

  if (!buddyImage) {
    buddyImage = urls.greeting || urls.celebrate || urls.zen
  }

  useEffect(() => {
    if (!buddyImage) return

    if (lastStatus === null || lastStatus !== status) {
      setLastStatus(status)
      setIsVisible(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [status, buddyImage, lastStatus])

  if (!buddyImage || !isVisible) return null

  // Elegir un mensaje random del array según el status
  const message = MESSAGES[status][messageIndex % MESSAGES[status].length]

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes buddyFloatZen {
          0%, 100% { transform: translateY(4px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes buddyFloatPeace {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes buddyFloatCelebrate {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.05); }
          50% { transform: translateY(-2px) scale(0.98); }
          70% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes buddyPopIn { 
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          70% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .buddy-float-zen { animation: buddyFloatZen 3s infinite ease-in-out; }
        .buddy-float-peace { animation: buddyFloatPeace 2s infinite ease-in-out; }
        .buddy-float-celebrate { animation: buddyFloatCelebrate 1.5s infinite ease-in-out; }
        .buddy-pop { animation: buddyPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .buddy-bubble { padding: 16px 24px !important; }
      `}} />
      <div className="flex items-center gap-3 md:gap-4 buddy-pop" style={{ alignSelf: 'center', marginTop: '10px' }}>
        <div className="buddy-bubble relative bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl min-h-15 flex items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-background/95 border-r border-t border-border/50 rotate-45" />
          <p className="font-body text-xs md:text-sm font-medium leading-relaxed text-white text-center select-none">
            {message}
          </p>
        </div>

        <div className="relative w-20 h-20 md:w-20 md:h-20 shrink-0 pointer-events-auto">
          <div className={`${getAnimationClass(status)} relative w-full h-full`}>
            <div className="absolute inset-0 overflow-hidden">
              <Image src={buddyImage} alt="Buddy" fill className="object-contain" priority />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}