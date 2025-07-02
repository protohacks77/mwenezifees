import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { 
  subscribeToStudents, 
  subscribeToTransactions, 
  subscribeToNotifications,
  getConfig
} from '../../lib/firebase'

export const Layout: React.FC = () => {
  const { user } = useAuthStore()
  const { setStudents, setTransactions, setNotifications, setConfig } = useAppStore()

  useEffect(() => {
    let unsubscribeStudents: (() => void) | undefined
    let unsubscribeTransactions: (() => void) | undefined
    let unsubscribeNotifications: (() => void) | undefined

    const setupSubscriptions = async () => {
      // Load config
      const config = await getConfig()
      if (config) {
        setConfig(config)
      }

      // Set up real-time subscriptions
      unsubscribeStudents = subscribeToStudents(setStudents)
      unsubscribeTransactions = subscribeToTransactions(setTransactions)
      
      if (user) {
        unsubscribeNotifications = subscribeToNotifications(
          setNotifications,
          user.id,
          user.role
        )
      }
    }

    setupSubscriptions()

    return () => {
      unsubscribeStudents?.()
      unsubscribeTransactions?.()
      unsubscribeNotifications?.()
    }
  }, [user, setStudents, setTransactions, setNotifications, setConfig])

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <Sidebar />
        <main className="flex-1 ml-70">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <main className="mobile-padding">
          <div className="p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}