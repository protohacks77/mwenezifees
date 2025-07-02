import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2,
  User,
  Phone,
  GraduationCap,
  School
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import toast from 'react-hot-toast'

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  studentNumber: z.string().min(1, 'Student number is required'),
  studentType: z.enum(['Day Scholar', 'Boarder'], {
    required_error: 'Please select student type'
  }),
  gradeCategory: z.enum(['ZJC', 'OLevel', 'ALevel'], {
    required_error: 'Please select grade category'
  }),
  grade: z.string().min(1, 'Grade is required'),
  guardianPhoneNumber: z.string().min(1, 'Guardian phone number is required')
})

type StudentFormData = z.infer<typeof studentSchema>

const gradeOptions = {
  ZJC: [
    'Form 1A1', 'Form 1A2', 'Form 1A3',
    'Form 2A1', 'Form 2A2', 'Form 2A3'
  ],
  OLevel: [
    'Form 3A1', 'Form 3A2', 'Form 3A3',
    'Form 4A1', 'Form 4A2', 'Form 4A3'
  ],
  ALevel: [
    'Lower 6 Sciences', 'Lower 6 Commercials', 'Lower 6 Arts',
    'Upper 6 Sciences', 'Upper 6 Commercials', 'Upper 6 Arts'
  ]
}

export const CreateStudent: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema)
  })

  const selectedGradeCategory = watch('gradeCategory')

  const onSubmit = async (data: StudentFormData) => {
    if (!user) {
      toast.error('Admin authentication required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/createStudent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          adminId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Student created successfully!')
        navigate('/admin/students')
      } else {
        toast.error(result.error || 'Failed to create student')
      }
    } catch (error) {
      console.error('Error creating student:', error)
      toast.error('Failed to create student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/students')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Student</h1>
          <p className="text-slate-400 mt-1">
            Add a new student to the system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-mwenezi-maroon" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">
                      First Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="name"
                        placeholder="Enter first name"
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                        {...register('name')}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-sm">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-slate-200">
                      Surname *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="surname"
                        placeholder="Enter surname"
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                        {...register('surname')}
                      />
                    </div>
                    {errors.surname && (
                      <p className="text-red-400 text-sm">{errors.surname.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentNumber" className="text-slate-200">
                    Student Number *
                  </Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="studentNumber"
                      placeholder="e.g., MHS-003"
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      {...register('studentNumber')}
                    />
                  </div>
                  {errors.studentNumber && (
                    <p className="text-red-400 text-sm">{errors.studentNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianPhoneNumber" className="text-slate-200">
                    Guardian Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="guardianPhoneNumber"
                      placeholder="+263712345678"
                      className="pl-10 bg-slate-700 border-slate-600 text-white"
                      {...register('guardianPhoneNumber')}
                    />
                  </div>
                  {errors.guardianPhoneNumber && (
                    <p className="text-red-400 text-sm">{errors.guardianPhoneNumber.message}</p>
                  )}
                </div>

                {/* Academic Information */}
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-mwenezi-amber" />
                    Academic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Student Type *</Label>
                      <Select onValueChange={(value) => setValue('studentType', value as 'Day Scholar' | 'Boarder')}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select student type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                          <SelectItem value="Boarder">Boarder</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.studentType && (
                        <p className="text-red-400 text-sm">{errors.studentType.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">Grade Category *</Label>
                      <Select onValueChange={(value) => {
                        setValue('gradeCategory', value as 'ZJC' | 'OLevel' | 'ALevel')
                        setValue('grade', '') // Reset grade when category changes
                      }}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select grade category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ZJC">ZJC</SelectItem>
                          <SelectItem value="OLevel">O Level</SelectItem>
                          <SelectItem value="ALevel">A Level</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gradeCategory && (
                        <p className="text-red-400 text-sm">{errors.gradeCategory.message}</p>
                      )}
                    </div>
                  </div>

                  {selectedGradeCategory && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-slate-200">Grade/Class *</Label>
                      <Select onValueChange={(value) => setValue('grade', value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select grade/class" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions[selectedGradeCategory].map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.grade && (
                        <p className="text-red-400 text-sm">{errors.grade.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/students')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="maroon"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Student
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-6">
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-6">
              <h4 className="text-blue-300 font-semibold mb-3">Fee Structure</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-blue-200 font-medium">Day Scholar:</p>
                  <p className="text-blue-100">ZJC/O Level: $200</p>
                  <p className="text-blue-100">A Level Sciences: $250</p>
                  <p className="text-blue-100">A Level Commercials/Arts: $230</p>
                </div>
                <div>
                  <p className="text-blue-200 font-medium">Boarder:</p>
                  <p className="text-blue-100">Day Scholar fee + $100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-6">
              <h4 className="text-amber-300 font-semibold mb-3">Important Notes</h4>
              <div className="space-y-2 text-sm text-amber-100">
                <p>• Student will be automatically billed for all active terms</p>
                <p>• A user account will be created with the student number as username</p>
                <p>• Default password will be "student123"</p>
                <p>• Guardian will be notified of account creation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}