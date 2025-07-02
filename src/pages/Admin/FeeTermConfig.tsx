import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Settings, 
  DollarSign, 
  Calendar, 
  Save,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

const feeConfigSchema = z.object({
  dayScholar: z.object({
    zjc: z.number().min(0, 'Fee must be positive'),
    oLevel: z.number().min(0, 'Fee must be positive'),
    aLevelSciences: z.number().min(0, 'Fee must be positive'),
    aLevelCommercials: z.number().min(0, 'Fee must be positive'),
    aLevelArts: z.number().min(0, 'Fee must be positive')
  }),
  boarder: z.object({
    zjc: z.number().min(0, 'Fee must be positive'),
    oLevel: z.number().min(0, 'Fee must be positive'),
    aLevelSciences: z.number().min(0, 'Fee must be positive'),
    aLevelCommercials: z.number().min(0, 'Fee must be positive'),
    aLevelArts: z.number().min(0, 'Fee must be positive')
  })
})

const termConfigSchema = z.object({
  termName: z.string().min(1, 'Term name is required'),
  year: z.number().min(2024, 'Year must be valid')
})

type FeeConfigData = z.infer<typeof feeConfigSchema>
type TermConfigData = z.infer<typeof termConfigSchema>

export const FeeTermConfig: React.FC = () => {
  const { config } = useAppStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [termLoading, setTermLoading] = useState(false)

  const {
    register: registerFees,
    handleSubmit: handleSubmitFees,
    formState: { errors: feeErrors }
  } = useForm<FeeConfigData>({
    resolver: zodResolver(feeConfigSchema),
    defaultValues: config?.fees
  })

  const {
    register: registerTerm,
    handleSubmit: handleSubmitTerm,
    reset: resetTerm,
    formState: { errors: termErrors }
  } = useForm<TermConfigData>({
    resolver: zodResolver(termConfigSchema),
    defaultValues: {
      year: new Date().getFullYear()
    }
  })

  const onSubmitFees = async (data: FeeConfigData) => {
    if (!user) {
      toast.error('Admin authentication required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/updateConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configUpdates: { fees: data },
          adminId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fee structure updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update fee structure')
      }
    } catch (error) {
      console.error('Error updating fees:', error)
      toast.error('Failed to update fee structure. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitTerm = async (data: TermConfigData) => {
    if (!user) {
      toast.error('Admin authentication required')
      return
    }

    setTermLoading(true)
    try {
      const termKey = `${data.year}_${data.termName.replace(/\s+/g, '')}`
      const currentActiveTerms = config?.activeTerms || []
      
      if (currentActiveTerms.includes(termKey)) {
        toast.error('This term already exists')
        return
      }

      const response = await fetch('/.netlify/functions/updateConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configUpdates: { 
            activeTerms: [...currentActiveTerms, termKey]
          },
          adminId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('New term added successfully!')
        resetTerm()
      } else {
        toast.error(result.error || 'Failed to add term')
      }
    } catch (error) {
      console.error('Error adding term:', error)
      toast.error('Failed to add term. Please try again.')
    } finally {
      setTermLoading(false)
    }
  }

  const deactivateTerm = async (termKey: string) => {
    if (!user) {
      toast.error('Admin authentication required')
      return
    }

    try {
      const currentActiveTerms = config?.activeTerms || []
      const updatedTerms = currentActiveTerms.filter(t => t !== termKey)

      const response = await fetch('/.netlify/functions/updateConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configUpdates: { activeTerms: updatedTerms },
          adminId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Term deactivated successfully!')
      } else {
        toast.error(result.error || 'Failed to deactivate term')
      }
    } catch (error) {
      console.error('Error deactivating term:', error)
      toast.error('Failed to deactivate term. Please try again.')
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Loading Configuration</h3>
          <p className="text-slate-400">Please wait while we load the system configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Fee & Term Configuration</h1>
        <p className="text-slate-400 mt-1">
          Manage school fee structure and active terms
        </p>
      </div>

      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="fees" className="data-[state=active]:bg-mwenezi-maroon">
            Fee Structure
          </TabsTrigger>
          <TabsTrigger value="terms" className="data-[state=active]:bg-mwenezi-maroon">
            Term Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fees">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-mwenezi-maroon" />
                Fee Structure Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitFees(onSubmitFees)} className="space-y-8">
                {/* Day Scholar Fees */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                    Day Scholar Fees
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">ZJC</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('dayScholar.zjc', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.dayScholar?.zjc && (
                        <p className="text-red-400 text-sm">{feeErrors.dayScholar.zjc.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">O Level</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('dayScholar.oLevel', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.dayScholar?.oLevel && (
                        <p className="text-red-400 text-sm">{feeErrors.dayScholar.oLevel.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Sciences</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('dayScholar.aLevelSciences', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.dayScholar?.aLevelSciences && (
                        <p className="text-red-400 text-sm">{feeErrors.dayScholar.aLevelSciences.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Commercials</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('dayScholar.aLevelCommercials', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.dayScholar?.aLevelCommercials && (
                        <p className="text-red-400 text-sm">{feeErrors.dayScholar.aLevelCommercials.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Arts</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('dayScholar.aLevelArts', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.dayScholar?.aLevelArts && (
                        <p className="text-red-400 text-sm">{feeErrors.dayScholar.aLevelArts.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boarder Fees */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
                    Boarder Fees
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">ZJC</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('boarder.zjc', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.boarder?.zjc && (
                        <p className="text-red-400 text-sm">{feeErrors.boarder.zjc.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">O Level</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('boarder.oLevel', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.boarder?.oLevel && (
                        <p className="text-red-400 text-sm">{feeErrors.boarder.oLevel.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Sciences</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('boarder.aLevelSciences', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.boarder?.aLevelSciences && (
                        <p className="text-red-400 text-sm">{feeErrors.boarder.aLevelSciences.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Commercials</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('boarder.aLevelCommercials', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.boarder?.aLevelCommercials && (
                        <p className="text-red-400 text-sm">{feeErrors.boarder.aLevelCommercials.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200">A Level Arts</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 bg-slate-700 border-slate-600 text-white"
                          {...registerFees('boarder.aLevelArts', { valueAsNumber: true })}
                        />
                      </div>
                      {feeErrors.boarder?.aLevelArts && (
                        <p className="text-red-400 text-sm">{feeErrors.boarder.aLevelArts.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="maroon"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Fee Structure
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Term */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-mwenezi-maroon" />
                  Add New Term
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTerm(onSubmitTerm)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Term Name</Label>
                    <Input
                      placeholder="e.g., Term1, Term2, Term3"
                      className="bg-slate-700 border-slate-600 text-white"
                      {...registerTerm('termName')}
                    />
                    {termErrors.termName && (
                      <p className="text-red-400 text-sm">{termErrors.termName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Year</Label>
                    <Input
                      type="number"
                      className="bg-slate-700 border-slate-600 text-white"
                      {...registerTerm('year', { valueAsNumber: true })}
                    />
                    {termErrors.year && (
                      <p className="text-red-400 text-sm">{termErrors.year.message}</p>
                    )}
                  </div>

                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-amber-300 text-sm font-medium">Important</p>
                        <p className="text-amber-200 text-xs">
                          Adding a new term will automatically bill all existing students for that term based on their grade and student type.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="maroon"
                    className="w-full"
                    disabled={termLoading}
                  >
                    {termLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Adding Term...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Term
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Active Terms */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-mwenezi-maroon" />
                  Active Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.activeTerms.length > 0 ? (
                    config.activeTerms.map((termKey) => (
                      <motion.div
                        key={termKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {termKey.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-slate-400">
                            Active billing term
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deactivateTerm(termKey)}
                          className="text-red-400 hover:text-red-300 border-red-400/30"
                        >
                          Deactivate
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No active terms</p>
                      <p className="text-slate-500 text-sm">Add a term to start billing students</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}