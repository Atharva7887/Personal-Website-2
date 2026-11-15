import { useState } from 'react'
import { EMAIL } from '../data/site'

/** Copy the address in one tap; the label confirms what happened. */
export function CopyEmail({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }
  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? 'Copied to clipboard' : 'Copy email'}
    </button>
  )
}
