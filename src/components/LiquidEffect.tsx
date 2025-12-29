import React, {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react'

interface LiquidCardProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  tintColor?: string
  tintOpacity?: number
  frostBlur?: number
  distortion?: number
  noiseFreq?: number
}

interface LiquidStyle extends CSSProperties {
  '--tint-rgb'?: string
  '--tint-opacity'?: number | string
  '--frost-blur'?: string
  '--distortion-filter'?: string
}

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
        result[3],
        16
      )}`
    : '0, 0, 0'
}

const LiquidEffect: React.FC<LiquidCardProps> = ({
  children,
  className = '',
  style = {},
  tintColor = '#000000',
  tintOpacity = 0.13,
  frostBlur = 3,
  distortion = 25,
  noiseFreq = 0.01
}) => {
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const supported =
      CSS.supports('backdrop-filter', 'blur(1px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
    setIsSupported(supported)
  }, [])

  const uniqueId = useId().replace(/:/g, '')
  const filterId = `liquid-filter-${uniqueId}`

  const cssVars: LiquidStyle = {
    ...style,
    '--tint-rgb': hexToRgb(tintColor),
    '--tint-opacity': isSupported ? tintOpacity : 1,
    '--frost-blur': `${frostBlur}px`,
    '--distortion-filter': `url(#${filterId})`
  }

  return (
    <div
      className={`liquid-card ${className}`}
      style={cssVars as CSSProperties}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      <svg
        width='0'
        height='0'
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <defs>
          <filter id={filterId} x='-20%' y='-20%' width='140%' height='140%'>
            <feTurbulence
              type='fractalNoise'
              baseFrequency={`${noiseFreq} ${noiseFreq}`}
              numOctaves='2'
              seed='5'
              result='noise'
            />
            <feGaussianBlur in='noise' stdDeviation='2' result='blurred' />
            <feDisplacementMap
              in='SourceGraphic'
              in2='blurred'
              scale={distortion}
              xChannelSelector='R'
              yChannelSelector='G'
            />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export default LiquidEffect
