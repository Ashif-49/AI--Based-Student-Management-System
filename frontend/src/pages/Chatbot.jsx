import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSend, FiUser, FiCpu, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { chatbotAPI, getApiErrorMessage } from '../services/api'
import './Chatbot.css'

const DEFAULT_PROMPTS = [
  'Who are the at-risk students?',
  'How many students are active?',
  'Explain attendance workflow',
  'How do approvals and rejection work?',
]

const createMessage = (text, sender) => ({
  id: Date.now() + Math.random(),
  text,
  sender,
  timestamp: new Date(),
})

const buildWelcomeMessage = () => (
  createMessage(
    "Hi, I am Flash AI. Ask me anything about approvals, attendance, grades, risk predictions, or quick student stats.",
    'ai'
  )
)

export default function Chatbot() {
  const [messages, setMessages] = useState([buildWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickPrompts, setQuickPrompts] = useState(DEFAULT_PROMPTS)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return

    const userMsg = createMessage(messageText, 'user')
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatbotAPI.sendMessage(messageText)
      const aiReply = typeof res.data?.reply === 'string' ? res.data.reply : 'I am here. Could you try that again in a different way?'
      const aiMsg = createMessage(aiReply, 'ai')
      setMessages((prev) => [...prev, aiMsg])

      if (Array.isArray(res.data?.suggestions) && res.data.suggestions.length > 0) {
        setQuickPrompts(res.data.suggestions.slice(0, 6))
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to get response from AI')
      setMessages((prev) => [
        ...prev,
        createMessage(`I could not respond right now. ${message}`, 'ai'),
      ])
      toast.error(message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt)
  }

  const clearChat = () => {
    setMessages([buildWelcomeMessage()])
    setInput('')
    setQuickPrompts(DEFAULT_PROMPTS)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chatbot-page animate-fadeInUp">
      <div className="page-header">
        <h1 className="page-title">AI Chatbot Assistant</h1>
        <p className="page-subtitle">Use quick prompts or ask in your own words. I can help with approvals, risk, attendance, grades, and reports.</p>
      </div>

      <div className="chatbot-top-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={clearChat} disabled={loading}>
          <FiTrash2 size={14} />
          Clear Chat
        </button>
      </div>

      <div className="glass-card chatbot-card">
        <div className="chatbot-messages">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.sender === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`chat-row chat-row-${m.sender}`}
              >
                {m.sender === 'ai' && (
                  <div className="chat-avatar chat-avatar-ai">
                    <FiCpu size={16} color="white" />
                  </div>
                )}

                <div className={`chat-bubble chat-bubble-${m.sender}`}>
                  {m.text}
                  <div className="chat-time">{formatTime(m.timestamp)}</div>
                </div>

                {m.sender === 'user' && (
                  <div className="chat-avatar chat-avatar-user">
                    <FiUser size={16} color="var(--text-secondary)" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="chat-loading">
              <div className="spinner chat-loading-spinner" />
              <span>Flash AI is thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {quickPrompts.length > 0 && (
          <div className="chatbot-prompt-strip">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chatbot-prompt-chip"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="chatbot-input-form">
          <input
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here... (example: who are the at-risk students?)"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            <FiSend size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
