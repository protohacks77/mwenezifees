import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  DollarSign, 
  Receipt, 
  Download,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { formatCurrency, formatDate } from '../../lib/utils'

export const DailyReconciliation: React.FC = () => {
  const { transactions, students } = useAppStore()
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const reconciliationData = useMemo(() => {
    const dateTransactions = transactions.filter(t => 
      t.type === 'cash' && 
      t.bursarId === user?.id &&
      new Date(t.createdAt).toDateString() === new Date(selectedDate).toDateString()
    )

    const totalAmount = dateTransactions.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = dateTransactions.length

    // Group by term
    const termBreakdown = dateTransactions.reduce((acc, t) => {
      const termKey = t.termKey || 'Unknown'
      if (!acc[termKey]) {
        acc[termKey] = { count: 0, amount: 0, transactions: [] }
      }
      acc[termKey].count += 1
      acc[termKey].amount += t.amount
      acc[termKey].transactions.push(t)
      return acc
    }, {} as Record<string, { count: number; amount: number; transactions: any[] }>)

    return {
      transactions: dateTransactions,
      totalAmount,
      transactionCount,
      termBreakdown
    }
  }, [transactions, user, selectedDate])

  const exportToCSV = () => {
    const headers = ['Time', 'Student', 'Student Number', 'Term', 'Amount', 'Receipt Number']
    const csvData = reconciliationData.transactions.map(transaction => {
      const student = students.find(s => s.id === transaction.studentId)
      return [
        new Date(transaction.createdAt).toLocaleTimeString(),
        student ? `${student.name} ${student.surname}` : 'Unknown',
        student?.studentNumber || 'N/A',
        transaction.termKey?.replace('_', ' ') || 'N/A',
        transaction.amount,
        transaction.receiptNumber || 'N/A'
      ]
    })

    const csvContent = [
      [`Daily Reconciliation Report - ${selectedDate}`],
      [`Bursar: ${user?.username}`],
      [`Total Transactions: ${reconciliationData.transactionCount}`],
      [`Total Amount: ${reconciliationData.totalAmount}`],
      [],
      headers,
      ...csvData
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `daily-reconciliation-${selectedDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Daily Reconciliation</h1>
          <p className="text-slate-400 mt-1">
            Review cash payments processed by {user?.username}
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="amber"
          className="flex items-center gap-2"
          disabled={reconciliationData.transactionCount === 0}
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Date Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-mwenezi-maroon" />
            <div className="flex items-center gap-4">
              <Label htmlFor="date" className="text-slate-200">
                Select Date:
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white w-48"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Transactions"
          value={reconciliationData.transactionCount}
          icon={Receipt}
          description={`On ${new Date(selectedDate).toLocaleDateString()}`}
        />
        <DashboardCard
          title="Total Amount"
          value={formatCurrency(reconciliationData.totalAmount)}
          icon={DollarSign}
          description="Cash collected"
        />
        <DashboardCard
          title="Average Transaction"
          value={reconciliationData.transactionCount > 0 
            ? formatCurrency(reconciliationData.totalAmount / reconciliationData.transactionCount)
            : formatCurrency(0)
          }
          icon={TrendingUp}
          description="Per transaction"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Term Breakdown */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-mwenezi-maroon" />
              Breakdown by Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.keys(reconciliationData.termBreakdown).length > 0 ? (
                Object.entries(reconciliationData.termBreakdown).map(([termKey, data]) => (
                  <motion.div
                    key={termKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {termKey.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-slate-400">
                        {data.count} transaction{data.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">
                        {formatCurrency(data.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No transactions for selected date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-mwenezi-maroon" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reconciliationData.transactions.length > 0 ? (
                reconciliationData.transactions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((transaction) => {
                    const student = students.find(s => s.id === transaction.studentId)
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4 text-mwenezi-maroon" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">
                              {student ? `${student.name} ${student.surname}` : 'Unknown Student'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(transaction.createdAt).toLocaleTimeString()} • {transaction.termKey?.replace('_', ' ')}
                            </p>
                            {transaction.receiptNumber && (
                              <p className="text-xs text-slate-500">
                                Receipt: {transaction.receiptNumber}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400 text-sm">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No transactions for selected date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}