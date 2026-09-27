import { useState } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function OnboardingScreen({ onCreateAccount }) {
  const [name, setName] = useState('')

  const isValid = name.trim().length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) return
    onCreateAccount(name.trim())
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-surface rounded-2xl p-8 shadow-2xl border border-white/5 flex flex-col gap-6">
        {/* Brand icon / logo */}
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
          <Sparkles size={24} strokeWidth={2.2} />
        </div>

        {/* Headings */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to Habit Tracker
          </h1>
          <p className="text-muted text-sm mt-1">
            Let's get you set up. What should we call you?
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="userName" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Your Name
            </label>
            <input
              id="userName"
              type="text"
              autoFocus
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background rounded-xl px-4 py-3 text-white placeholder:text-muted/60
                         border border-white/10 outline-none focus:border-accent focus:ring-1 focus:ring-accent
                         transition-all text-base"
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={`
              mt-2 w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
              transition-all duration-200 shadow-lg
              ${isValid
                ? 'bg-accent hover:bg-accent/90 text-white cursor-pointer shadow-accent/20'
                : 'bg-white/5 text-muted/40 cursor-not-allowed border border-white/5 shadow-none'
              }
            `}
          >
            <span>Get Started</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  )
}
