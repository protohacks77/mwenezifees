import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  GraduationCap,
  DollarSign,
  Receipt,
  Edit,
  Plus,
  Printer,
  Calendar,
  CreditCard
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { formatCurrency, formatDate, getPaymentStatusColor, printReceipt } from '../../lib/utils'
import { FeeAdjustmentModal } from '../../components/Admin/FeeAdjustmentModal'

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { students, getStudentTransactions } = useAppStore()
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false)

  const student = useMemo(() => {
    return students.find(s => s.id === id)
  }, [students, id])

  const transactions = useMemo(() => {
    return id ? getStudentTransactions(id) : []
  }, [id, getStudentTransactions])

  const termBreakdown = useMemo(() => {
    if (!student) return []
    
    return Object.entries(student.financials.terms).map(([termKey, term]) => ({
      termKey,
      fee: term.fee,
      paid: term.paid,
      balance: term.fee - term.paid
    }))
  }, [student])

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

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Student Not Found</h3>
          <p className="text-slate-400">The requested student could not be found.</p>
          <Button
            onClick={() => navigate('/admin/students')}
            variant="maroon"
            className="mt-4"
          >
            Back to Students
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/students')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {student.name} {student.surname}
            </h1>
            <p className="text-slate-400 mt-1">
              {student.studentNumber} • {student.grade}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setAdjustmentModalOpen(true)}
            variant="amber"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Apply Adjustment
          </Button>
          <Button
            onClick={() => navigate(`/admin/student/${student.id}/edit`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Student
          </Button>
        </div>
      </div>

      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-mwenezi-maroon" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Student Type</p>
                <p className="font-semibold text-white">{student.studentType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-mwenezi-amber/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-mwenezi-amber" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Grade Category</p>
                <p className="font-semibold text-white">{student.gradeCategory}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Guardian Phone</p>
                <p className="font-semibold text-white">{student.guardianPhoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${student.financials.balance > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${student.financials.balance > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <DollarSign className={`w-6 h-6 ${student.financials.balance > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Outstanding Balance</p>
                <p className={`font-bold text-lg ${student.financials.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(student.financials.balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="financial" className="data-[state=active]:bg-mwenezi-maroon">
            Financial Summary
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-mwenezi-maroon">
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-mwenezi-maroon">
            Profile Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-mwenezi-maroon" />
                Term-by-Term Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {termBreakdown.map((term) => (
                  <motion.div
                    key={term.termKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-white">
                        {term.termKey.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-slate-400">
                        Paid: {formatCurrency(term.paid)} of {formatCurrency(term.fee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${term.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(term.balance)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {term.balance > 0 ? 'Outstanding' : 'Paid'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-mwenezi-maroon" />
                Transaction History ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transaction) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-mwenezi-maroon" />
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-mwenezi-maroon" />
                Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Full Name</label>
                    <p className="text-white font-medium">{student.name} {student.surname}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Student Number</label>
                    <p className="text-white font-medium">{student.studentNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Student Type</label>
                    <p className="text-white font-medium">{student.studentType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Guardian Phone</label>
                    <p className="text-white font-medium">{student.guardianPhoneNumber}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Grade Category</label>
                    <p className="text-white font-medium">{student.gradeCategory}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Grade/Class</label>
                    <p className="text-white font-medium">{student.grade}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Created Date</label>
                    <p className="text-white font-medium">{formatDate(student.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Account Status</label>
                    <p className={`font-medium ${student.financials.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {student.financials.balance > 0 ? 'Outstanding Fees' : 'Fees Paid'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fee Adjustment Modal */}
      <FeeAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        student={student}
      />
    </div>
  )
}