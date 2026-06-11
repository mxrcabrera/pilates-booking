'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'
import { useSession } from '@/lib/use-session'

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
  const { user } = useSession()
  const buddyName = user?.buddyName || 'Welfi'
  const chatTitle = `${buddyName}chatia`
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hola! Soy ${buddyName}, tu asistente de Pilates Booking. ¿En qué puedo ayudarte?` },
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
        body: JSON.stringify({ messages: updatedMessages, buddyName }),
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
      {/* Botón flotante */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-float-button"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
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
            className="chatbot-window"
          >
            {/* Header */}
            <div className="chatbot-header">
              <h3 className="chatbot-title">{chatTitle}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="chatbot-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <div className="chatbot-message-content">
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="chatbot-message assistant">
                  <div className="chatbot-message-content chatbot-loading">
                    <div className="chatbot-dots">
                      <span className="chatbot-dot" style={{ animationDelay: '0ms' }} />
                      <span className="chatbot-dot" style={{ animationDelay: '150ms' }} />
                      <span className="chatbot-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="chatbot-error">
                  {error}
                </div>
              )}
            </div>

            {/* Suggested prompts */}
            {showSuggestions && (
              <div className="chatbot-suggestions">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="chatbot-suggestion"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="chatbot-input">
              <form onSubmit={handleSubmit} className="chatbot-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribí tu mensaje..."
                  maxLength={500}
                  disabled={isLoading}
                  className="chatbot-input-field"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="chatbot-send"
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
