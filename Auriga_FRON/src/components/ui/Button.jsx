import { cn } from '../../lib/utils'

export function Button({ variant = "default", className = "", children, ...props }) {
  const base = "rounded-xl px-4 py-2 font-medium transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-600 bg-transparent hover:bg-gray-800 text-gray-100",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }
  
  return (
    <button 
      className={cn(base, variants[variant] || variants.default, className)} 
      {...props}
    >
      {children}
    </button>
  )
}