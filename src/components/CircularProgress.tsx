import React from 'react'

interface CircularProgressProps {
  percentage: number
  color: string
  size?: number
  strokeWidth?: number
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
      <svg className='transform -rotate-90 w-full h-full'>
        <circle
          className='text-gray-200'
          strokeWidth={strokeWidth}
          stroke='currentColor'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-all duration-1000 ease-out ${color}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          stroke='currentColor'
          fill='transparent'
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className='absolute inset-0 flex items-center justify-center flex-col'>
        {children}
      </div>
    </div>
  )
}
