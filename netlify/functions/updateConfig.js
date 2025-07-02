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

const createNotification = async (title, message, type = 'info', role = 'admin') => {
  try {
    const notificationRef = db.ref('notifications').push()
    await notificationRef.set({
      id: notificationRef.key,
      title,
      message,
      type,
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
    const { configUpdates, adminId } = JSON.parse(event.body)

    if (!configUpdates || !adminId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // Update config
    await db.ref('config').update(configUpdates)

    // Create notification
    await createNotification(
      'Configuration Updated',
      `System configuration updated by admin`,
      'info',
      'admin'
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Configuration updated successfully'
      })
    }

  } catch (error) {
    console.error('Error updating config:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    }
  }
}