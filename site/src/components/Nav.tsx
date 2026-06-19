import { useEffect, useState } from 'react'
import { REPO_URL } from '../constants'
import { GitHubIcon } from './icons'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#architecture', label: 'Architecture' },
]

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 font-bold tracking-tight text-fg">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-bg shadow-glow">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M11 12.5a4.5 3 0 0 1 9 0M21 19.5a4.5 3 0 0 1-9 0"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M20 9.5v3.2h-3.2M12 22.5v-3.2h3.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg">ServSync</span>
    </a>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? 'border-line bg-bg/80 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent/60 hover:bg-muted"
        >
          <GitHubIcon width={16} height={16} />
          <span className="hidden sm:inline">View on GitHub</span>
          <span className="sm:hidden">GitHub</span>
        </a>
      </nav>
    </header>
  )
}
