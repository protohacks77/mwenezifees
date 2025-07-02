import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, DollarSign, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Student } from '../../lib/firebase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

const adjustmentSchema = z.object({
  termKey: z.string().min(1, 'Please select a term'),
  adjustmentAmount: z.number().min(0.01, 'Amount must be greater than 0'),
  adjustmentType: z.enum(['Credit', 'Debit'], {
    required_error: 'Please select adjustment type'
  }),
  reason: z.string().min(1, 'Reason is required')
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

interface FeeAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student
}

export const FeeAdjustmentModal: React.FC<FeeAdjustmentModalProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema)
  })

  const adjustmentType = watch('adjustmentType')
  const adjustmentAmount = watch('adjustmentAmount')

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!user) {
      toast.error('Admin authentication required')
      return
    }

    setLoading(true)
    try {
      // Convert to signed amount (negative for credit, positive for debit)
      const signedAmount = data.adjustmentType === 'Credit' ? -data.adjustmentAmount : data.adjustmentAmount

      const response = await fetch('/.netlify/functions/applyFeeAdjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          adjustmentAmount: signedAmount,
          termKey: data.termKey,
          reason: data.reason,
          adjustmentType: data.adjustmentType,
          adminId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fee adjustment applied successfully!')
        reset()
        onClose()
      } else {
        toast.error(result.error || 'Failed to apply adjustment')
      }
    } catch (error) {
      console.error('Error applying adjustment:', error)
      toast.error('Failed to apply adjustment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-mwenezi-maroon" />
            Apply Fee Adjustment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Student</p>
            <p className="font-medium text-white">{student.name} {student.surname}</p>
            <p className="text-sm text-slate-500">{student.studentNumber}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Term *</Label>
            <Select onValueChange={(value) => setValue('termKey', value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(student.financials.terms).map(([termKey, term]) => (
                  <SelectItem key={termKey} value={termKey}>
                    {termKey.replace('_', ' ')} - Current Fee: {formatCurrency(term.fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.termKey && (
              <p className="text-red-400 text-sm">{errors.termKey.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Type *</Label>
              <Select onValueChange={(value) => setValue('adjustmentType', value as 'Credit' | 'Debit')}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">Credit (Reduce Fee)</SelectItem>
                  <SelectItem value="Debit">Debit (Increase Fee)</SelectItem>
                </SelectContent>
              </Select>
              {errors.adjustmentType && (
                <p className="text-red-400 text-sm">{errors.adjustmentType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentAmount" className="text-slate-200">
                Amount *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="adjustmentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                  {...register('adjustmentAmount', { valueAsNumber: true })}
                />
              </div>
              {errors.adjustmentAmount && (
                <p className="text-red-400 text-sm">{errors.adjustmentAmount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-slate-200">
              Reason *
            </Label>
            <Input
              id="reason"
              placeholder="Enter reason for adjustment"
              className="bg-slate-700 border-slate-600 text-white"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-red-400 text-sm">{errors.reason.message}</p>
            )}
          </div>

          {adjustmentType && adjustmentAmount && (
            <div className={`p-3 rounded-lg ${adjustmentType === 'Credit' ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}`}>
              <p className={`text-sm font-medium ${adjustmentType === 'Credit' ? 'text-green-300' : 'text-red-300'}`}>
                {adjustmentType === 'Credit' ? 'Fee will be reduced by' : 'Fee will be increased by'} {formatCurrency(adjustmentAmount)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
                  Applying...
                </>
              ) : (
                'Apply Adjustment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}