interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink-300 text-[10px] font-semibold text-ink-500 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-accent-400"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-64 -translate-x-1/2 rounded-md bg-ink-900 p-2 text-xs font-normal text-white shadow-lg group-focus-within:block group-hover:block"
      >
        {text}
      </span>
    </span>
  )
}
