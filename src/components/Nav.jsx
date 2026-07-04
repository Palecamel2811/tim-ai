import { NavLink } from 'react-router-dom'
import { Mic, Music2, BookHeart, NotebookPen } from 'lucide-react'

const links = [
  { to: '/record',   label: 'Record',   Icon: Mic          },
  { to: '/create',   label: 'Create',   Icon: Music2       },
  { to: '/journal',  label: 'Journal',  Icon: NotebookPen  },
  { to: '/memories', label: 'Memories', Icon: BookHeart    },
]

export default function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-[#F5C842] font-bold text-xl tracking-tight">TIM</span>
        <span className="text-[#F5E6C8] text-xs tracking-widest uppercase opacity-60">This Is Mine</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200
               ${isActive
                 ? 'bg-[#F5C842] text-[#0D0D0D] font-semibold'
                 : 'text-[#F5E6C8] opacity-50 hover:opacity-100'
               }`
            }
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
