import { useState } from 'react'
import { useAccount } from './hooks/useAccount'
import { useHabits } from './hooks/useHabits'
import OnboardingScreen from './components/OnboardingScreen'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import AnalyticsPage from './components/AnalyticsPage'
import SettingsPage from './components/SettingsPage'

export default function App() {
  const { account, createAccount } = useAccount()
  const habitsData = useHabits()
  const [activePage, setActivePage] = useState('home')

  // One-time onboarding: if no account exists in localStorage, show onboarding screen only
  if (!account) {
    return <OnboardingScreen onCreateAccount={createAccount} />
  }

  function renderPage() {
    if (activePage === 'analytics') return <AnalyticsPage account={account} habitsData={habitsData} />
    if (activePage === 'settings') {
      return <SettingsPage account={account} />
    }
    return <Dashboard account={account} habitsData={habitsData} />
  }

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      {/* pl-24 clears the fixed sidebar (w-16 + left-4 margin + gap) */}
      <div className="flex-1 pl-24">
        {renderPage()}
      </div>
    </div>
  )
}
