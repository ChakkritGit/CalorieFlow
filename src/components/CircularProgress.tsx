import React from 'react'

interface CircularProgressProps {
  percentage: number
  color: string
  size?: number
  strokeWidth?: number
  children?: React.ReactNode
}

interface BorderProgressProps {
  percentage: number
  size?: number
  thickness?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color,
  size = 120,
  strokeWidth = 10,
  children
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div
      className='relative flex items-center justify-center'
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='absolute inset-0 -rotate-90'
      >
        <circle
          strokeWidth={strokeWidth}
          stroke='currentColor'
          className='text-gray-200'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          stroke='currentColor'
          className={`transition-all duration-1000 ease-out ${color}`}
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>

      <div className='relative z-10 flex flex-col items-center justify-center'>
        {children}
      </div>
    </div>
  )
}

export const BorderProgress = ({
  percentage,
  size = 180,
  thickness = 12,
  color = '#22c55e',
  trackColor = '#e5e7eb',
  children
}: BorderProgressProps) => {
  const p = Math.min(Math.max(percentage, 0), 100)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (p / 100) * circumference

  return (
    <div
      className='relative flex items-center justify-center'
      style={{
        width: size,
        height: size
      }}
    >
      <svg width={size} height={size} className='absolute inset-0'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap='round'
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>

      <div className='absolute inset-0 flex items-center justify-center text-center z-10'>
        {children}
      </div>
    </div>
  )
}
