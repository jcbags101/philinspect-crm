import { cn } from "@/lib/utils"

interface ResultSummaryProps extends React.ComponentProps<"p"> {
  shown: number
  total: number
  noun?: string
  filtered?: boolean
}

function ResultSummary({
  shown,
  total,
  noun = "result",
  filtered = shown !== total,
  className,
  ...props
}: ResultSummaryProps) {
  const pluralNoun = total === 1 ? noun : `${noun}s`

  return (
    <p
      data-slot="result-summary"
      className={cn(
        "text-[10px] leading-[14px] text-[var(--pi-content-secondary)]",
        className
      )}
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      {filtered ? `Showing ${shown} of ${total} ${pluralNoun}` : `${total} ${pluralNoun}`}
    </p>
  )
}

export { ResultSummary, type ResultSummaryProps }
