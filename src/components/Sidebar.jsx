import { Home, BarChart2, Settings } from 'lucide-react'

const navItems = [
  { id: 'home',      icon: Home,      label: 'Home' },
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { id: 'settings',  icon: Settings,  label: 'Settings' },
]

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        p-3 rounded-xl transition-colors duration-150
        ${active
          ? 'bg-accent text-white'
          : 'text-muted hover:bg-accent/20 hover:text-accent'}
      `}
    >
      <Icon size={22} strokeWidth={2} />
    </button>
  )
}

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <>
      {/* Desktop Vertical Sidebar (hidden on mobile, visible on md+) */}
      <aside className="
        hidden md:flex
        fixed left-4 top-4 bottom-4 z-20
        w-16 flex-col items-center
        bg-surface rounded-2xl py-6 gap-2
        shadow-lg
      ">
        <nav className="flex flex-col items-center gap-1 flex-1">
          {navItems.map(({ id, icon, label }) => (
            <NavButton
              key={id}
              icon={icon}
              label={label}
              active={activePage === id}
              onClick={() => setActivePage(id)}
            />
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar (visible on <md, hidden on md+) */}
      <nav className="
        md:hidden
        fixed bottom-0 left-0 right-0 z-30
        bg-surface/95 backdrop-blur-lg
        border-t border-white/10
        px-6 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]
        flex items-center justify-around
        shadow-2xl
      ">
        {navItems.map(({ id, icon, label }) => (
          <NavButton
            key={id}
            icon={icon}
            label={label}
            active={activePage === id}
            onClick={() => setActivePage(id)}
          />
        ))}
      </nav>
    </>
  )
}
