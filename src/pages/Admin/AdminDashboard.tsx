import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Receipt,
  UserPlus,
  Bell,
  Activity
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatCurrency, formatDate } from '../../lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const AdminDashboard: React.FC = () => {
  const { students, transactions, getUnreadNotifications } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const dashboardStats = useMemo(() => {
    const totalStudents = students.length
    const totalBalance = students.reduce((sum, s) => sum + s.financials.balance, 0)
    const studentsInArrears = students.filter(s => s.financials.balance > 0).length
    const completedTransactions = transactions.filter(t => 
      t.status === 'Completed' || t.status.includes('Successful')
    ).length

    return {
      totalStudents,
      totalBalance,
      studentsInArrears,
      completedTransactions
    }
  }, [students, transactions])

  const recentActivity = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [transactions])

  const weeklyPayments = useMemo(() => {
    const now = new Date()
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const data = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayName = weekDays[date.getDay()]
      
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt)
        return tDate.toDateString() === date.toDateString() && 
               (t.status === 'Completed' || t.status.includes('Successful'))
      })
      
      const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0)
      
      data.push({
        day: dayName,
        amount: amount
      })
    }

    return data
  }, [transactions])

  const unreadNotifications = getUnreadNotifications()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.profile?.name || user?.username}
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/students/new')}
          variant="maroon"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Students"
          value={dashboardStats.totalStudents}
          icon={Users}
          description="Currently enrolled"
          onClick={() => navigate('/admin/students')}
        />
        <DashboardCard
          title="Outstanding Balance"
          value={formatCurrency(dashboardStats.totalBalance)}
          icon={DollarSign}
          description="Total fees due"
          trend={{
            value: -5.2,
            isPositive: false
          }}
        />
        <DashboardCard
          title="Students in Arrears"
          value={dashboardStats.studentsInArrears}
          icon={AlertCircle}
          description="Need follow-up"
          onClick={() => navigate('/admin/students?filter=arrears')}
        />
        <DashboardCard
          title="Completed Payments"
          value={dashboardStats.completedTransactions}
          icon={Receipt}
          description="This month"
          trend={{
            value: 12.5,
            isPositive: true
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Payments Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-mwenezi-maroon" />
              Weekly Payment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPayments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                  formatter={(value) => [formatCurrency(value as number), 'Amount']}
                />
                <Bar dataKey="amount" fill="#6D282C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-mwenezi-maroon" />
                Recent Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/transactions')}
                className="text-mwenezi-amber hover:text-mwenezi-amber/80"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((transaction) => {
                  const student = students.find(s => s.id === transaction.studentId)
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {student ? `${student.name} ${student.surname}` : 'Unknown Student'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {transaction.type === 'cash' ? 'Cash Payment' : 
                           transaction.type === 'zbpay' ? 'ZbPay Payment' : 'Fee Adjustment'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'Completed' || transaction.status.includes('Successful')
                            ? 'bg-green-400/10 text-green-400'
                            : transaction.status.includes('Pending')
                            ? 'bg-blue-400/10 text-blue-400'
                            : 'bg-red-400/10 text-red-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <p className="text-slate-400 text-center py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/students/new')}
              className="flex items-center gap-2 h-12"
            >
              <UserPlus className="w-4 h-4" />
              Add New Student
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/config')}
              className="flex items-center gap-2 h-12"
            >
              <TrendingUp className="w-4 h-4" />
              Configure Fees
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/notifications')}
              className="flex items-center gap-2 h-12 relative"
            >
              <Bell className="w-4 h-4" />
              Notifications
              {unreadNotifications.length > 0 && (
                <span className="notification-badge">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}