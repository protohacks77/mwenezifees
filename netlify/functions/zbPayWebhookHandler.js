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
    console.log('ZbPay Webhook received:', event.body)
    
    const webhookData = JSON.parse(event.body)
    const { orderReference, status, paymentStatus, transactionId, amount } = webhookData

    if (!orderReference) {
      console.error('Missing orderReference in webhook')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing orderReference' })
      }
    }

    // Find transaction by orderReference
    const transactionsSnapshot = await db.ref('transactions').orderByChild('orderReference').equalTo(orderReference).once('value')
    
    if (!transactionsSnapshot.exists()) {
      console.error('Transaction not found for orderReference:', orderReference)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction not found' })
      }
    }

    // Get the transaction (should be only one)
    let transaction = null
    let transactionKey = null
    
    transactionsSnapshot.forEach((child) => {
      transaction = child.val()
      transactionKey = child.key
    })

    if (!transaction) {
      console.error('No transaction data found')
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Transaction data not found' })
      }
    }

    // Check if already processed
    if (transaction.status === 'ZB Payment Successful (Webhook)' || 
        transaction.status === 'ZB Payment Failed (Webhook)') {
      console.log('Transaction already processed by webhook')
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Already processed' })
      }
    }

    const finalStatus = status || paymentStatus

    if (finalStatus === 'PAID' || finalStatus === 'SUCCESS' || finalStatus === 'SUCCESSFUL') {
      // Payment successful
      try {
        await updateStudentFinancials(transaction.studentId, transaction.termKey, transaction.amount)
        
        // Update transaction status
        await db.ref(`transactions/${transactionKey}`).update({
          status: 'ZB Payment Successful (Webhook)',
          webhookData,
          updatedAt: new Date().toISOString()
        })

        // Get student info for notification
        const studentSnapshot = await db.ref(`students/${transaction.studentId}`).once('value')
        const student = studentSnapshot.val()

        // Create admin notification
        await createNotification(
          'ZbPay Payment Confirmed',
          `ZbPay payment of $${transaction.amount} for ${student.name} ${student.surname} confirmed via webhook. Ref: ${orderReference}`,
          'success'
        )

        console.log('Webhook processed successfully - payment confirmed')

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Webhook processed successfully' })
        }
      } catch (error) {
        console.error('Error processing successful webhook:', error)
        
        // Update transaction with error
        await db.ref(`transactions/${transactionKey}`).update({
          status: 'ZB Payment Webhook Error',
          error: error.message,
          webhookData,
          updatedAt: new Date().toISOString()
        })

        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to process successful payment' })
        }
      }
    } else if (finalStatus === 'FAILED' || finalStatus === 'CANCELED' || finalStatus === 'CANCELLED') {
      // Payment failed
      await db.ref(`transactions/${transactionKey}`).update({
        status: 'ZB Payment Failed (Webhook)',
        webhookData,
        updatedAt: new Date().toISOString()
      })

      console.log('Webhook processed - payment failed')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Webhook processed - payment failed' })
      }
    } else {
      // Unknown status
      await db.ref(`transactions/${transactionKey}`).update({
        status: 'ZB Payment Unknown Status (Webhook)',
        webhookData,
        updatedAt: new Date().toISOString()
      })

      console.log('Webhook processed - unknown status:', finalStatus)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Webhook processed - unknown status' })
      }
    }

  } catch (error) {
    console.error('Error processing ZbPay webhook:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}