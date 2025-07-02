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
    const { studentId, adjustmentAmount, termKey, reason, adjustmentType, adminId } = JSON.parse(event.body)

    if (!studentId || !adjustmentAmount || !termKey || !reason || !adjustmentType || !adminId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
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

    const transactionId = generateTransactionId()
    const adjustmentId = `ADJ-${Date.now()}`

    // Calculate new fee and balance
    const newFee = term.fee + adjustmentAmount
    
    // Recalculate total balance
    let newTotalBalance = 0
    Object.entries(student.financials.terms).forEach(([key, termData]) => {
      const termFee = key === termKey ? newFee : termData.fee
      const termBalance = termFee - termData.paid
      newTotalBalance += Math.max(0, termBalance)
    })

    // Create adjustment record
    const adjustmentData = {
      id: adjustmentId,
      studentId,
      adjustmentAmount,
      termKey,
      reason,
      adjustmentType,
      adminId,
      oldFee: term.fee,
      newFee,
      createdAt: new Date().toISOString()
    }

    // Create transaction record
    const transactionData = {
      id: transactionId,
      studentId,
      amount: Math.abs(adjustmentAmount),
      type: 'adjustment',
      status: 'Completed',
      termKey,
      reason,
      adjustmentType,
      adminId,
      createdAt: new Date().toISOString()
    }

    // Atomic update
    const updates = {}
    updates[`students/${studentId}/financials/terms/${termKey}/fee`] = newFee
    updates[`students/${studentId}/financials/balance`] = newTotalBalance
    updates[`fee_adjustments/${adjustmentId}`] = adjustmentData
    updates[`transactions/${transactionId}`] = transactionData

    await db.ref().update(updates)

    // Create notifications
    await createNotification(
      'Fee Adjustment Applied',
      `Fee adjustment of $${adjustmentAmount} applied to ${termKey.replace('_', ' ')}. Reason: ${reason}`,
      'info',
      studentId,
      'student'
    )

    await createNotification(
      'Fee Adjustment Processed',
      `Admin applied fee adjustment of $${adjustmentAmount} for ${student.name} ${student.surname} - ${termKey.replace('_', ' ')}`,
      'info',
      null,
      'admin'
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        adjustmentId,
        transactionId,
        newBalance: newTotalBalance,
        message: 'Fee adjustment applied successfully'
      })
    }

  } catch (error) {
    console.error('Error applying fee adjustment:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    }
  }
}