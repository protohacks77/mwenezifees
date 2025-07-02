import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { initializeDatabase } from './lib/firebase'
import { Layout } from './components/Layout/Layout'
import { LoginForm } from './components/Auth/LoginForm'
import { AdminDashboard } from './pages/Admin/AdminDashboard'
import { ManageStudents } from './pages/Admin/ManageStudents'
import { CreateStudent } from './pages/Admin/CreateStudent'
import { StudentProfile } from './pages/Admin/StudentProfile'
import { FinancialActivity } from './pages/Admin/FinancialActivity'
import { FeeTermConfig } from './pages/Admin/FeeTermConfig'
import { NotificationsPanel } from './pages/Admin/NotificationsPanel'
import { BursarDashboard } from './pages/Bursar/BursarDashboard'
import { ProcessPayments } from './pages/Bursar/ProcessPayments'
import { DailyReconciliation } from './pages/Bursar/DailyReconciliation'
import { StudentDashboard } from './pages/Student/StudentDashboard'
import { PaymentProcess } from './pages/Student/PaymentProcess'
import { PaymentStatus } from './pages/Student/PaymentStatus'
import { PaymentHistory } from './pages/Student/PaymentHistory'
import { LoadingSpinner } from './components/Common/LoadingSpinner'

function App() {
  const { isAuthenticated, user, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const initApp = async () => {
      setLoading(true)
      try {
        await initializeDatabase()
      } catch (error) {
        console.error('Failed to initialize database:', error)
      } finally {
        setLoading(false)
      }
    }

    initApp()
  }, [setLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing Mwenezi High Fees Management..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={`/${user?.role}`} replace />
              ) : (
                <LoginForm />
              )
            } 
          />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              {/* Admin Routes */}
              {user?.role === 'admin' && (
                <>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/students" element={<ManageStudents />} />
                  <Route path="/admin/students/new" element={<CreateStudent />} />
                  <Route path="/admin/student/:id" element={<StudentProfile />} />
                  <Route path="/admin/transactions" element={<FinancialActivity />} />
                  <Route path="/admin/config" element={<FeeTermConfig />} />
                  <Route path="/admin/notifications" element={<NotificationsPanel />} />
                </>
              )}

              {/* Bursar Routes */}
              {user?.role === 'bursar' && (
                <>
                  <Route path="/bursar" element={<BursarDashboard />} />
                  <Route path="/bursar/payments" element={<ProcessPayments />} />
                  <Route path="/bursar/reconciliation" element={<DailyReconciliation />} />
                </>
              )}

              {/* Student Routes */}
              {user?.role === 'student' && (
                <>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/payment-process" element={<PaymentProcess />} />
                  <Route path="/student/payments" element={<PaymentHistory />} />
                </>
              )}

              {/* Redirect to role-specific dashboard */}
              <Route path="/" element={<Navigate to={`/${user?.role}`} replace />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}

          {/* Payment Status Route (can be accessed without layout) */}
          <Route path="/student/payment-status" element={<PaymentStatus />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #374151'
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#1e293b'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e293b'
            }
          }
        }}
      />
    </div>
  )
}

export default App