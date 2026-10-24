interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
      {message}
    </div>
  )
}
