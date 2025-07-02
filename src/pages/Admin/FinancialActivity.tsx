import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  Receipt,
  TrendingUp,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { DashboardCard } from '../../components/Common/DashboardCard'
import { formatCurrency, formatDate, getPaymentStatusColor, debounce } from '../../lib/utils'

export const FinancialActivity: React.FC = () => {
  const { transactions, students } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term)
  }, 300)

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const student = students.find(s => s.id === transaction.studentId)
      const studentName = student ? `${student.name} ${student.surname}` : ''
      
      const matchesSearch = 
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.receiptNumber && transaction.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesStatus = filterStatus === 'all' || transaction.status.toLowerCase().includes(filterStatus.toLowerCase())

      return matchesSearch && matchesType && matchesStatus
    })

    // Sort transactions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'amount':
          return b.amount - a.amount
        case 'student':
          const studentA = students.find(s => s.id === a.studentId)
          const studentB = students.find(s => s.id === b.studentId)
          const nameA = studentA ? `${studentA.name} ${studentA.surname}` : ''
          const nameB = studentB ? `${studentB.name} ${studentB.surname}` : ''
          return nameA.localeCompare(nameB)
        default:
          return 0
      }
    })

    return filtered
  }, [transactions, students, searchTerm, filterType, filterStatus, sortBy])

  const financialStats = useMemo(() => {
    const totalTransactions = transactions.length
    const completedTransactions = transactions.filter(t => 
      t.status === 'Completed' || t.status.includes('Successful')
    )
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0)
    const pendingTransactions = transactions.filter(t => t.status.includes('Pending')).length

    return {
      totalTransactions,
      totalRevenue,
      pendingTransactions,
      completedCount: completedTransactions.length
    }
  }, [transactions])

  const exportToCSV = () => {
    const headers = ['Date', 'Student', 'Student Number', 'Type', 'Amount', 'Term', 'Status', 'Receipt Number']
    const csvData = filteredTransactions.map(transaction => {
      const student = students.find(s => s.id === transaction.studentId)
      return [
        formatDate(transaction.createdAt),
        student ? `${student.name} ${student.surname}` : 'Unknown',
        student?.studentNumber || 'N/A',
        transaction.type,
        transaction.amount,
        transaction.termKey?.replace('_', ' ') || 'N/A',
        transaction.status,
        transaction.receiptNumber || 'N/A'
      ]
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financial-activity-${new Date().toISOString().split('T')[0]}.csv`
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
          <h1 className="text-3xl font-bold text-white">Financial Activity</h1>
          <p className="text-slate-400 mt-1">
            Monitor all transactions and payments
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="amber"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Transactions"
          value={financialStats.totalTransactions}
          icon={Receipt}
          description="All time"
        />
        <DashboardCard
          title="Total Revenue"
          value={formatCurrency(financialStats.totalRevenue)}
          icon={DollarSign}
          description="Completed payments"
        />
        <DashboardCard
          title="Completed Payments"
          value={financialStats.completedCount}
          icon={TrendingUp}
          description="Successful transactions"
        />
        <DashboardCard
          title="Pending Payments"
          value={financialStats.pendingTransactions}
          icon={Calendar}
          description="Awaiting confirmation"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10 bg-slate-700 border-slate-600"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="zbpay">ZbPay</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-mwenezi-maroon" />
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const student = students.find(s => s.id === transaction.studentId)
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-mwenezi-maroon" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {student ? `${student.name} ${student.surname}` : 'Unknown Student'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {student?.studentNumber} • {transaction.type.toUpperCase()} • {transaction.termKey?.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                          {transaction.receiptNumber && ` • Receipt: ${transaction.receiptNumber}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No transactions found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}