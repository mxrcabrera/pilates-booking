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

  // Determinar la imagen a usar basada en fallbacks.
  // Preferimos la imagen específica del status. Si no está, intentamos la de greeting.
  // Si no, cualquier otra que exista.
  let buddyImage = null
  if (status === 'zen' && urls.zen) buddyImage = urls.zen
  else if (status === 'celebrate' && urls.celebrate) buddyImage = urls.celebrate
  else if (status === 'peace' && urls.greeting) buddyImage = urls.greeting
  
  // Fallbacks si la específica no existe
  if (!buddyImage) {
    buddyImage = urls.greeting || urls.celebrate || urls.zen
  }

  useEffect(() => {
    // Si no hay imagen, nunca lo mostramos.
    if (!buddyImage) return

    if (!hasShown) {
      setIsVisible(true)
      setHasShown(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [hasShown, buddyImage])

  // Retornar null inmediatamente si no hay imagen de buddy (evita renders rotos)
  if (!buddyImage || !isVisible) return null

  let message = '¡Hola! Lista para el día'
  if (status === 'zen') {
    message = '¡Día libre, modo zen activado!'
  } else if (status === 'celebrate') {
    message = '¡Genial! Ya terminamos por hoy'
  }

  return (
    <>
      <style>{`
        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(40px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounceSlight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .buddy-container {
          animation: slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .buddy-image {
          animation: bounceSlight 2s infinite ease-in-out;
          animation-delay: 0.6s;
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none buddy-container">
        <div className="bg-background/80 backdrop-blur-sm shadow-xl border border-[rgba(147,155,245,0.2)] rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-md buddy-image">
            <Image 
              src={buddyImage} 
              alt="Brand Mascot"
              fill
              className="object-cover"
              priority
            />
          </div>
          <p className="font-medium text-sm text-[rgba(255,255,255,0.9)] max-w-[150px] text-center">
            {message}
          </p>
        </div>
      </div>
    </>
  )
}
