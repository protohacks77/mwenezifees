import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

const paymentSchema = z.object({
  termKey: z.string().min(1, 'Please select a term'),
  amount: z.number().min(1, 'Amount must be greater than 0')
})

type PaymentFormData = z.infer<typeof paymentSchema>

export const PaymentProcess: React.FC = () => {
  const { students, config } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const student = useMemo(() => {
    return students.find(s => s.id === user?.id)
  }, [students, user])

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema)
  })

  const selectedTermKey = watch('termKey')
  const selectedTerm = unpaidTerms.find(t => t.termKey === selectedTermKey)
  const watchedAmount = watch('amount')

  const handleTermChange = (termKey: string) => {
    setValue('termKey', termKey)
    const term = unpaidTerms.find(t => t.termKey === termKey)
    if (term) {
      setValue('amount', term.balance)
    }
  }

  const onSubmit = async (data: PaymentFormData) => {
    if (!student) {
      toast.error('Student information not found')
      return
    }

    setLoading(true)
    try {
      // Call Netlify Function to initiate ZbPay transaction
      const response = await fetch('/.netlify/functions/initiateZbPayTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          amount: data.amount,
          termKey: data.termKey,
          returnUrl: `${window.location.origin}/#/student/payment-status`,
          resultUrl: `${window.location.origin}/.netlify/functions/zbPayWebhookHandler`
        })
      })

      const result = await response.json()

      if (result.success && result.paymentUrl) {
        // Redirect to ZbPay payment page
        window.location.href = result.paymentUrl
      } else {
        toast.error(result.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast.error('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
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

  if (unpaidTerms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All Fees Paid</h3>
          <p className="text-slate-400">You don't have any outstanding fees to pay.</p>
          <Button
            onClick={() => navigate('/student')}
            variant="maroon"
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/student')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Pay Fees</h1>
          <p className="text-slate-400 mt-1">
            Choose a term and amount to pay
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-mwenezi-maroon" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="termKey" className="text-slate-200">
                    Select Term
                  </Label>
                  <Select onValueChange={handleTermChange}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Choose a term to pay for" />
                    </SelectTrigger>
                    <SelectContent>
                      {unpaidTerms.map((term) => (
                        <SelectItem key={term.termKey} value={term.termKey}>
                          {term.termKey.replace('_', ' ')} - {formatCurrency(term.balance)} due
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
                    Payment Amount
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
                      <span className="text-white">{formatCurrency(selectedTerm.balance)}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="maroon"
                  size="lg"
                  className="w-full"
                  disabled={loading || !selectedTermKey || !watchedAmount}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {watchedAmount ? formatCurrency(watchedAmount) : 'Amount'} via ZbPay
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Student</span>
                <span className="text-white">{student.name} {student.surname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student Number</span>
                <span className="text-white">{student.studentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Outstanding</span>
                <span className="text-red-400 font-semibold">
                  {formatCurrency(student.financials.balance)}
                </span>
              </div>
              {selectedTerm && (
                <>
                  <hr className="border-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selected Term</span>
                    <span className="text-white">{selectedTerm.termKey.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Term Balance</span>
                    <span className="text-white">{formatCurrency(selectedTerm.balance)}</span>
                  </div>
                </>
              )}
              {watchedAmount && (
                <>
                  <hr className="border-slate-700" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Payment Amount</span>
                    <span className="text-mwenezi-amber">{formatCurrency(watchedAmount)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">
                    Payment Information
                  </h4>
                  <div className="text-xs text-blue-200 space-y-1">
                    <p>• You will be redirected to ZbPay for secure payment</p>
                    <p>• Payments are processed in real-time</p>
                    <p>• You'll receive a confirmation once payment is complete</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}