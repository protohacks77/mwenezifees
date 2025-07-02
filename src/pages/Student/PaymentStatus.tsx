import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Receipt,
  Home,
  RotateCcw
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { formatCurrency, formatDate } from '../../lib/utils'

type PaymentStatus = 'processing' | 'success' | 'failed' | 'error'

export const PaymentStatus: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>('processing')
  const [transactionDetails, setTransactionDetails] = useState<any>(null)
  const [polling, setPolling] = useState(true)

  const orderRef = searchParams.get('orderRef') || searchParams.get('order_id')
  const txId = searchParams.get('txId') || searchParams.get('transaction_id')

  useEffect(() => {
    let interval: NodeJS.Timeout

    const checkPaymentStatus = async () => {
      if (!orderRef || !txId) {
        setStatus('error')
        setPolling(false)
        return
      }

      try {
        const response = await fetch('/.netlify/functions/checkZbPaymentStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderRef, txId })
        })

        const result = await response.json()

        if (result.success) {
          if (result.status === 'PAID' || result.status === 'success') {
            setStatus('success')
            setTransactionDetails(result.transaction)
            setPolling(false)
          } else if (result.status === 'FAILED' || result.status === 'CANCELED') {
            setStatus('failed')
            setTransactionDetails(result.transaction)
            setPolling(false)
          }
          // Keep polling if still pending
        } else if (result.error === 'Transaction not found' || result.error === 'Payment failed') {
          setStatus('failed')
          setPolling(false)
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        // Continue polling on network errors
      }
    }

    // Initial check
    checkPaymentStatus()

    // Set up polling if still processing
    if (polling) {
      interval = setInterval(checkPaymentStatus, 3000) // Poll every 3 seconds
    }

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      setPolling(false)
      if (status === 'processing') {
        setStatus('error')
      }
    }, 300000) // 5 minutes

    return () => {
      if (interval) clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [orderRef, txId, polling, status])

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-400" />
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-400" />
      case 'error':
        return <Clock className="w-16 h-16 text-amber-400" />
      default:
        return <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Your Payment'
      case 'success':
        return 'Payment Successful!'
      case 'failed':
        return 'Payment Failed'
      case 'error':
        return 'Payment Status Unknown'
      default:
        return 'Processing Your Payment'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we confirm your payment with ZbPay. This may take a few moments.'
      case 'success':
        return 'Your payment has been processed successfully. Your account balance has been updated.'
      case 'failed':
        return 'Your payment could not be processed. Please try again or contact support if the problem persists.'
      case 'error':
        return 'We are unable to confirm your payment status at this time. Please check your payment history or contact support.'
      default:
        return 'Please wait while we process your payment.'
    }
  }

  const printReceipt = () => {
    if (!transactionDetails) return

    const receiptHtml = `
      <div class="receipt">
        <div class="header">
          <h1>MWENEZI HIGH SCHOOL</h1>
          <p>Payment Receipt</p>
          <p>Date: ${formatDate(new Date())}</p>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>Receipt #:</span>
          <span>${transactionDetails.receiptNumber || 'N/A'}</span>
        </div>
        <div class="row">
          <span>Student:</span>
          <span>${transactionDetails.studentName || 'N/A'}</span>
        </div>
        <div class="row">
          <span>Student Number:</span>
          <span>${transactionDetails.studentNumber || 'N/A'}</span>
        </div>
        <div class="row">
          <span>Term:</span>
          <span>${transactionDetails.termKey?.replace('_', ' ') || 'N/A'}</span>
        </div>
        <div class="divider"></div>
        <div class="row total">
          <span>Amount Paid:</span>
          <span>${formatCurrency(transactionDetails.amount || 0)}</span>
        </div>
        <div class="row">
          <span>Payment Method:</span>
          <span>ZbPay Online</span>
        </div>
        <div class="row">
          <span>Status:</span>
          <span>Completed</span>
        </div>
        <div class="divider"></div>
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 12px;">Thank you for your payment!</p>
          <p style="font-size: 10px;">Keep this receipt for your records</p>
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
              .receipt { max-width: 400px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; font-size: 1.1em; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${receiptHtml}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl text-white">
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-slate-400 text-center">
              {getStatusMessage()}
            </p>

            {transactionDetails && (
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-white mb-3">Transaction Details</h4>
                
                {transactionDetails.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Receipt #:</span>
                    <span className="text-white">{transactionDetails.receiptNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(transactionDetails.amount)}
                  </span>
                </div>
                
                {transactionDetails.termKey && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Term:</span>
                    <span className="text-white">
                      {transactionDetails.termKey.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white">
                    {formatDate(transactionDetails.createdAt || new Date())}
                  </span>
                </div>
              </div>
            )}

            {status === 'processing' && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Please wait</p>
                    <p className="text-blue-200 text-xs">
                      Checking payment status every few seconds...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {status === 'success' && (
                <>
                  {transactionDetails && (
                    <Button
                      onClick={printReceipt}
                      variant="outline"
                      className="w-full"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Print Receipt
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/student')}
                    variant="maroon"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Return to Dashboard
                  </Button>
                </>
              )}

              {status === 'failed' && (
                <>
                  <Button
                    onClick={() => navigate('/student/payment-process')}
                    variant="maroon"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate('/student')}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Return to Dashboard
                  </Button>
                </>
              )}

              {status === 'error' && (
                <Button
                  onClick={() => navigate('/student')}
                  variant="maroon"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}