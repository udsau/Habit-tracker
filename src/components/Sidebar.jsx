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
    <aside className="
      fixed left-4 top-4 bottom-4 z-20
      w-16 flex flex-col items-center
      bg-surface rounded-2xl py-6 gap-2
      shadow-lg
    ">
      {/* Nav icons */}
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
  )
}
