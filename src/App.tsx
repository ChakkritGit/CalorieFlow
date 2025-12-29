import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Activity,
  Utensils,
  BarChart2,
  Settings,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
  Download,
  Upload,
  FileJson,
  Pencil
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import {
  UserProfile,
  Gender,
  ActivityLevel,
  GoalType,
  DailyLog,
  FoodItem
} from './types/types'
// import { estimateCalories } from './services/geminiService'
import { CircularProgress } from './components/CircularProgress'
import LiquidEffect from './components/LiquidEffect'

// --- Constants ---
const STORAGE_KEY_USER = 'calorieflow_user'
const STORAGE_KEY_LOGS = 'calorieflow_logs'

const INITIAL_USER: UserProfile = {
  name: 'Guest',
  gender: Gender.MALE,
  age: 25,
  height: 170,
  currentWeight: 70,
  targetWeight: 65,
  activityLevel: ActivityLevel.SEDENTARY,
  goalType: GoalType.LOSE_WEIGHT,
  updatedAt: new Date().toISOString()
}

// --- Helper Functions: Calc ---
const calculateTDEE = (user: UserProfile): number => {
  // Check if manual TDEE is set
  if (user.manualTDEE && user.manualTDEE > 0) {
    return user.manualTDEE
  }

  // Mifflin-St Jeor Equation
  let bmr = 0
  if (user.gender === Gender.MALE) {
    bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age + 5
  } else {
    bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age - 161
  }

  const tdee = bmr * user.activityLevel

  // Adjust based on goal
  switch (user.goalType) {
    case GoalType.LOSE_WEIGHT:
      return Math.round(tdee - 500) // ~0.5kg loss/week
    case GoalType.GAIN_WEIGHT:
      return Math.round(tdee + 500)
    default:
      return Math.round(tdee)
  }
}

const getTodayDateString = () => new Date().toISOString().split('T')[0]

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' })
}

// --- Components ---

const TabButton: React.FC<{
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-colors cursor-pointer rounded-4xl ${
      active ? 'text-green-600 bg-gray-400/10 backdrop-blur-sm' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    <div className={`mb-1 ${active ? 'scale-110' : ''} transition-transform`}>
      {icon}
    </div>
    <span className='text-xs font-medium'>{label}</span>
  </button>
)

export default function App () {
  // --- State ---
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'add' | 'stats' | 'settings'
  >('dashboard')
  const [user, setUser] = useState<UserProfile>(INITIAL_USER)
  const [logs, setLogs] = useState<Record<string, DailyLog>>({})
  const [isInitializing, setIsInitializing] = useState(true)

  // Add Food State
  const [foodInput, setFoodInput] = useState('')
  const [calInput, setCalInput] = useState('')

  // Weight Update State
  const [newWeight, setNewWeight] = useState('')

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Effects ---
  useEffect(() => {
    // Load data from LocalStorage
    const storedUser = localStorage.getItem(STORAGE_KEY_USER)
    const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse user data', e)
      }
    }
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs))
      } catch (e) {
        console.error('Failed to parse logs data', e)
      }
    }

    setIsInitializing(false)
  }, [])

  useEffect(() => {
    if (!isInitializing) {
      // Save to LocalStorage
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    }
  }, [user, isInitializing])

  useEffect(() => {
    if (!isInitializing) {
      // Save to LocalStorage
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
    }
  }, [logs, isInitializing])

  // --- Computed Data ---
  const today = getTodayDateString()
  const currentLog = logs[today] || { date: today, foods: [], totalCalories: 0 }
  const dailyTarget = calculateTDEE(user)
  const remaining = dailyTarget - currentLog.totalCalories
  const progressPercent = Math.min(
    (currentLog.totalCalories / dailyTarget) * 100,
    100
  )

  // Get last 7 days data for charts
  const weeklyData = useMemo(() => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const log = logs[dateStr]
      data.push({
        name: formatDate(dateStr),
        calories: log ? log.totalCalories : 0,
        target: dailyTarget // Simplified: using current target as reference
      })
    }
    return data
  }, [logs, dailyTarget])

  // --- Handlers ---

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setUser(prev => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString()
    }))
  }

  const handleAddFood = async () => {
    if (!foodInput) return

    let calories = parseInt(calInput)

    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: foodInput,
      calories: calories,
      timestamp: new Date().toISOString()
    }

    setLogs(prev => {
      const todayLog = prev[today] || {
        date: today,
        foods: [],
        totalCalories: 0
      }
      return {
        ...prev,
        [today]: {
          ...todayLog,
          foods: [...todayLog.foods, newFood],
          totalCalories: todayLog.totalCalories + calories
        }
      }
    })

    setFoodInput('')
    setCalInput('')
    setActiveTab('dashboard')
  }

  const handleDeleteFood = (foodId: string) => {
    setLogs(prev => {
      const todayLog = prev[today]
      if (!todayLog) return prev

      const updatedFoods = todayLog.foods.filter(f => f.id !== foodId)
      const newTotal = updatedFoods.reduce((sum, f) => sum + f.calories, 0)

      return {
        ...prev,
        [today]: {
          ...todayLog,
          foods: updatedFoods,
          totalCalories: newTotal
        }
      }
    })
  }

  const handleWeightUpdate = () => {
    const weight = parseFloat(newWeight)
    if (!isNaN(weight) && weight > 0) {
      handleUpdateProfile({ currentWeight: weight })
      setNewWeight('')
      setLogs(prev => {
        const todayLog = prev[today] || {
          date: today,
          foods: [],
          totalCalories: 0
        }
        return {
          ...prev,
          [today]: {
            ...todayLog,
            weightRecorded: weight
          }
        }
      })
    }
  }

  const handleExportData = () => {
    const data = {
      user,
      logs,
      version: '1.0',
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `calorieflow_backup_${getTodayDateString()}.wgd`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const content = e.target?.result as string
        if (!content) return

        const data = JSON.parse(content)

        // Validation: Check for essential keys
        if (data.user && data.logs) {
          // Show file info in confirmation to ensure we read it correctly
          const confirmMsg = `พบข้อมูล:\nชื่อ: ${
            data.user.name || 'ไม่ระบุ'
          }\nน้ำหนัก: ${
            data.user.currentWeight
          }kg\n\nต้องการนำเข้าข้อมูลนี้หรือไม่?`

          if (window.confirm(confirmMsg)) {
            const importedUser = data.user

            // Helper for safe number parsing
            const safeNum = (val: any, fallback: number) => {
              const n = Number(val)
              return n === 0 || !isNaN(n) ? n : fallback
            }

            // Create new user state directly
            const newUserState: UserProfile = {
              ...INITIAL_USER,
              ...importedUser,
              // Explicitly map key fields to ensure they overwrite INITIAL_USER
              name: importedUser.name || INITIAL_USER.name,
              currentWeight: safeNum(
                importedUser.currentWeight,
                INITIAL_USER.currentWeight
              ),
              targetWeight: safeNum(
                importedUser.targetWeight,
                INITIAL_USER.targetWeight
              ),
              height: safeNum(importedUser.height, INITIAL_USER.height),
              age: safeNum(importedUser.age, INITIAL_USER.age),
              activityLevel: safeNum(
                importedUser.activityLevel,
                INITIAL_USER.activityLevel
              ),
              updatedAt: new Date().toISOString()
            }

            // Normalize Gender
            const g = String(importedUser.gender).toLowerCase()
            newUserState.gender = g === 'female' ? Gender.FEMALE : Gender.MALE

            // Normalize Goal
            const goal = String(importedUser.goalType)
            const validGoals = Object.values(GoalType) as string[]
            newUserState.goalType = validGoals.includes(goal)
              ? (goal as GoalType)
              : GoalType.LOSE_WEIGHT

            // Manual TDEE
            const tdee = Number(importedUser.manualTDEE)
            newUserState.manualTDEE = tdee > 0 ? tdee : undefined

            // UPDATE STATE DIRECTLY (Trigger Re-render)
            setUser(newUserState)
            setLogs(data.logs)

            // UPDATE STORAGE (For Persistence)
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUserState))
            localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data.logs))

            alert(`นำเข้าข้อมูลสำเร็จ! ยินดีต้อนรับ ${newUserState.name}`)
          }
        } else {
          alert('รูปแบบไฟล์ไม่ถูกต้อง: ไม่พบข้อมูล user หรือ logs')
        }
      } catch (error) {
        console.error('Import Error:', error)
        alert(
          'เกิดข้อผิดพลาด: ' +
            (error instanceof Error ? error.message : 'Unknown error')
        )
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.readAsText(file)
  }

  // --- Renders ---

  const renderDashboard = () => (
    <div className='space-y-6 pb-24 animate-fade-in'>
      {/* Header / TDEE Summary */}
      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h1 className='text-2xl font-bold text-slate-800'>
              สวัสดี, {user.name}
            </h1>
            <p className='text-slate-500 text-sm'>
              เป้าหมาย:{' '}
              {user.goalType === GoalType.LOSE_WEIGHT
                ? 'ลดน้ำหนัก'
                : user.goalType === GoalType.GAIN_WEIGHT
                ? 'เพิ่มน้ำหนัก'
                : 'รักษาน้ำหนัก'}
            </p>
          </div>
          <div className='bg-green-50 px-3 py-1 rounded-full text-green-700 text-xs font-semibold border border-green-100'>
            {user.currentWeight} kg
          </div>
        </div>

        <div className='flex flex-col items-center'>
          {/* Circular Progress */}
          <CircularProgress
            percentage={progressPercent}
            color={remaining < 0 ? 'text-red-500' : 'text-green-500'}
            size={180}
            strokeWidth={14}
          >
            <div className='text-center'>
              <span className='block text-4xl font-bold text-slate-800'>
                {remaining}
              </span>
              <span className='text-xs text-slate-400 uppercase tracking-wide'>
                เหลือ (Kcal)
              </span>
            </div>
          </CircularProgress>

          <div className='grid grid-cols-2 gap-8 mt-6 w-full max-w-xs'>
            <div className='text-center'>
              <p className='text-xs text-slate-400'>ทานไปแล้ว</p>
              <p className='text-xl font-semibold text-slate-700'>
                {currentLog.totalCalories}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-slate-400'>
                เป้าหมาย ({user.manualTDEE ? 'กำหนดเอง' : 'TDEE'})
              </p>
              <p className='text-xl font-semibold text-slate-700'>
                {dailyTarget}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tube Display (Linear Progress) as requested */}
      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100'>
        <div className='flex justify-between items-center mb-2'>
          <h3 className='font-semibold text-slate-700'>สถานะรายวัน</h3>
          <span className='text-xs text-slate-400'>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className='h-4 bg-slate-100 rounded-full overflow-hidden w-full relative'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              remaining < 0
                ? 'bg-red-500'
                : progressPercent > 80
                ? 'bg-orange-400'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          ></div>
          <div className='absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem] opacity-30'></div>
        </div>
        <p className='text-xs text-slate-400 mt-2 text-right'>
          {remaining < 0 ? 'เกินเป้าหมายแล้ว!' : 'ยังทานได้อีกนิดหน่อย'}
        </p>
      </div>

      {/* Today's List */}
      <div>
        <div className='flex justify-between items-center px-2 mb-3'>
          <h2 className='text-lg font-bold text-slate-800'>รายการวันนี้</h2>
          <button
            onClick={() => setActiveTab('add')}
            className='text-sm text-green-600 font-medium hover:text-green-700 cursor-pointer'
          >
            + เพิ่มรายการ
          </button>
        </div>

        <div className='space-y-3'>
          {currentLog.foods.length === 0 ? (
            <div className='text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200'>
              ยังไม่มีรายการอาหาร
            </div>
          ) : (
            currentLog.foods.map(food => (
              <div
                key={food.id}
                className='bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex justify-between items-center group'
              >
                <div>
                  <p className='font-medium text-slate-700'>{food.name}</p>
                  <p className='text-xs text-slate-400'>
                    {new Date(food.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='font-semibold text-slate-600'>
                    {food.calories} kcal
                  </span>
                  <button
                    onClick={() => handleDeleteFood(food.id)}
                    className='p-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderAddFood = () => (
    <div className='h-full flex flex-col pb-24 animate-fade-in'>
      <h2 className='text-2xl font-bold text-slate-800 mb-6 px-2'>
        เพิ่มรายการอาหาร
      </h2>

      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 flex flex-col gap-6'>
        <div>
          <label className='block text-sm font-medium text-slate-600 mb-2'>
            ชื่อเมนูอาหาร
          </label>
          <div className='relative'>
            <input
              type='text'
              value={foodInput}
              onChange={e => setFoodInput(e.target.value)}
              placeholder='เช่น ข้าวมันไก่, กะเพราหมูสับ...'
              className='w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500'
            />
            <Pencil
              className='absolute right-4 top-1/2 -translate-y-1/2 text-purple-400'
              size={18}
            />
          </div>
          <p className='text-xs text-slate-400 mt-2 flex items-center gap-1'>
            <Pencil size={12} /> โปรดระบุ
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-600 mb-2'>
            แคลอรี่
          </label>
          <input
            type='number'
            value={calInput}
            onChange={e => setCalInput(e.target.value)}
            placeholder='0'
            className='w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500'
          />
        </div>

        <div className='mt-auto'>
          <button
            onClick={handleAddFood}
            disabled={!foodInput || !calInput}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex justify-center items-center gap-2 transition-all ${
              !foodInput || !calInput
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-green-500 text-white hover:bg-green-600 active:scale-95 cursor-pointer'
            }`}
          >
            บันทึกรายการ
          </button>
        </div>
      </div>
    </div>
  )

  const renderStats = () => (
    <div className='pb-24 animate-fade-in space-y-6'>
      <h2 className='text-2xl font-bold text-slate-800 px-2'>สถิติภาพรวม</h2>

      {/* Weekly Chart */}
      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100'>
        <h3 className='font-semibold text-slate-700 mb-6'>แคลอรี่รายสัปดาห์</h3>
        <div className='h-64 w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={weeklyData}
              margin={{ top: 5, right: 0, bottom: 5, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='#f1f5f9'
              />
              <XAxis
                dataKey='name'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <ReferenceLine
                y={dailyTarget}
                stroke='#cbd5e1'
                strokeDasharray='3 3'
              />
              <Bar
                dataKey='calories'
                fill='#22c55e'
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className='text-center text-xs text-slate-400 mt-4'>
          เส้นประคือเป้าหมาย TDEE ปัจจุบันของคุณ ({dailyTarget})
        </p>
      </div>

      {/* Weight Update Section */}
      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='font-semibold text-slate-700'>อัปเดตน้ำหนักล่าสุด</h3>
          <Scale className='text-blue-500' size={20} />
        </div>
        <p className='text-sm text-slate-500 mb-4'>
          การอัปเดตน้ำหนักจะช่วยให้ TDEE คำนวณได้แม่นยำขึ้น
        </p>
        <div className='flex gap-3'>
          <input
            type='number'
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            placeholder={user.currentWeight.toString()}
            className='flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            onClick={handleWeightUpdate}
            className='bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 cursor-pointer'
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className='pb-24 animate-fade-in space-y-6'>
      <h2 className='text-2xl font-bold text-slate-800 px-2'>
        ตั้งค่าข้อมูลส่วนตัว
      </h2>

      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4'>
        <div>
          <label className='text-sm font-medium text-slate-600 block mb-1'>
            ชื่อ
          </label>
          <input
            type='text'
            value={user.name}
            onChange={e => handleUpdateProfile({ name: e.target.value })}
            className='w-full p-3 bg-slate-50 border-slate-200 border rounded-xl'
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className='text-sm font-medium text-slate-600 block mb-1'>
            เพศ
          </label>
          <div className='flex gap-2'>
            <button
              onClick={() => handleUpdateProfile({ gender: Gender.MALE })}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                user.gender === Gender.MALE
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100/30'
              }`}
            >
              <span>ชาย</span>
            </button>
            <button
              onClick={() => handleUpdateProfile({ gender: Gender.FEMALE })}
              className={`flex-1 py-3 rounded-xl border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                user.gender === Gender.FEMALE
                  ? 'bg-pink-50 border-pink-500 text-pink-700 font-medium'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100/30'
              }`}
            >
              <span>หญิง</span>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium text-slate-600 block mb-1'>
              ส่วนสูง (cm)
            </label>
            <input
              type='number'
              value={user.height}
              onChange={e =>
                handleUpdateProfile({ height: parseInt(e.target.value) })
              }
              className='w-full p-3 bg-slate-50 border-slate-200 border rounded-xl'
            />
          </div>
          <div>
            <label className='text-sm font-medium text-slate-600 block mb-1'>
              อายุ (ปี)
            </label>
            <input
              type='number'
              value={user.age}
              onChange={e =>
                handleUpdateProfile({ age: parseInt(e.target.value) })
              }
              className='w-full p-3 bg-slate-50 border-slate-200 border rounded-xl'
            />
          </div>
        </div>

        <div>
          <label className='text-sm font-medium text-slate-600 block mb-1'>
            กิจกรรม
          </label>
          <select
            value={user.activityLevel}
            onChange={e =>
              handleUpdateProfile({ activityLevel: parseFloat(e.target.value) })
            }
            className='w-full p-3 bg-slate-50 border-slate-200 border rounded-xl appearance-none'
          >
            <option value={ActivityLevel.SEDENTARY}>
              ไม่ออกกำลังกาย / น้อยมาก
            </option>
            <option value={ActivityLevel.LIGHTLY_ACTIVE}>
              ออกกำลังกายเบาๆ (1-3 วัน/สัปดาห์)
            </option>
            <option value={ActivityLevel.MODERATELY_ACTIVE}>
              ออกกำลังกายปานกลาง (3-5 วัน)
            </option>
            <option value={ActivityLevel.VERY_ACTIVE}>
              ออกกำลังกายหนัก (6-7 วัน)
            </option>
            <option value={ActivityLevel.EXTRA_ACTIVE}>
              หนักมาก (วันละ 2 เวลา)
            </option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium text-slate-600 block mb-1'>
            เป้าหมาย
          </label>
          <div className='grid grid-cols-3 gap-2'>
            {[
              {
                val: GoalType.LOSE_WEIGHT,
                label: 'ลดน้ำหนัก',
                icon: <TrendingDown size={16} />
              },
              {
                val: GoalType.MAINTAIN,
                label: 'รักษาน้ำหนัก',
                icon: <Activity size={16} />
              },
              {
                val: GoalType.GAIN_WEIGHT,
                label: 'เพิ่มน้ำหนัก',
                icon: <TrendingUp size={16} />
              }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => handleUpdateProfile({ goalType: opt.val })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer ${
                  user.goalType === opt.val
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100/30'
                }`}
              >
                <div className='mb-1'>{opt.icon}</div>
                <span className='text-xs'>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 pt-2'>
          <div className='bg-blue-50 p-4 rounded-xl border border-blue-100'>
            <p className='text-xs text-blue-500 mb-1'>น้ำหนักปัจจุบัน</p>
            <p className='text-xl font-bold text-blue-700'>
              {user.currentWeight} kg
            </p>
          </div>
          <div className='bg-purple-50 p-4 rounded-xl border border-purple-100'>
            <p className='text-xs text-purple-500 mb-1'>เป้าหมายน้ำหนัก</p>
            <input
              type='number'
              className='w-full bg-transparent font-bold text-purple-700 text-xl focus:outline-none'
              value={user.targetWeight}
              onChange={e =>
                handleUpdateProfile({
                  targetWeight: parseFloat(e.target.value)
                })
              }
            />
          </div>
        </div>

        {/* Manual TDEE Override */}
        <div className='bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2'>
          <div className='flex justify-between items-center mb-2'>
            <label className='text-sm font-medium text-slate-600'>
              ตั้งค่า Calories เอง (ถ้าต้องการ)
            </label>
            {user.manualTDEE ? (
              <button
                onClick={() => handleUpdateProfile({ manualTDEE: undefined })}
                className='text-xs text-red-500 hover:underline'
              >
                รีเซ็ตเป็นอัตโนมัติ
              </button>
            ) : null}
          </div>
          <input
            type='number'
            value={user.manualTDEE || ''}
            onChange={e =>
              handleUpdateProfile({
                manualTDEE: e.target.value
                  ? parseInt(e.target.value)
                  : undefined
              })
            }
            placeholder={`ค่าแนะนำอัตโนมัติ: ${calculateTDEE({
              ...user,
              manualTDEE: undefined
            })}`}
            className='w-full p-3 bg-white border-slate-200 border rounded-xl'
          />
          <p className='text-xs text-slate-400 mt-2'>
            ปกติระบบคำนวณจากน้ำหนักปัจจุบัน - 500 kcal (สำหรับการลดน้ำหนัก)
            หากคุณต้องการใช้สูตรน้ำหนักเป้าหมาย สามารถกรอกค่าที่ต้องการที่นี่
          </p>
        </div>
      </div>

      {/* Data Management Section */}
      <div className='bg-white p-6 rounded-3xl shadow-sm border border-slate-100'>
        <h3 className='font-semibold text-slate-700 mb-4 flex items-center gap-2'>
          <FileJson size={20} className='text-slate-400' />
          จัดการข้อมูล (Data)
        </h3>
        <div className='grid grid-cols-2 gap-4'>
          <button
            onClick={handleExportData}
            className='flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100/30 transition-colors cursor-pointer'
          >
            <Download size={24} className='mb-2 text-blue-500' />
            <span className='text-sm font-medium'>ส่งออก (.wgd)</span>
          </button>

          <button
            onClick={handleImportClick}
            className='flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100/30 transition-colors cursor-pointer'
          >
            <Upload size={24} className='mb-2 text-green-500' />
            <span className='text-sm font-medium'>นำเข้า (.wgd)</span>
          </button>
          {/* Hidden File Input - Removed accept attribute */}
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            className='hidden'
          />
        </div>
        <p className='text-xs text-slate-400 mt-4 text-center'>
          ไฟล์ .wgd ใช้สำหรับสำรองข้อมูลหรือย้ายเครื่อง
        </p>
      </div>
    </div>
  )

  if (isInitializing)
    return (
      <div className='flex h-screen items-center justify-center bg-slate-50 text-slate-400'>
        Loading...
      </div>
    )

  return (
    <div className='max-w-md mx-auto h-screen font-sans overflow-hidden text-slate-900'>
      {/* Content Area */}
      <main className='h-full overflow-y-auto no-scrollbar p-6'>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'add' && renderAddFood()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Bottom Navigation */}
      <div className='p-4 sticky bottom-0'>
        <LiquidEffect
          tintColor='#dfdfdf'
          distortion={40}
          className='absolute bottom-0 w-full border border-[#dfdfdf]'
        >
          <div className='flex justify-around items-center p-2 gap-2'>
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={
                <Utensils
                  size={24}
                  strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
                />
              }
              label='หน้าหลัก'
            />
            <TabButton
              active={activeTab === 'add'}
              onClick={() => setActiveTab('add')}
              icon={
                <div className='bg-green-500 rounded-full p-2 text-white shadow-lg shadow-green-200'>
                  <Plus size={24} strokeWidth={3} />
                </div>
              }
              label=''
            />
            <TabButton
              active={activeTab === 'stats'}
              onClick={() => setActiveTab('stats')}
              icon={
                <BarChart2
                  size={24}
                  strokeWidth={activeTab === 'stats' ? 2.5 : 2}
                />
              }
              label='สถิติ'
            />
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={
                <Settings
                  size={24}
                  strokeWidth={activeTab === 'settings' ? 2.5 : 2}
                />
              }
              label='ตั้งค่า'
            />
          </div>
        </LiquidEffect>
      </div>
    </div>
  )
}
