import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  DollarSign,
  Bell,
  TrendingUp,
  Receipt
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

export const MobileNav: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getNavItems = () => {
    const baseItems = [
      { to: `/${user?.role}`, icon: LayoutDashboard, label: 'Dashboard' }
    ]

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { to: '/admin/students', icon: Users, label: 'Students' },
          { to: '/admin/transactions', icon: Receipt, label: 'Transactions' },
          { to: '/admin/config', icon: Settings, label: 'Config' },
          { to: '/admin/notifications', icon: Bell, label: 'Notifications' }
        ]
      case 'bursar':
        return [
          ...baseItems,
          { to: '/bursar/payments', icon: CreditCard, label: 'Payments' },
          { to: '/bursar/reconciliation', icon: TrendingUp, label: 'Reports' }
        ]
      case 'student':
        return [
          ...baseItems,
          { to: '/student/payments', icon: DollarSign, label: 'Payments' }
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  return (
    <div className="mobile-nav">
      <div className="flex items-center justify-around p-2">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
                "text-slate-400 hover:text-white",
                isActive && "text-mwenezi-maroon"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}