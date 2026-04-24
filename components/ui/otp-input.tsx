'use client'

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (otp: string) => void
  disabled?: boolean
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, ' ').split('').slice(0, 6)

  const update = (newDigits: string[]) => {
    onChange(newDigits.join('').replace(/ /g, ''))
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) return
    const char = val[val.length - 1]
    const newDigits = [...digits]
    newDigits[index] = char
    update(newDigits)
    // Advance focus
    if (index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newDigits = [...digits]
      if (newDigits[index].trim()) {
        newDigits[index] = ' '
        update(newDigits)
      } else if (index > 0) {
        newDigits[index - 1] = ' '
        update(newDigits)
        inputs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newDigits = [...digits]
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    update(newDigits)
    // Focus last filled box or last box
    const lastIndex = Math.min(pasted.length, 5)
    inputs.current[lastIndex]?.focus()
  }

  return (
    <div className="flex items-center gap-3 justify-center" role="group" aria-label="One-time password input">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputs.current[index] = el }}
          id={`otp-digit-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoComplete="one-time-code"
          className={[
            'w-12 h-14 text-center text-xl font-bold rounded-lg border-2',
            'bg-muted text-foreground',
            'transition-all duration-150',
            'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-background',
            digit.trim()
              ? 'border-primary/60'
              : 'border-border',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
