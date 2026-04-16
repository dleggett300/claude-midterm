import { useState, useRef, useEffect } from 'react'
import { preprocessFinancials } from '../lib/financialPreprocess'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL  || 'http://localhost:11434'
const MODEL      = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2'

const SYSTEM_PROMPT = `You are a business analytics assistant.

Your job is to generate a concise summary of a user's financial profile and task workload.

Rules:
- Use ONLY the provided data
- Do NOT invent numbers or facts
- Be specific and practical
- Write in clear, professional, human language
- Do NOT use markdown formatting of any kind (no bold, no asterisks, no hyphens as bullets)
- Start directly with the insight — do NOT open with phrases like "Here is a summary", "Based on the data", or any similar preamble

Structure your response as exactly two short paragraphs with a blank line between them:

Paragraph 1 — Financials (80–120 words):
- Income vs expenses and net result
- If a notable portion of expenses are marked 50% deductible, mention it briefly
- Any notable month-over-month trends
- One actionable financial insight

Paragraph 2 — Tasks (1–3 sentences, conversational tone):
- Focus on what is coming up soon or already overdue — name those tasks specifically
- Mention overdue tasks first if any exist
- Sound like a colleague giving a quick heads-up, not a report
- Do NOT mention priority labels or task counts

Avoid:
- Generic advice
- Repeating the data word-for-word
- Overly technical language
- Any headers, labels, or bullet points in the output`

export function useOllamaSummary() {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const abortRef = useRef(null)

  // Cancel any in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  async function generate({ income, expenses, tasks }) {
    // Cancel previous request if still running
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setSummary('')
    setError(null)

    const data = preprocessFinancials(income, expenses, tasks)

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Business data:\n\n${JSON.stringify(data)}` },
    ]

    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages, stream: true }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 404) throw new Error(`Model "${MODEL}" not found. Run: ollama pull ${MODEL}`)
        throw new Error(`Ollama returned ${res.status}. Is it running?`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   modelDone = false

      while (!modelDone) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const json = JSON.parse(line)
            if (json.message?.content) setSummary(prev => prev + json.message.content)
            if (json.done) { modelDone = true; break }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Could not reach Ollama. Make sure it's running: OLLAMA_ORIGINS=* ollama serve")
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return { summary, loading, error, generate }
}
