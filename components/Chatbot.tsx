'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  '¿Cuáles son mis horarios?',
  '¿Cómo cancelar una clase?',
  '¿Cuál es mi saldo?',
  '¿Cómo funciona la lista de espera?',
]

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hola! Soy el asistente de Pilates Booking. ¿En qué puedo ayudarte?' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal.')
        setIsLoading(false)
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ])
    } catch {
      setError('No se pudo conectar con el servidor. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const showSuggestions = messages.length <= 1 && !isLoading

  return (
    <>
      {/* Mascota tipo Clippy (Desktop) / Botón flotante (Mobile) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-violet-600 rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-colors"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageCircle size={24} className="text-white" />
        )}
      </motion.button>

      {/* Ventana del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-violet-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold">Asistente Pilates Booking</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-violet-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg bg-white border border-gray-200">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex justify-center">
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 px-4 pb-3 bg-gray-50">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribí tu mensaje..."
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200 disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-30 transition-all duration-200 shrink-0"
                  aria-label="Enviar"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
