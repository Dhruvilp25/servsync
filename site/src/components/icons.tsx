import type { SVGProps } from 'react'

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2.1c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  )
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  )
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function CloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 8.5 4 4 0 0 0 7 19h10.5Z" />
    </svg>
  )
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function SlidersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </svg>
  )
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
