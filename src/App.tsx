import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { initializeDatabase } from './lib/firebase'
import { Layout } from './components/Layout/Layout'
import { LoginForm } from './components/Auth/LoginForm'
import { AdminDashboard } from './pages/Admin/AdminDashboard'
import { ManageStudents } from './pages/Admin/ManageStudents'
import { StudentDashboard } from './pages/Student/StudentDashboard'
import { PaymentProcess } from './pages/Student/PaymentProcess'
import { PaymentStatus } from './pages/Student/PaymentStatus'
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
                  <Route path="/admin/students/new" element={<div>Create Student (Coming Soon)</div>} />
                  <Route path="/admin/student/:id" element={<div>Student Profile (Coming Soon)</div>} />
                  <Route path="/admin/transactions" element={<div>Financial Activity (Coming Soon)</div>} />
                  <Route path="/admin/config" element={<div>Fee/Term Config (Coming Soon)</div>} />
                  <Route path="/admin/notifications" element={<div>Notifications (Coming Soon)</div>} />
                </>
              )}

              {/* Bursar Routes */}
              {user?.role === 'bursar' && (
                <>
                  <Route path="/bursar" element={<div>Bursar Dashboard (Coming Soon)</div>} />
                  <Route path="/bursar/payments" element={<div>Process Payments (Coming Soon)</div>} />
                  <Route path="/bursar/reconciliation" element={<div>Daily Reconciliation (Coming Soon)</div>} />
                </>
              )}

              {/* Student Routes */}
              {user?.role === 'student' && (
                <>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/payment-process" element={<PaymentProcess />} />
                  <Route path="/student/payments" element={<div>Payment History (Coming Soon)</div>} />
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