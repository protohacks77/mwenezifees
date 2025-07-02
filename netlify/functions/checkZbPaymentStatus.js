const admin = require('firebase-admin')

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  })
}

const db = admin.database()

// ZbPay Configuration
const ZBPAY_CONFIG = {
  baseUrl: 'https://zbnet.zb.co.zw/wallet_sandbox_api/payments-gateway',
  apiKey: '3f36fd4b-3b23-4249-b65d-f39dc9df42d4',
  apiSecret: '2f2c32d7-7a32-4523-bcde-1913bf7c171d'
}

const updateStudentFinancials = async (studentId, termKey, amount) => {
  try {
    const studentRef = db.ref(`students/${studentId}`)
    const studentSnapshot = await studentRef.once('value')
    
    if (!studentSnapshot.exists()) {
      throw new Error('Student not found')
    }

    const student = studentSnapshot.val()
    const updates = {}

    // Update term payment
    const currentPaid = student.financials.terms[termKey]?.paid || 0
    updates[`financials/terms/${termKey}/paid`] = currentPaid + amount

    // Recalculate total balance
    let totalBalance = 0
    Object.entries(student.financials.terms).forEach(([key, term]) => {
      const termBalance = term.fee - (key === termKey ? currentPaid + amount : term.paid)
      totalBalance += Math.max(0, termBalance)
    })

    updates['financials/balance'] = totalBalance

    await studentRef.update(updates)
    
    return { success: true, newBalance: totalBalance }
  } catch (error) {
    console.error('Error updating student financials:', error)
    throw error
  }
}

const createNotification = async (title, message, type = 'success') => {
  try {
    const notificationRef = db.ref('notifications').push()
    await notificationRef.set({
      id: notificationRef.key,
      title,
      message,
      type,
      role: 'admin',
      read: false,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { orderRef, txId } = JSON.parse(event.body)

    if (!orderRef || !txId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing orderRef or txId' })
      }
    }

    // Get transaction from database
    const transactionSnapshot = await db.ref(`transactions/${txId}`).once('value')
    if (!transactionSnapshot.exists()) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      }
    }

    const transaction = transactionSnapshot.val()

    // If already processed, return current status
    if (transaction.status === 'ZB Payment Successful' || transaction.status === 'ZB Payment Failed') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: transaction.status.includes('Successful') ? 'PAID' : 'FAILED',
          transaction
        })
      }
    }

    // Check status with ZbPay
    console.log(`Checking ZbPay status for order: ${orderRef}`)
    
    const response = await fetch(`${ZBPAY_CONFIG.baseUrl}/payments/transaction/${orderRef}/status/check`, {
      method: 'GET',
      headers: {
        'x-api-key': ZBPAY_CONFIG.apiKey,
        'x-api-secret': ZBPAY_CONFIG.apiSecret
      }
    })

    const zbPayStatus = await response.json()
    console.log('ZbPay Status Response:', zbPayStatus)

    if (!response.ok) {
      console.error('ZbPay API Error:', zbPayStatus)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to check payment status',
          status: 'UNKNOWN'
        })
      }
    }

    const paymentStatus = zbPayStatus.status || zbPayStatus.paymentStatus

    if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS' || paymentStatus === 'SUCCESSFUL') {
      // Payment successful - update student financials
      try {
        await updateStudentFinancials(transaction.studentId, transaction.termKey, transaction.amount)
        
        // Update transaction status
        await db.ref(`transactions/${txId}`).update({
          status: 'ZB Payment Successful',
          zbPayStatusResponse: zbPayStatus,
          updatedAt: new Date().toISOString()
        })

        // Get student info for notification
        const studentSnapshot = await db.ref(`students/${transaction.studentId}`).once('value')
        const student = studentSnapshot.val()

        // Create admin notification
        await createNotification(
          'ZbPay Payment Successful',
          `ZbPay payment of $${transaction.amount} for ${student.name} ${student.surname} completed successfully. Ref: ${orderRef}`,
          'success'
        )

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: 'PAID',
            transaction: {
              ...transaction,
              status: 'ZB Payment Successful'
            }
          })
        }
      } catch (error) {
        console.error('Error processing successful payment:', error)
        
        // Update transaction with error
        await db.ref(`transactions/${txId}`).update({
          status: 'ZB Payment Processing Error',
          error: error.message,
          updatedAt: new Date().toISOString()
        })

        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Payment confirmed but failed to update student account'
          })
        }
      }
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELED' || paymentStatus === 'CANCELLED') {
      // Payment failed
      await db.ref(`transactions/${txId}`).update({
        status: 'ZB Payment Failed',
        zbPayStatusResponse: zbPayStatus,
        updatedAt: new Date().toISOString()
      })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'FAILED',
          transaction: {
            ...transaction,
            status: 'ZB Payment Failed'
          }
        })
      }
    } else {
      // Still pending or unknown status
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: 'PENDING',
          transaction
        })
      }
    }

  } catch (error) {
    console.error('Error checking ZbPay status:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}