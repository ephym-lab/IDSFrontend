'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { OtpInput } from '@/components/ui/otp-input'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  Loader2,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
}

const RESEND_COOLDOWN = 30

export default function SignInPage() {
  const router = useRouter()
  const { signinStep1, signinStep2, resendOtp } = useAuth()

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [direction, setDirection] = useState(1) // +1 = forward, -1 = backward

  // ── Form values ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  // ── UI state ────────────────────────────────────────────────────────────
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [cooldown])

  // ── Step 1: Credentials → admin gets JWT immediately; regular user → OTP ─
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await signinStep1(email, password)
      if (!result.requiresOtp) {
        // Admin path — already authenticated
        toast.success('Welcome, Admin!', {
          description: 'Signed in with administrator privileges.',
          duration: 4000,
        })
        router.push('/dashboard')
        return
      }
      // Regular user path — OTP emailed
      toast.info('OTP Sent', { description: result.message, duration: 5000 })
      setDirection(1)
      setStep('otp')
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      setError(msg)
      toast.error('Sign in failed', { description: msg, duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await signinStep2(email, otp)
      toast.success('Welcome back!', {
        description: 'You have been signed in successfully.',
        duration: 4000,
      })
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setError(msg)
      setOtp('')
      toast.error('Verification failed', { description: msg, duration: 5000 })
    } finally {
      setIsLoading(false)
    }
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    try {
      const msg = await resendOtp(email)
      toast.info('OTP Resent', { description: msg, duration: 5000 })
      setOtp('')
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP'
      toast.error('Resend failed', { description: msg, duration: 5000 })
    }
  }

  const goBack = () => {
    setDirection(-1)
    setStep('credentials')
    setOtp('')
    setError('')
  }

  // ── Progress indicator ───────────────────────────────────────────────────
  const steps = ['Credentials', 'Verify OTP']
  const currentStepIndex = step === 'credentials' ? 0 : 1

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Network IDS</h1>
          <p className="text-muted-foreground text-sm">Secure two-step sign in</p>
        </motion.div>

        {/* Step progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-0 mb-6"
        >
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    i < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : i === currentStepIndex
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span className={[
                  'text-xs mt-1 font-medium',
                  i <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground',
                ].join(' ')}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={[
                  'h-0.5 flex-1 -mt-4 mx-1 transition-all duration-500',
                  currentStepIndex > i ? 'bg-primary' : 'bg-border',
                ].join(' ')} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Enter your credentials to receive a verification code</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <button
                    id="signin-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Continue
                      </>
                    )}
                  </button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">Don&apos;t have an account?</span>
                  </div>
                </div>
                <Link
                  href="/auth/signup"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors text-center block"
                >
                  Create Account
                </Link>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <button
                    id="back-to-credentials"
                    onClick={goBack}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Verify your identity</h2>
                    <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to</p>
                  </div>
                </div>

                {/* Email badge */}
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-4 py-2.5">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{email}</span>
                </div>

                <form onSubmit={handleOtp} className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm text-center text-muted-foreground">
                      Enter the 6-digit one-time password
                    </p>
                    <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}

                  <button
                    id="verify-otp-submit"
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify &amp; Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Didn&apos;t receive the code?</p>
                  <button
                    id="resend-otp"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className={['w-3.5 h-3.5', cooldown > 0 ? '' : ''].join(' ')} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
