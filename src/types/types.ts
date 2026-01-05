export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum ActivityLevel {
  SEDENTARY = 1.2, // Little or no exercise
  LIGHTLY_ACTIVE = 1.375, // Light exercise/sports 1-3 days/week
  MODERATELY_ACTIVE = 1.55, // Moderate exercise/sports 3-5 days/week
  VERY_ACTIVE = 1.725, // Hard exercise/sports 6-7 days/week
  EXTRA_ACTIVE = 1.9 // Very hard exercise/sports & physical job or 2x training
}

export enum GoalType {
  LOSE_WEIGHT = 'lose',
  MAINTAIN = 'maintain',
  GAIN_WEIGHT = 'gain'
}

export interface UserProfile {
  name: string
  gender: Gender
  age: number
  height: number // cm
  currentWeight: number // kg
  targetWeight: number // kg
  activityLevel: ActivityLevel
  goalType: GoalType
  manualTDEE?: number // If user overrides
  updatedAt: string
  streak: number // บันทึกต่อเนื่องกี่วัน
  lastLogTimestamp?: string // เวลาที่บันทึกล่าสุด (ISO String)
  waterGoal: number // เป้าหมายการดื่มน้ำ (ml)
}

export interface FoodItem {
  id: string
  name: string
  calories: number
  timestamp: string
}

export interface DailyLog {
  date: string // YYYY-MM-DD
  foods: FoodItem[]
  totalCalories: number
  weightRecorded?: number
  waterIntake: number
}
