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

const generateOrderReference = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
    const { studentId, amount, termKey, returnUrl, resultUrl } = JSON.parse(event.body)

    // Validate input
    if (!studentId || !amount || !termKey || !returnUrl || !resultUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: studentId, amount, termKey, returnUrl, resultUrl' 
        })
      }
    }

    if (amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount must be greater than 0' })
      }
    }

    // Get student info
    const studentSnapshot = await db.ref(`students/${studentId}`).once('value')
    if (!studentSnapshot.exists()) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Student not found' })
      }
    }

    const student = studentSnapshot.val()

    // Get configuration
    const configSnapshot = await db.ref('config').once('value')
    const config = configSnapshot.val() || { currencyCode: 840 }

    // Generate unique identifiers
    const orderReference = generateOrderReference()
    const transactionId = generateTransactionId()

    // Create pending transaction record
    const transactionData = {
      id: transactionId,
      studentId,
      amount,
      type: 'zbpay',
      status: 'Pending ZB Confirmation',
      termKey,
      orderReference,
      transactionId,
      createdAt: new Date().toISOString()
    }

    await db.ref(`transactions/${transactionId}`).set(transactionData)

    // Prepare ZbPay request
    const zbPayRequest = {
      Amount: amount,
      CurrencyCode: config.currencyCode || 840, // Default to USD
      returnUrl,
      resultUrl,
      orderReference,
      transactionId,
      studentId,
      termKey
    }

    console.log('ZbPay Request:', zbPayRequest)

    // Make request to ZbPay
    const response = await fetch(`${ZBPAY_CONFIG.baseUrl}/payments/initiate-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ZBPAY_CONFIG.apiKey,
        'x-api-secret': ZBPAY_CONFIG.apiSecret
      },
      body: JSON.stringify(zbPayRequest)
    })

    const zbPayResponse = await response.json()
    console.log('ZbPay Response:', zbPayResponse)

    if (response.ok && zbPayResponse.paymentUrl) {
      // Update transaction with ZbPay response
      await db.ref(`transactions/${transactionId}`).update({
        zbPayResponse: zbPayResponse,
        updatedAt: new Date().toISOString()
      })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          paymentUrl: zbPayResponse.paymentUrl,
          orderReference,
          transactionId
        })
      }
    } else {
      // Handle ZbPay error
      await db.ref(`transactions/${transactionId}`).update({
        status: 'ZB Payment Failed',
        error: zbPayResponse.error || 'ZbPay initiation failed',
        updatedAt: new Date().toISOString()
      })

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: zbPayResponse.error || 'Failed to initiate payment with ZbPay'
        })
      }
    }

  } catch (error) {
    console.error('Error initiating ZbPay transaction:', error)
    
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