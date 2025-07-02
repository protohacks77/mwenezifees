import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, 
  Receipt, 
  Users, 
  TrendingUp,
  CreditCard,
  Calendar,
  Clock
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatCurrency, formatDate } from '../../lib/utils'

export const BursarDashboard: React.FC = () => {
  const { students, transactions } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const bursarStats = useMemo(() => {
    const today = new Date().toDateString()
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()

    const todayTransactions = transactions.filter(t => 
      t.type === 'cash' && 
      t.bursarId === user?.id &&
      new Date(t.createdAt).toDateString() === today
    )

    const monthlyTransactions = transactions.filter(t => 
      t.type === 'cash' && 
      t.bursarId === user?.id &&
      new Date(t.createdAt).getMonth() === thisMonth &&
      new Date(t.createdAt).getFullYear() === thisYear
    )

    const totalStudents = students.length
    const studentsWithBalance = students.filter(s => s.financials.balance > 0).length

    return {
      todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
      todayTransactions: todayTransactions.length,
      monthlyRevenue: monthlyTransactions.reduce((sum, t) => sum + t.amount, 0),
      monthlyTransactions: monthlyTransactions.length,
      totalStudents,
      studentsWithBalance
    }
  }, [transactions, students, user])

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'cash' && t.bursarId === user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [transactions, user])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bursar Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.profile?.name || user?.username}
          </p>
        </div>
        <Button
          onClick={() => navigate('/bursar/payments')}
          variant="maroon"
          className="flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Process Payment
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Today's Revenue"
          value={formatCurrency(bursarStats.todayRevenue)}
          icon={DollarSign}
          description={`${bursarStats.todayTransactions} transactions`}
        />
        <DashboardCard
          title="Monthly Revenue"
          value={formatCurrency(bursarStats.monthlyRevenue)}
          icon={TrendingUp}
          description={`${bursarStats.monthlyTransactions} transactions`}
        />
        <DashboardCard
          title="Total Students"
          value={bursarStats.totalStudents}
          icon={Users}
          description="Enrolled students"
        />
        <DashboardCard
          title="Students with Balance"
          value={bursarStats.studentsWithBalance}
          icon={Receipt}
          description="Outstanding fees"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-mwenezi-maroon" />
                Recent Cash Payments
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/bursar/reconciliation')}
                className="text-mwenezi-amber hover:text-mwenezi-amber/80"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const student = students.find(s => s.id === transaction.studentId)
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {student ? `${student.name} ${student.surname}` : 'Unknown Student'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {transaction.termKey?.replace('_', ' ')} • {formatDate(transaction.createdAt)}
                        </p>
                        {transaction.receiptNumber && (
                          <p className="text-xs text-slate-500">
                            Receipt: {transaction.receiptNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-slate-500">Cash</p>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/bursar/payments')}
                variant="maroon"
                size="lg"
                className="w-full justify-start gap-3"
              >
                <CreditCard className="w-5 h-5" />
                Process Cash Payment
              </Button>
              <Button
                onClick={() => navigate('/bursar/reconciliation')}
                variant="outline"
                size="lg"
                className="w-full justify-start gap-3"
              >
                <Calendar className="w-5 h-5" />
                Daily Reconciliation
              </Button>
            </div>

            {/* Today's Summary */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Today's Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transactions:</span>
                  <span className="text-white">{bursarStats.todayTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Revenue:</span>
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(bursarStats.todayRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}