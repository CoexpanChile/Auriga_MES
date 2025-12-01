import { cn } from '../../lib/utils'

export function Card({ className = "", children, ...props }) {
  return (
    <div 
      className={cn("bg-gray-800 rounded-2xl shadow-lg border border-gray-700", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div 
      className={cn("p-4 border-b border-gray-700", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div 
      className={cn("p-4", className)} 
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h3 
      className={cn("text-xl font-semibold text-white", className)} 
      {...props}
    >
      {children}
    </h3>
  )
}