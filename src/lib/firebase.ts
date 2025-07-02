import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, push, update, remove, onValue, off } from 'firebase/database'
import { generateReceiptNumber, generateTransactionId } from './utils'

const firebaseConfig = {
  apiKey: "AIzaSyDW_D4-2Tw6TTDhI7WyTtwVCZWn_i52ECY",
  authDomain: "mwenezihigh.firebaseapp.com",
  databaseURL: "https://mwenezihigh-default-rtdb.firebaseio.com",
  projectId: "mwenezihigh",
  storageBucket: "mwenezihigh.firebasestorage.app",
  messagingSenderId: "588608479487",
  appId: "1:588608479487:web:6e5c057d0978769862acca"
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)

// Types
export interface User {
  id: string
  username: string
  password: string
  role: 'admin' | 'bursar' | 'student'
  profile?: {
    name?: string
    surname?: string
    email?: string
    phone?: string
    studentNumber?: string
  }
}

export interface Student {
  id: string
  name: string
  surname: string
  studentNumber: string
  studentType: 'Day Scholar' | 'Boarder'
  gradeCategory: 'ZJC' | 'OLevel' | 'ALevel'
  grade: string
  guardianPhoneNumber: string
  financials: {
    balance: number
    terms: Record<string, {
      fee: number
      paid: number
    }>
  }
  createdAt: string
}

export interface Transaction {
  id: string
  studentId: string
  amount: number
  type: 'cash' | 'zbpay' | 'adjustment'
  status: string
  termKey: string
  receiptNumber?: string
  orderReference?: string
  transactionId?: string
  bursarId?: string
  bursarUsername?: string
  adminId?: string
  reason?: string
  adjustmentType?: string
  createdAt: string
}

export interface Config {
  fees: {
    dayScholar: {
      zjc: number
      oLevel: number
      aLevelSciences: number
      aLevelCommercials: number
      aLevelArts: number
    }
    boarder: {
      zjc: number
      oLevel: number
      aLevelSciences: number
      aLevelCommercials: number
      aLevelArts: number
    }
  }
  activeTerms: string[]
  currencyCode: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  userId?: string
  role?: string
  read: boolean
  createdAt: string
}

// Database Operations
export const seedInitialData = async (): Promise<void> => {
  try {
    // Check if data already exists
    const configRef = ref(database, 'config')
    const configSnapshot = await get(configRef)
    
    if (configSnapshot.exists()) {
      console.log('Initial data already exists')
      return
    }

    console.log('Seeding initial data...')

    // Initial configuration
    const initialConfig: Config = {
      fees: {
        dayScholar: {
          zjc: 200,
          oLevel: 200,
          aLevelSciences: 250,
          aLevelCommercials: 230,
          aLevelArts: 230
        },
        boarder: {
          zjc: 300,
          oLevel: 300,
          aLevelSciences: 350,
          aLevelCommercials: 330,
          aLevelArts: 330
        }
      },
      activeTerms: ['2025_Term1'],
      currencyCode: 840 // USD
    }

    // Create initial users
    const users = {
      'admin': {
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        profile: {
          name: 'System',
          surname: 'Administrator'
        }
      },
      'bursar': {
        id: 'bursar',
        username: 'bursar',
        password: 'bursar123',
        role: 'bursar',
        profile: {
          name: 'School',
          surname: 'Bursar'
        }
      },
      'MHS-001': {
        id: 'MHS-001',
        username: 'MHS-001',
        password: 'student123',
        role: 'student',
        profile: {
          name: 'John',
          surname: 'Doe',
          studentNumber: 'MHS-001'
        }
      },
      'MHS-002': {
        id: 'MHS-002',
        username: 'MHS-002',
        password: 'student456',
        role: 'student',
        profile: {
          name: 'Jane',
          surname: 'Smith',
          studentNumber: 'MHS-002'
        }
      }
    }

    // Create sample students
    const students = {
      'MHS-001': {
        id: 'MHS-001',
        name: 'John',
        surname: 'Doe',
        studentNumber: 'MHS-001',
        studentType: 'Day Scholar',
        gradeCategory: 'ZJC',
        grade: '1A1',
        guardianPhoneNumber: '+263712345678',
        financials: {
          balance: 200,
          terms: {
            '2025_Term1': {
              fee: 200,
              paid: 0
            }
          }
        },
        createdAt: new Date().toISOString()
      },
      'MHS-002': {
        id: 'MHS-002',
        name: 'Jane',
        surname: 'Smith',
        studentNumber: 'MHS-002',
        studentType: 'Boarder',
        gradeCategory: 'ALevel',
        grade: 'Lower 6 Sciences',
        guardianPhoneNumber: '+263723456789',
        financials: {
          balance: 350,
          terms: {
            '2025_Term1': {
              fee: 350,
              paid: 0
            }
          }
        },
        createdAt: new Date().toISOString()
      }
    }

    // Set all data
    await set(ref(database, 'config'), initialConfig)
    await set(ref(database, 'users'), users)
    await set(ref(database, 'students'), students)
    await set(ref(database, 'transactions'), {})
    await set(ref(database, 'bursar_activity'), {})
    await set(ref(database, 'fee_adjustments'), {})
    await set(ref(database, 'notifications'), {})

    console.log('Initial data seeded successfully')
  } catch (error) {
    console.error('Error seeding initial data:', error)
    throw error
  }
}

// User operations
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const userRef = ref(database, `users/${username}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      const user = snapshot.val()
      if (user.password === password) {
        return user
      }
    }
    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}/password`)
    await set(userRef, newPassword)
  } catch (error) {
    console.error('Error updating password:', error)
    throw error
  }
}

// Student operations
export const getStudents = async (): Promise<Student[]> => {
  try {
    const studentsRef = ref(database, 'students')
    const snapshot = await get(studentsRef)
    
    if (snapshot.exists()) {
      const studentsData = snapshot.val()
      return Object.values(studentsData) as Student[]
    }
    return []
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

export const getStudentById = async (studentId: string): Promise<Student | null> => {
  try {
    const studentRef = ref(database, `students/${studentId}`)
    const snapshot = await get(studentRef)
    
    if (snapshot.exists()) {
      return snapshot.val() as Student
    }
    return null
  } catch (error) {
    console.error('Error fetching student:', error)
    return null
  }
}

// Transaction operations
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactionsRef = ref(database, 'transactions')
    const snapshot = await get(transactionsRef)
    
    if (snapshot.exists()) {
      const transactionsData = snapshot.val()
      return Object.values(transactionsData) as Transaction[]
    }
    return []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

export const getStudentTransactions = async (studentId: string): Promise<Transaction[]> => {
  try {
    const transactions = await getTransactions()
    return transactions.filter(t => t.studentId === studentId)
  } catch (error) {
    console.error('Error fetching student transactions:', error)
    return []
  }
}

// Configuration operations
export const getConfig = async (): Promise<Config | null> => {
  try {
    const configRef = ref(database, 'config')
    const snapshot = await get(configRef)
    
    if (snapshot.exists()) {
      return snapshot.val() as Config
    }
    return null
  } catch (error) {
    console.error('Error fetching config:', error)
    return null
  }
}

export const updateConfig = async (config: Partial<Config>): Promise<void> => {
  try {
    const configRef = ref(database, 'config')
    await update(configRef, config)
  } catch (error) {
    console.error('Error updating config:', error)
    throw error
  }
}

// Notification operations
export const getNotifications = async (userId?: string, role?: string): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(database, 'notifications')
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val()
      let notifications = Object.values(notificationsData) as Notification[]
      
      // Filter notifications based on user/role
      if (userId) {
        notifications = notifications.filter(n => 
          !n.userId || n.userId === userId || 
          !n.role || n.role === role
        )
      }
      
      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    return []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const notificationsRef = ref(database, 'notifications')
    const newNotificationRef = push(notificationsRef)
    
    await set(newNotificationRef, {
      ...notification,
      id: newNotificationRef.key,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}/read`)
    await set(notificationRef, true)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

// Real-time subscriptions
export const subscribeToStudents = (callback: (students: Student[]) => void) => {
  const studentsRef = ref(database, 'students')
  
  const unsubscribe = onValue(studentsRef, (snapshot) => {
    if (snapshot.exists()) {
      const studentsData = snapshot.val()
      const students = Object.values(studentsData) as Student[]
      callback(students)
    } else {
      callback([])
    }
  })
  
  return () => off(studentsRef, 'value', unsubscribe)
}

export const subscribeToTransactions = (callback: (transactions: Transaction[]) => void) => {
  const transactionsRef = ref(database, 'transactions')
  
  const unsubscribe = onValue(transactionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const transactionsData = snapshot.val()
      const transactions = Object.values(transactionsData) as Transaction[]
      callback(transactions)
    } else {
      callback([])
    }
  })
  
  return () => off(transactionsRef, 'value', unsubscribe)
}

export const subscribeToNotifications = (
  callback: (notifications: Notification[]) => void,
  userId?: string,
  role?: string
) => {
  const notificationsRef = ref(database, 'notifications')
  
  const unsubscribe = onValue(notificationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const notificationsData = snapshot.val()
      let notifications = Object.values(notificationsData) as Notification[]
      
      // Filter notifications based on user/role
      if (userId) {
        notifications = notifications.filter(n => 
          !n.userId || n.userId === userId || 
          !n.role || n.role === role
        )
      }
      
      const sortedNotifications = notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      callback(sortedNotifications)
    } else {
      callback([])
    }
  })
  
  return () => off(notificationsRef, 'value', unsubscribe)
}

// Initialize the database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await seedInitialData()
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}