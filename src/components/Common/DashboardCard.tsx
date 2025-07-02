import React from 'react'
import { motion } from 'framer-motion'
import { DivideIcon as LucideIcon } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  onClick?: () => void
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  onClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <Card className={cn("dashboard-card", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white"
              >
                {value}
              </motion.p>
              {description && (
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend.isPositive ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}{trend.value}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1">vs last month</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-mwenezi-maroon" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}