import { cn } from '../../lib/utils'

export function Badge({ className = "", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}