import { NavLink } from 'react-router-dom'
import { Home, Mic, Music2, NotebookPen, BookHeart, Brain, Layers } from 'lucide-react'
import { getProfileCompletion } from '../utils/timProfile'

const links = [
  { to: '/home',     label: 'Home',     Icon: Home,        elder: false },
  { to: '/record',   label: 'Record',   Icon: Mic,         elder: false },
  { to: '/jam',      label: 'Jam',      Icon: Layers,      elder: false },
  { to: '/journal',  label: 'Journal',  Icon: NotebookPen, elder: false },
  { to: '/memories', label: 'Memories', Icon: BookHeart,   elder: false },
  { to: '/elder',    label: 'Elder',    Icon: Brain,       elder: true  },
]

export default function Nav() {
  const elderPct = getProfileCompletion()

  return (
    /* Wood grain panel — the entire nav sits on warm wood */
    <nav className="wood-grain shrink-0 border-t border-[#A0714F]/20">
      {/* Top edge highlight — thin warm line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#A0714F]/40 to-transparent" />

      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {links.map(({ to, label, Icon, elder }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl
               transition-all duration-200 min-w-0
               ${isActive
                 ? elder
                   ? 'text-[#8878D0]'
                   : 'text-[#F0F4FF]'
                 : 'text-[#6A7A9A] hover:text-[#B8C8E8]'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator — glowing dot above icon */}
                {isActive && (
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: elder ? '#8878D0' : '#B8C8E8' }}
                  />
                )}

                <Icon size={18} />
                <span className="text-[10px] font-medium leading-none">{label}</span>

                {/* Elder progress pip */}
                {elder && elderPct > 0 && elderPct < 100 && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full
                                   bg-[#8878D0] ring-1 ring-[#0A0E1A]" />
                )}
                {elder && elderPct === 100 && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full
                                   bg-[#4AAEA0] ring-1 ring-[#0A0E1A]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
