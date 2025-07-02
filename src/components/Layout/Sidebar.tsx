import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  GraduationCap,
  Receipt,
  TrendingUp,
  Bell,
  DollarSign,
  UserCheck,
  FileText
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface SidebarProps {
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
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
          { to: '/admin/students', icon: Users, label: 'Manage Students' },
          { to: '/admin/transactions', icon: Receipt, label: 'Financial Activity' },
          { to: '/admin/config', icon: Settings, label: 'Fee/Term Config' },
          { to: '/admin/notifications', icon: Bell, label: 'Notifications' }
        ]
      case 'bursar':
        return [
          ...baseItems,
          { to: '/bursar/payments', icon: CreditCard, label: 'Process Payments' },
          { to: '/bursar/reconciliation', icon: TrendingUp, label: 'Daily Reconciliation' }
        ]
      case 'student':
        return [
          ...baseItems,
          { to: '/student/payments', icon: DollarSign, label: 'Payment History' }
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-70 bg-slate-800 border-r border-slate-700",
        "flex flex-col",
        className
      )}
    >
      {/* Logo and Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-700">
        <div className="w-10 h-10 bg-mwenezi-maroon rounded-lg flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">Mwenezi High</span>
          <span className="text-xs text-slate-400">Fees Management</span>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mwenezi-maroon/20 rounded-full flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-mwenezi-maroon" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white truncate">
              {user?.profile?.name || user?.username}
            </span>
            <span className="text-xs text-slate-400 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                "text-slate-300 hover:text-white hover:bg-slate-700",
                isActive && "bg-mwenezi-maroon text-white shadow-lg"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </motion.aside>
  )
}