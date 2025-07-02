import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Filter,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { formatDate } from '../../lib/utils'
import { markNotificationAsRead } from '../../lib/firebase'
import toast from 'react-hot-toast'

export const NotificationsPanel: React.FC = () => {
  const { notifications, getUnreadNotifications } = useAppStore()
  const [filter, setFilter] = useState<string>('all')

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return notification.type === filter
  })

  const unreadCount = getUnreadNotifications().length

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = getUnreadNotifications()
      await Promise.all(
        unreadNotifications.map(notification => 
          markNotificationAsRead(notification.id)
        )
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30'
      case 'error':
        return 'border-red-500/30'
      case 'warning':
        return 'border-amber-500/30'
      default:
        return 'border-blue-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-mwenezi-maroon" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">
            System notifications and activity updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="amber"
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-400">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`relative ${notification.read ? 'opacity-75' : ''}`}
              >
                <Card className={`bg-slate-800 border ${getNotificationBorderColor(notification.type)} ${!notification.read ? 'ring-1 ring-mwenezi-maroon/20' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className={`font-semibold ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${notification.read ? 'text-slate-500' : 'text-slate-400'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-600 mt-2">
                              {formatDate(notification.createdAt)}
                              {notification.role && (
                                <span className="ml-2 px-2 py-1 bg-slate-700 rounded-full text-xs">
                                  {notification.role}
                                </span>
                              )}
                            </p>
                          </div>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-mwenezi-amber hover:text-mwenezi-amber/80"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-mwenezi-maroon rounded-full"></div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Notifications</h3>
                <p className="text-slate-400">
                  {filter === 'all' 
                    ? 'No notifications to display'
                    : `No ${filter} notifications found`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}