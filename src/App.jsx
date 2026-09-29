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
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans overflow-x-hidden">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      {/* pl-0 on mobile, md:pl-24 clears the fixed desktop sidebar (w-16 + left-4 margin + gap) */}
      {/* pb-24 on mobile ensures bottom nav bar doesn't overlap page content */}
      <div className="flex-1 pl-0 pb-24 md:pl-24 md:pb-6 min-w-0 overflow-x-hidden">
        {renderPage()}
      </div>
    </div>
  )
}
