// Session 10: Password strength meter component
import { validatePassword, type PasswordStrength } from '../lib/validation'

interface PasswordStrengthMeterProps {
  password: string
  showFeedback?: boolean
}

export function PasswordStrengthMeter({ password, showFeedback = true }: PasswordStrengthMeterProps) {
  const strength = validatePassword(password)

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: level <= strength.score ? strength.color : 'hsl(var(--muted))'
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex justify-between items-center text-xs">
        <span style={{ color: strength.color }}>{strength.label}</span>
        {strength.score < 3 && showFeedback && strength.feedback.length > 0 && (
          <span className="text-muted-foreground">
            Need: {strength.feedback.slice(0, 2).join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

export function usePasswordStrength(password: string): PasswordStrength {
  return validatePassword(password)
}
