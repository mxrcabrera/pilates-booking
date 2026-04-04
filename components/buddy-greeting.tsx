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

export function BuddyGreeting({ status, urls }: BuddyGreetingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  // Determinar la imagen principal a usar basada en fallbacks.
  let buddyImage = null
  if (status === 'zen' && urls.zen) buddyImage = urls.zen
  else if (status === 'celebrate' && urls.celebrate) buddyImage = urls.celebrate
  else if (status === 'peace' && urls.greeting) buddyImage = urls.greeting
  
  if (!buddyImage) {
    buddyImage = urls.greeting || urls.celebrate || urls.zen
  }

  useEffect(() => {
    if (!buddyImage) return

    if (!hasShown) {
      setIsVisible(true)
      setHasShown(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 8000) // Un poco más de tiempo para apreciar la animación

      return () => clearTimeout(timer)
    }
  }, [hasShown, buddyImage])

  if (!buddyImage || !isVisible) return null

  let message = '¡Hola! Lista para el día'
  if (status === 'zen') {
    message = '¡Día libre, modo zen activado!'
  } else if (status === 'celebrate') {
    message = '¡Genial! Ya terminamos por hoy'
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes buddyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes buddyPopIn { 
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          70% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes poseCycle { 0%, 30%, 100% { opacity: 1; } 33%, 97% { opacity: 0; } }
        @keyframes poseCycleAlt { 0%, 30%, 66%, 100% { opacity: 0; } 33%, 63% { opacity: 1; } }
        @keyframes poseCycleAlt2 { 0%, 63%, 97%, 100% { opacity: 0; } 66%, 96% { opacity: 1; } }
        
        .buddy-float { animation: buddyFloat 3s infinite ease-in-out; }
        .buddy-pop { animation: buddyPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .buddy-frame { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; }
        .buddy-frame-1 { animation: poseCycle 9s infinite; }
        .buddy-frame-2 { animation: poseCycleAlt 9s infinite; opacity: 0; }
        .buddy-frame-3 { animation: poseCycleAlt2 9s infinite; opacity: 0; }
      `}} />
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex items-center gap-4 md:gap-5 pointer-events-none buddy-pop">
        {/* Burbuja de diálogo Refinada (Tailwind) */}
        <div className="relative bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl min-h-[60px] flex items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Flecha (Rotated Square for precision) */}
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-background/95 border-r border-t border-border/50 rotate-45" />
          
          <p className="font-body text-xs md:text-sm font-medium leading-relaxed text-white text-center select-none px-12 py-4">
            {message}
          </p>
        </div>

        {/* Contenedor del Personaje */}
        <div className="relative w-20 h-20 md:w-28 md:h-28 flex-shrink-0 group pointer-events-auto">
          {/* Aura suave */}
          <div className="absolute inset-[-10px] bg-primary/10 rounded-full blur-2xl animate-pulse" />
          
          <div className="buddy-float relative w-full h-full">
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Pose 1: Base */}
              <div className="buddy-frame buddy-frame-1">
                <Image src={buddyImage} alt="Body Base" fill className="object-contain" priority />
              </div>
              
              {/* Pose 2: Greeting/Peace */}
              {urls.greeting && urls.greeting !== buddyImage && (
                <div className="buddy-frame buddy-frame-2">
                  <Image src={urls.greeting} alt="Peace pose" fill className="object-contain" />
                </div>
              )}
              
              {/* Pose 3: Celebrate */}
              {urls.celebrate && urls.celebrate !== buddyImage && (
                <div className="buddy-frame buddy-frame-3">
                  <Image src={urls.celebrate} alt="Celebrate pose" fill className="object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
