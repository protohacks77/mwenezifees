import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Search, 
  CreditCard, 
  DollarSign, 
  Receipt,
  User,
  Loader2,
  CheckCircle,
  Printer
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { formatCurrency, debounce, printReceipt } from '../../lib/utils'
import toast from 'react-hot-toast'

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  termKey: z.string().min(1, 'Please select a term'),
  amount: z.number().min(0.01, 'Amount must be greater than 0')
})

type PaymentFormData = z.infer<typeof paymentSchema>

export const ProcessPayments: React.FC = () => {
  const { students } = useAppStore()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term)
  }, 300)

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(student => student.financials.balance > 0) // Only show students with outstanding balance
  }, [students, searchTerm])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema)
  })

  const watchedTermKey = watch('termKey')
  const watchedAmount = watch('amount')

  const selectedTerm = useMemo(() => {
    if (!selectedStudent || !watchedTermKey) return null
    return selectedStudent.financials.terms[watchedTermKey]
  }, [selectedStudent, watchedTermKey])

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student)
    setValue('studentId', student.id)
    setPaymentModalOpen(true)
  }

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) {
      toast.error('Bursar authentication required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/processCashPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: data.studentId,
          amount: data.amount,
          termKey: data.termKey,
          bursarId: user.id,
          bursarUsername: user.username
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccessData({
          ...result,
          student: selectedStudent,
          amount: data.amount,
          termKey: data.termKey
        })
        toast.success('Payment processed successfully!')
        reset()
      } else {
        toast.error(result.error || 'Failed to process payment')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReceipt = () => {
    if (!successData) return

    const receiptHtml = `
      <div class="receipt">
        <div class="header">
          <h1>MWENEZI HIGH SCHOOL</h1>
          <p>"Relevant Education for Livelihood"</p>
          <p>Cash Payment Receipt</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>Receipt #:</span>
          <span>${successData.receiptNumber}</span>
        </div>
        <div class="row">
          <span>Student:</span>
          <span>${successData.student.name} ${successData.student.surname}</span>
        </div>
        <div class="row">
          <span>Student Number:</span>
          <span>${successData.student.studentNumber}</span>
        </div>
        <div class="row">
          <span>Term:</span>
          <span>${successData.termKey.replace('_', ' ')}</span>
        </div>
        <div class="divider"></div>
        <div class="row total">
          <span>Amount Paid:</span>
          <span>${formatCurrency(successData.amount)}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>Cash</span>
        </div>
        <div class="row">
          <span>Processed By:</span>
          <span>${user?.username}</span>
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

  const closeModal = () => {
    setPaymentModalOpen(false)
    setSelectedStudent(null)
    setSuccessData(null)
    reset()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Process Cash Payments</h1>
        <p className="text-slate-400 mt-1">
          Accept and record cash payments from students
        </p>
      </div>

      {/* Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search students with outstanding balance..."
              className="pl-10 bg-slate-700 border-slate-600"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-mwenezi-maroon" />
            Students with Outstanding Balance ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-mwenezi-maroon/20 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-mwenezi-maroon" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {student.name} {student.surname}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {student.studentNumber} • {student.grade}
                      </p>
                      <p className="text-xs text-slate-500">
                        {student.studentType}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-400">
                      {formatCurrency(student.financials.balance)}
                    </p>
                    <p className="text-xs text-slate-500">Outstanding</p>
                    <Button
                      variant="maroon"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStudentSelect(student)
                      }}
                    >
                      Process Payment
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchTerm ? 'No students found matching your search' : 'No students with outstanding balance'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-mwenezi-maroon" />
              Process Cash Payment
            </DialogTitle>
          </DialogHeader>

          {successData ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
                <p className="text-slate-400">Receipt number: {successData.receiptNumber}</p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student:</span>
                  <span className="text-white">{successData.student.name} {successData.student.surname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-semibold">{formatCurrency(successData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Term:</span>
                  <span className="text-white">{successData.termKey.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">New Balance:</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(successData.newBalance)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handlePrintReceipt}
                  variant="amber"
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  onClick={closeModal}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : selectedStudent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-400">Student</p>
                <p className="font-medium text-white">{selectedStudent.name} {selectedStudent.surname}</p>
                <p className="text-sm text-slate-500">{selectedStudent.studentNumber}</p>
                <p className="text-sm text-red-400 font-semibold">
                  Outstanding: {formatCurrency(selectedStudent.financials.balance)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Term *</Label>
                <Select onValueChange={(value) => setValue('termKey', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(selectedStudent.financials.terms)
                      .filter(([_, term]) => term.paid < term.fee)
                      .map(([termKey, term]) => (
                        <SelectItem key={termKey} value={termKey}>
                          {termKey.replace('_', ' ')} - {formatCurrency(term.fee - term.paid)} due
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.termKey && (
                  <p className="text-red-400 text-sm">{errors.termKey.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-200">
                  Payment Amount *
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-400 text-sm">{errors.amount.message}</p>
                )}
                {selectedTerm && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Maximum amount:</span>
                    <span className="text-white">{formatCurrency(selectedTerm.fee - selectedTerm.paid)}</span>
                  </div>
                )}
              </div>

              {watchedAmount && selectedTerm && watchedAmount > (selectedTerm.fee - selectedTerm.paid) && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">
                    Amount exceeds outstanding balance for this term
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="maroon"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Process Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}