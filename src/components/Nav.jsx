import { NavLink } from 'react-router-dom'
import { Mic, Music2, BookHeart, NotebookPen, Brain } from 'lucide-react'
import { getProfileCompletion } from '../utils/timProfile'

const links = [
  { to: '/record',   label: 'Record',   Icon: Mic,         elder: false },
  { to: '/create',   label: 'Create',   Icon: Music2,      elder: false },
  { to: '/journal',  label: 'Journal',  Icon: NotebookPen, elder: false },
  { to: '/memories', label: 'Memories', Icon: BookHeart,   elder: false },
  { to: '/elder',    label: 'Elder',    Icon: Brain,       elder: true  },
]

export default function Nav() {
  const elderPct = getProfileCompletion()

  return (
    <header className="flex items-center justify-between px-6 py-3.5
                       bg-white border-b border-[#C8D4EC]">
      {/* Logo mark */}
      <div className="flex items-center gap-2.5">
        {/* TIM orb — blue on light */}
        <div className="relative w-7 h-7 shrink-0">
          <div className="absolute inset-0 rounded-full bg-[#4A8FD9] opacity-20 tim-orb-pulse" />
          <div className="absolute inset-[3px] rounded-full bg-[#4A8FD9]" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[#1A2038] font-bold text-base tracking-tight">TIM</span>
          <span className="text-[#8A9AB8] text-[10px] tracking-widest uppercase hidden sm:block">
            This Is Mine
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5">
        {links.map(({ to, label, Icon, elder }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm
               transition-all duration-200 font-medium
               ${isActive
                 ? elder
                   ? 'bg-[#8078C8] text-white'
                   : 'bg-[#4A8FD9] text-white'
                 : 'text-[#5A6A8A] hover:text-[#1A2038] hover:bg-[#E4EAF6]'
               }`
            }
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
            {/* Elder progress pip */}
            {elder && elderPct > 0 && elderPct < 100 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                               bg-[#8078C8] ring-2 ring-white" />
            )}
            {elder && elderPct === 100 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                               bg-[#4AAE8C] ring-2 ring-white" />
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
