import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  AlertCircle,
  Calendar,
  User,
  School,
  Clock
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatCurrency, formatDate, getPaymentStatusColor } from '../../lib/utils'

export const StudentDashboard: React.FC = () => {
  const { students, getStudentTransactions } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const student = useMemo(() => {
    return students.find(s => s.id === user?.id)
  }, [students, user])

  const transactions = useMemo(() => {
    return user ? getStudentTransactions(user.id) : []
  }, [user, getStudentTransactions])

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [transactions])

  const unpaidTerms = useMemo(() => {
    if (!student) return []
    
    return Object.entries(student.financials.terms)
      .filter(([_, term]) => term.paid < term.fee)
      .map(([termKey, term]) => ({
        termKey,
        fee: term.fee,
        paid: term.paid,
        balance: term.fee - term.paid
      }))
  }, [student])

  const dashboardStats = useMemo(() => {
    const totalBalance = student?.financials.balance || 0
    const totalPaid = transactions
      .filter(t => t.status === 'Completed' || t.status.includes('Successful'))
      .reduce((sum, t) => sum + t.amount, 0)
    const pendingPayments = transactions.filter(t => t.status.includes('Pending')).length

    return {
      totalBalance,
      totalPaid,
      pendingPayments,
      totalTransactions: transactions.length
    }
  }, [student, transactions])

  const handlePayFees = () => {
    navigate('/student/payment-process')
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Student Not Found</h3>
          <p className="text-slate-400">Unable to load student information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {student.name} {student.surname}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-slate-400">Student Number</p>
            <p className="text-lg font-semibold text-white">{student.studentNumber}</p>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-mwenezi-maroon rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-400">Grade</p>
                <p className="font-semibold text-white">{student.grade}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Type</p>
                <p className="font-semibold text-white">{student.studentType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Category</p>
                <p className="font-semibold text-white">{student.gradeCategory}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Guardian</p>
                <p className="font-semibold text-white">{student.guardianPhoneNumber}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Outstanding Balance"
          value={formatCurrency(dashboardStats.totalBalance)}
          icon={DollarSign}
          description="Total amount due"
          className={dashboardStats.totalBalance > 0 ? "border-red-500/20" : "border-green-500/20"}
        />
        <DashboardCard
          title="Total Paid"
          value={formatCurrency(dashboardStats.totalPaid)}
          icon={Receipt}
          description="Payments made"
        />
        <DashboardCard
          title="Pending Payments"
          value={dashboardStats.pendingPayments}
          icon={Clock}
          description="Awaiting confirmation"
        />
        <DashboardCard
          title="Total Transactions"
          value={dashboardStats.totalTransactions}
          icon={CreditCard}
          description="Payment history"
        />
      </div>

      {/* Outstanding Balance Alert */}
      {dashboardStats.totalBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Outstanding Fees</h3>
                    <p className="text-red-300">
                      You have {formatCurrency(dashboardStats.totalBalance)} in outstanding fees
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePayFees}
                  variant="maroon"
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Pay Fees Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid Terms */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-mwenezi-maroon" />
              Unpaid Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidTerms.length > 0 ? (
                unpaidTerms.map((term) => (
                  <motion.div
                    key={term.termKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {term.termKey.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-slate-400">
                        Paid: {formatCurrency(term.paid)} of {formatCurrency(term.fee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-400">
                        {formatCurrency(term.balance)}
                      </p>
                      <p className="text-xs text-slate-500">Due</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <School className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-green-400 font-semibold">All fees paid!</p>
                  <p className="text-slate-400 text-sm">You're up to date with your payments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-mwenezi-maroon" />
                Recent Payments
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/student/payments')}
                className="text-mwenezi-amber hover:text-mwenezi-amber/80"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {transaction.type === 'cash' ? 'Cash Payment' : 
                         transaction.type === 'zbpay' ? 'ZbPay Payment' : 'Fee Adjustment'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {transaction.termKey?.replace('_', ' ')} • {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No payment history yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {dashboardStats.totalBalance > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handlePayFees}
                variant="maroon"
                size="lg"
                className="flex-1 h-12"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Fees Online
              </Button>
              <Button
                onClick={() => navigate('/student/payments')}
                variant="outline"
                size="lg"
                className="flex-1 h-12"
              >
                <Receipt className="w-5 h-5 mr-2" />
                View Payment History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}