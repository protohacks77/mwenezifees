import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  GraduationCap
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { EmptyState } from '../../components/Common/EmptyState'
import { formatCurrency, getStudentStatusColor, debounce } from '../../lib/utils'
import { Student } from '../../lib/firebase'

export const ManageStudents: React.FC = () => {
  const { students } = useAppStore()
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term)
  }, 300)

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === 'all' || student.studentType === filterType

      const matchesGrade = filterGrade === 'all' || student.gradeCategory === filterGrade

      return matchesSearch && matchesType && matchesGrade
    })

    // Sort students
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
        case 'studentNumber':
          return a.studentNumber.localeCompare(b.studentNumber)
        case 'balance':
          return b.financials.balance - a.financials.balance
        case 'grade':
          return a.grade.localeCompare(b.grade)
        default:
          return 0
      }
    })

    return filtered
  }, [students, searchTerm, filterType, filterGrade, sortBy])

  const groupedStudents = useMemo(() => {
    const groups: Record<string, Student[]> = {}
    
    filteredAndSortedStudents.forEach(student => {
      const key = `${student.gradeCategory} - ${student.grade}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(student)
    })

    return groups
  }, [filteredAndSortedStudents])

  const getStatusText = (balance: number): string => {
    if (balance <= 0) return 'Paid'
    if (balance > 0 && balance < 100) return 'Partial'
    return 'Arrears'
  }

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {student.name.charAt(0)}{student.surname.charAt(0)}
              </span>
            </div>
            <div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-700 ${getStudentStatusColor(student.financials.balance)}`}
              title={getStatusText(student.financials.balance)}
            />
          </div>
          <div>
            <h4 className="font-medium text-white">
              {student.name} {student.surname}
            </h4>
            <p className="text-sm text-slate-400">
              {student.studentNumber}
            </p>
            <p className="text-xs text-slate-500">
              {student.studentType} • {student.grade}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">
              {formatCurrency(student.financials.balance)}
            </p>
            <p className="text-xs text-slate-400">Outstanding</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/student/${student.id}`)}
            className="text-mwenezi-amber hover:text-mwenezi-amber/80"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Students</h1>
          <p className="text-slate-400 mt-1">
            {students.length} students enrolled
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/students/new')}
          variant="maroon"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 bg-slate-700 border-slate-600"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Student Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                <SelectItem value="Boarder">Boarder</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Grade Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="ZJC">ZJC</SelectItem>
                <SelectItem value="OLevel">O Level</SelectItem>
                <SelectItem value="ALevel">A Level</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="studentNumber">Student Number</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {Object.keys(groupedStudents).length > 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-mwenezi-maroon" />
              Students ({filteredAndSortedStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(groupedStudents).map(([grade, students]) => (
                <AccordionItem 
                  key={grade} 
                  value={grade}
                  className="border border-slate-700 rounded-lg bg-slate-700/30"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-mwenezi-amber" />
                      <span className="font-medium text-white">{grade}</span>
                      <span className="bg-slate-600 text-slate-300 px-2 py-1 rounded-full text-xs">
                        {students.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {students.map((student) => (
                          <StudentCard key={student.id} student={student} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Users}
          title="No students found"
          description="No students match your current filters. Try adjusting your search criteria."
        />
      )}
    </div>
  )
}