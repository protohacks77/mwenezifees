import { create } from 'zustand'
import { Student, Transaction, Config, Notification } from '../lib/firebase'

interface AppState {
  // Data
  students: Student[]
  transactions: Transaction[]
  config: Config | null
  notifications: Notification[]
  
  // UI State
  sidebarOpen: boolean
  loading: boolean
  
  // Actions
  setStudents: (students: Student[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setConfig: (config: Config) => void
  setNotifications: (notifications: Notification[]) => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  
  // Computed values
  getStudentById: (id: string) => Student | undefined
  getStudentTransactions: (studentId: string) => Transaction[]
  getUnreadNotifications: () => Notification[]
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  students: [],
  transactions: [],
  config: null,
  notifications: [],
  sidebarOpen: false,
  loading: false,
  
  // Actions
  setStudents: (students) => set({ students }),
  setTransactions: (transactions) => set({ transactions }),
  setConfig: (config) => set({ config }),
  setNotifications: (notifications) => set({ notifications }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ loading }),
  
  // Computed values
  getStudentById: (id: string) => {
    return get().students.find(s => s.id === id)
  },
  
  getStudentTransactions: (studentId: string) => {
    return get().transactions.filter(t => t.studentId === studentId)
  },
  
  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.read)
  }
}))