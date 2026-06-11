'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useMascot } from '@/lib/mascot-context'
import { getAnimationClass } from '@/lib/mascot'

const CROSSFADE_MS = 2500
const BUBBLE_VISIBLE_MS = 8000

export function MascotWidget() {
  const { resolved, loading, config } = useMascot()
  const [frameIndex, setFrameIndex] = useState(0)
  const [showBubble, setShowBubble] = useState(false)
  const [lastKey, setLastKey] = useState('')

  const images = resolved?.images ?? []
  const hasMultiple = images.length > 1
  const currentImage = images[frameIndex % images.length]

  const contextKey = resolved ? `${resolved.context}:${resolved.tag}` : ''

  useEffect(() => {
    if (!resolved || images.length === 0) return

    if (contextKey !== lastKey) {
      setLastKey(contextKey)
      setFrameIndex(0)
      setShowBubble(true)
      const timer = setTimeout(() => setShowBubble(false), BUBBLE_VISIBLE_MS)
      return () => clearTimeout(timer)
    }
  }, [contextKey, lastKey, resolved, images.length])

  useEffect(() => {
    if (!hasMultiple) return

    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % images.length)
    }, CROSSFADE_MS)

    return () => clearInterval(timer)
  }, [hasMultiple, images.length, contextKey])

  if (loading || !resolved || !currentImage) return null

  const buddyName = config?.buddyName ?? 'Welfi'
  const animationClass = getAnimationClass(resolved.context)

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes mascotFloatZen {
          0%, 100% { transform: translateY(4px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes mascotFloatPeace {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes mascotFloatCelebrate {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.05); }
          50% { transform: translateY(-2px) scale(0.98); }
          70% { transform: translateY(-8px) scale(1.03); }
        }
        @keyframes mascotPopIn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          70% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mascotCrossfadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mascot-float-zen { animation: mascotFloatZen 3s infinite ease-in-out; }
        .mascot-float-peace { animation: mascotFloatPeace 2s infinite ease-in-out; }
        .mascot-float-celebrate { animation: mascotFloatCelebrate 1.5s infinite ease-in-out; }
        .mascot-pop { animation: mascotPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .mascot-crossfade { animation: mascotCrossfadeIn 0.6s ease-in-out; }
        .mascot-widget {
          position: fixed;
          bottom: 5.5rem;
          right: 1.25rem;
          z-index: 40;
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .mascot-widget {
            bottom: 5rem;
            right: 0.75rem;
            max-width: calc(100vw - 5rem);
          }
        }
      `}} />

      <div className="mascot-widget mascot-pop" aria-label={`Mascota ${buddyName}`}>
        {showBubble && (
          <div
            className="relative bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500"
            style={{ padding: '12px 18px', maxWidth: '220px' }}
          >
            <div className="absolute -right-1.5 bottom-6 w-3 h-3 bg-background/95 border-r border-t border-border/50 rotate-45" />
            <p className="font-body text-xs md:text-sm font-medium leading-relaxed text-white text-center select-none">
              {resolved.message}
            </p>
          </div>
        )}

        <div className={`${animationClass} relative w-16 h-16 md:w-20 md:h-20 shrink-0`}>
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`absolute inset-0 transition-opacity ${index === frameIndex % images.length ? 'mascot-crossfade opacity-100' : 'opacity-0'}`}
              style={{ transitionDuration: '600ms' }}
            >
              <Image
                src={img.url}
                alt={buddyName}
                fill
                className="object-contain"
                sizes="80px"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
