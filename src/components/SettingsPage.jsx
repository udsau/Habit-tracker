import { useState } from 'react'
import { Trash2, AlertTriangle, User, Calendar } from 'lucide-react'

export default function SettingsPage({ account }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleConfirmReset() {
    try {
      localStorage.removeItem('habitTrackerAccount')
      localStorage.removeItem('habitTrackerData')
      localStorage.removeItem('habitTrackerHistory')
      localStorage.removeItem('habitTrackerLastWeekStart')
      localStorage.removeItem('devFakeToday')
      localStorage.removeItem('devTestMode')
      localStorage.clear()
    } catch {
      // storage unavailable
    }
    window.location.reload()
  }

  const createdDate = account?.createdAt
    ? new Date(account.createdAt + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 w-full min-h-screen max-w-5xl font-sans">
      {/* ── Page Header ─────────────────────────────────── */}
      <div>
        <p className="text-muted text-sm mb-1">Preferences</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-muted text-sm mt-1">
          Manage your account preferences and app data storage.
        </p>
      </div>

      {/* ── Account Summary Card ─────────────────────────── */}
      {account && (
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
              <User size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-base font-semibold tracking-tight truncate">
                {account.name}
              </p>
              <div className="flex items-center gap-1.5 text-muted text-xs mt-0.5">
                <Calendar size={13} className="text-muted/70 shrink-0" />
                <span className="truncate">Tracking since {createdDate || account.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-white/5 text-muted text-xs border border-white/5 self-start sm:self-auto shrink-0">
            Local Storage Profile
          </div>
        </div>
      )}

      {/* ── Danger Zone / Reset Option ───────────────────── */}
      <div className="bg-surface rounded-2xl p-4 sm:p-6 border border-danger/20 flex flex-col gap-4 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Data Management
          </h2>
          <p className="text-muted text-xs mt-0.5">
            Control the persistence of your local habit tracker records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/60 border border-white/5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-danger/15 text-danger flex items-center justify-center shrink-0 border border-danger/20">
              <Trash2 size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-danger text-sm font-semibold tracking-tight">
                Reset All Data
              </p>
              <p className="text-muted text-xs mt-0.5 max-w-md">
                Permanently delete all your habits, history, and account info from this browser.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-danger/15 hover:bg-danger text-danger hover:text-white border border-danger/30 text-xs font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* ── Confirmation Modal ───────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-surface border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 sm:mx-auto shadow-2xl relative flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-danger/15 text-danger flex items-center justify-center border border-danger/30 shrink-0">
                <AlertTriangle size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 id="modal-title" className="text-lg font-bold text-white tracking-tight">
                  Reset All Data?
                </h3>
                <p className="text-danger/90 text-xs font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-muted text-sm leading-relaxed">
              This cannot be undone. All your habits and progress will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-xs font-semibold shadow-lg shadow-danger/20 transition-all cursor-pointer"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
