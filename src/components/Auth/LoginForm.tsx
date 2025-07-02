import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authenticateUser } from '../../lib/firebase'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const user = await authenticateUser(data.username, data.password)
      if (user) {
        login(user)
        toast.success('Login successful!')
        navigate(`/${user.role}`)
      } else {
        toast.error('Invalid username or password')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-mwenezi-maroon rounded-full flex items-center justify-center">
                <img
                  src="/mwenezilogo.png"
                  alt="Mwenezi High School"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    // Fallback to icon if image doesn't load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <GraduationCap className="w-10 h-10 text-white hidden" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Mwenezi High School
              </CardTitle>
              <CardDescription className="text-slate-400">
                Fees Management System
              </CardDescription>
              <div className="mt-2 text-xs text-mwenezi-amber font-medium">
                "Relevant Education for Livelihood"
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-red-400 text-sm">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-12"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-mwenezi-maroon hover:bg-mwenezi-maroon/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Demo Credentials:</h4>
              <div className="space-y-1 text-xs text-slate-300">
                <div>
                  <span className="font-medium text-mwenezi-amber">Admin:</span> admin / admin123
                </div>
                <div>
                  <span className="font-medium text-mwenezi-amber">Bursar:</span> bursar / bursar123
                </div>
                <div>
                  <span className="font-medium text-mwenezi-amber">Student:</span> MHS-001 / student123
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}