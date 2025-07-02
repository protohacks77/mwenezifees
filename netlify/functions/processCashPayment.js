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

const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `MHS-${timestamp}-${random}`
}

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const createNotification = async (title, message, type = 'info', userId = null, role = null) => {
  try {
    const notificationRef = db.ref('notifications').push()
    await notificationRef.set({
      id: notificationRef.key,
      title,
      message,
      type,
      userId,
      role,
      read: false,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { studentId, amount, termKey, bursarId, bursarUsername } = JSON.parse(event.body)

    // Validation
    if (!studentId || !amount || !termKey || !bursarId || !bursarUsername) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount must be a positive number' })
      }
    }

    // Get student data
    const studentSnapshot = await db.ref(`students/${studentId}`).once('value')
    if (!studentSnapshot.exists()) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Student not found' })
      }
    }

    const student = studentSnapshot.val()
    const term = student.financials.terms[termKey]

    if (!term) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Term not found for student' })
      }
    }

    const remainingBalance = term.fee - term.paid
    if (amount > remainingBalance) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Payment amount exceeds remaining balance',
          remainingBalance: remainingBalance
        })
      }
    }

    // Generate IDs
    const receiptNumber = generateReceiptNumber()
    const transactionId = generateTransactionId()

    // Calculate new balances
    const newPaidAmount = term.paid + amount
    
    // Recalculate total balance
    let newTotalBalance = 0
    Object.entries(student.financials.terms).forEach(([key, termData]) => {
      const termBalance = termData.fee - (key === termKey ? newPaidAmount : termData.paid)
      newTotalBalance += Math.max(0, termBalance)
    })

    // Create transaction record
    const transactionData = {
      id: transactionId,
      studentId,
      amount,
      type: 'cash',
      status: 'Completed',
      termKey,
      receiptNumber,
      bursarId,
      bursarUsername,
      createdAt: new Date().toISOString()
    }

    // Create bursar activity record
    const bursarActivityData = {
      id: transactionId,
      bursarId,
      bursarUsername,
      studentId,
      studentName: `${student.name} ${student.surname}`,
      amount,
      termKey,
      receiptNumber,
      createdAt: new Date().toISOString()
    }

    // Atomic update
    const updates = {}
    updates[`students/${studentId}/financials/terms/${termKey}/paid`] = newPaidAmount
    updates[`students/${studentId}/financials/balance`] = newTotalBalance
    updates[`transactions/${transactionId}`] = transactionData
    updates[`bursar_activity/${transactionId}`] = bursarActivityData

    await db.ref().update(updates)

    // Create notifications
    await createNotification(
      'Payment Received',
      `Cash payment of $${amount} received for ${termKey.replace('_', ' ')}. Receipt: ${receiptNumber}`,
      'success',
      studentId,
      'student'
    )

    await createNotification(
      'Cash Payment Processed',
      `Bursar ${bursarUsername} processed payment of $${amount} for ${student.name} ${student.surname}. Receipt: ${receiptNumber}`,
      'info',
      null,
      'admin'
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        receiptNumber,
        transactionId,
        newBalance: newTotalBalance,
        message: 'Payment processed successfully'
      })
    }

  } catch (error) {
    console.error('Error processing cash payment:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    }
  }
}