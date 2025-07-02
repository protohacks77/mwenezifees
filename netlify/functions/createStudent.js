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

const generateStudentId = () => {
  return `MHS-${Date.now().toString().slice(-6)}`
}

const calculateFee = (studentType, gradeCategory, grade, fees) => {
  let baseFee = 0
  
  if (gradeCategory === 'ZJC' || gradeCategory === 'OLevel') {
    baseFee = studentType === 'Day Scholar' ? fees.dayScholar.oLevel : fees.boarder.oLevel
  } else if (gradeCategory === 'ALevel') {
    if (grade.toLowerCase().includes('sciences')) {
      baseFee = studentType === 'Day Scholar' ? fees.dayScholar.aLevelSciences : fees.boarder.aLevelSciences
    } else if (grade.toLowerCase().includes('commercials')) {
      baseFee = studentType === 'Day Scholar' ? fees.dayScholar.aLevelCommercials : fees.boarder.aLevelCommercials
    } else {
      baseFee = studentType === 'Day Scholar' ? fees.dayScholar.aLevelArts : fees.boarder.aLevelArts
    }
  }
  
  return baseFee
}

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
    const { name, surname, studentNumber, studentType, gradeCategory, grade, guardianPhoneNumber, adminId } = JSON.parse(event.body)

    // Validation
    if (!name || !surname || !studentNumber || !studentType || !gradeCategory || !grade || !guardianPhoneNumber || !adminId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    if (!['Day Scholar', 'Boarder'].includes(studentType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid student type' })
      }
    }

    if (!['ZJC', 'OLevel', 'ALevel'].includes(gradeCategory)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid grade category' })
      }
    }

    // Generate unique student ID
    const studentId = generateStudentId()

    // Get config
    const configSnapshot = await db.ref('config').once('value')
    const config = configSnapshot.val()

    if (!config) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'School configuration not found' })
      }
    }

    // Check if student number already exists
    const existingStudentSnapshot = await db.ref('students')
      .orderByChild('studentNumber')
      .equalTo(studentNumber)
      .once('value')

    if (existingStudentSnapshot.exists()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Student number already exists' })
      }
    }

    // Calculate fees for active terms
    const activeTerms = config.activeTerms || []
    const terms = {}
    let totalBalance = 0

    activeTerms.forEach(termKey => {
      const fee = calculateFee(studentType, gradeCategory, grade, config.fees)
      terms[termKey] = { fee: fee, paid: 0 }
      totalBalance += fee
    })

    // Create student record
    const studentData = {
      id: studentId,
      name,
      surname,
      studentNumber,
      studentType,
      gradeCategory,
      grade,
      guardianPhoneNumber,
      financials: {
        balance: totalBalance,
        terms: terms
      },
      createdAt: new Date().toISOString()
    }

    // Create user account for student
    const userData = {
      id: studentId,
      username: studentNumber,
      password: 'student123',
      role: 'student',
      profile: {
        name,
        surname,
        studentNumber
      }
    }

    // Atomic write
    const updates = {}
    updates[`students/${studentId}`] = studentData
    updates[`users/${studentId}`] = userData

    await db.ref().update(updates)

    // Create notification
    await createNotification(
      'New Student Added',
      `New student ${name} ${surname} (${studentNumber}) added to ${grade}`,
      'success',
      'admin'
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        studentId: studentId,
        message: 'Student created successfully'
      })
    }

  } catch (error) {
    console.error('Error creating student:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    }
  }
}