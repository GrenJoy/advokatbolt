import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  Bot, 
  Calendar,
  Settings,
  Scale
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Дела', href: '/cases', icon: Briefcase },
  { name: 'Клиенты', href: '/clients', icon: Users },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'ИИ Чат', href: '/ai-chat', icon: Bot },
  { name: 'Календарь', href: '/calendar', icon: Calendar },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold">LegalPro</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}