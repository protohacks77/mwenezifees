import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Receipt, 
  Calendar, 
  Filter,
  Printer,
  Download,
  CreditCard,
  DollarSign
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { formatCurrency, formatDate, getPaymentStatusColor, printReceipt } from '../../lib/utils'

export const PaymentHistory: React.FC = () => {
  const { getStudentTransactions, students } = useAppStore()
  const { user } = useAuthStore()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const student = useMemo(() => {
    return students.find(s => s.id === user?.id)
  }, [students, user])

  const transactions = useMemo(() => {
    return user ? getStudentTransactions(user.id) : []
  }, [user, getStudentTransactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesStatus = filterStatus === 'all' || 
        transaction.status.toLowerCase().includes(filterStatus.toLowerCase())
      const matchesType = filterType === 'all' || transaction.type === filterType
      return matchesStatus && matchesType
    })
  }, [transactions, filterStatus, filterType])

  const paymentStats = useMemo(() => {
    const completedPayments = transactions.filter(t => 
      t.status === 'Completed' || t.status.includes('Successful')
    )
    const totalPaid = completedPayments.reduce((sum, t) => sum + t.amount, 0)
    const pendingPayments = transactions.filter(t => t.status.includes('Pending')).length

    return {
      totalTransactions: transactions.length,
      totalPaid,
      completedCount: completedPayments.length,
      pendingPayments
    }
  }, [transactions])

  const handlePrintReceipt = (transaction: any) => {
    if (!student) return

    const receiptHtml = `
      <div class="receipt">
        <div class="header">
          <h1>MWENEZI HIGH SCHOOL</h1>
          <p>"Relevant Education for Livelihood"</p>
          <p>Payment Receipt</p>
          <p>Date: ${formatDate(transaction.createdAt)}</p>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>Receipt #:</span>
          <span>${transaction.receiptNumber || transaction.id}</span>
        </div>
        <div class="row">
          <span>Student:</span>
          <span>${student.name} ${student.surname}</span>
        </div>
        <div class="row">
          <span>Student Number:</span>
          <span>${student.studentNumber}</span>
        </div>
        <div class="row">
          <span>Term:</span>
          <span>${transaction.termKey?.replace('_', ' ') || 'N/A'}</span>
        </div>
        <div class="divider"></div>
        <div class="row total">
          <span>Amount Paid:</span>
          <span>${formatCurrency(transaction.amount)}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>${transaction.type === 'cash' ? 'Cash' : transaction.type === 'zbpay' ? 'ZbPay Online' : 'Adjustment'}</span>
        </div>
        <div class="row">
          <span>Status:</span>
          <span>${transaction.status}</span>
        </div>
        <div class="divider"></div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 12px;">Thank you for your payment!</p>
          <p style="font-size: 10px;">Keep this receipt for your records</p>
        </div>
      </div>
    `

    printReceipt(receiptHtml)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Term', 'Status', 'Receipt Number']
    const csvData = filteredTransactions.map(transaction => [
      formatDate(transaction.createdAt),
      transaction.type,
      transaction.amount,
      transaction.termKey?.replace('_', ' ') || 'N/A',
      transaction.status,
      transaction.receiptNumber || 'N/A'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-history-${student?.studentNumber}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Student Not Found</h3>
          <p className="text-slate-400">Unable to load payment history.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment History</h1>
          <p className="text-slate-400 mt-1">
            View all your payment transactions and receipts
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="amber"
          className="flex items-center gap-2"
          disabled={filteredTransactions.length === 0}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Transactions"
          value={paymentStats.totalTransactions}
          icon={Receipt}
          description="All time"
        />
        <DashboardCard
          title="Total Paid"
          value={formatCurrency(paymentStats.totalPaid)}
          icon={DollarSign}
          description="Successful payments"
        />
        <DashboardCard
          title="Completed Payments"
          value={paymentStats.completedCount}
          icon={CreditCard}
          description="Processed successfully"
        />
        <DashboardCard
          title="Pending Payments"
          value={paymentStats.pendingPayments}
          icon={Calendar}
          description="Awaiting confirmation"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="zbpay">ZbPay</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-slate-400">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-mwenezi-maroon" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-mwenezi-maroon" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {transaction.type === 'cash' ? 'Cash Payment' : 
                           transaction.type === 'zbpay' ? 'ZbPay Payment' : 'Fee Adjustment'}
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
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-white">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      
                      {(transaction.status === 'Completed' || transaction.status.includes('Successful')) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReceipt(transaction)}
                          className="text-mwenezi-amber hover:text-mwenezi-amber/80"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No transactions found</p>
                <p className="text-slate-500 text-sm">
                  {filterStatus !== 'all' || filterType !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No payment history available'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}