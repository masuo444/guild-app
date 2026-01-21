'use client'

import Link from 'next/link'

interface UpgradeBannerProps {
  title?: string
  description?: string
  buttonText?: string
  fullScreen?: boolean
}

export function UpgradeBanner({
  title = 'Upgrade to Unlock',
  description = 'This feature is available for paid members. Upgrade your membership to access all features.',
  buttonText = 'Upgrade Now',
  fullScreen = false,
}: UpgradeBannerProps) {
  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-zinc-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
          <p className="text-zinc-300 mb-6">{description}</p>
          <Link
            href="/auth/subscribe"
            className="inline-block px-6 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors"
          >
            {buttonText}
          </Link>
          <p className="text-sm text-zinc-400 mt-4">
            Free members can view MASU Hub locations on the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-4 border border-zinc-500/30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-[#c0c0c0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <p className="text-xs text-zinc-400">{description}</p>
        </div>
      </div>
      <Link
        href="/auth/subscribe"
        className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors flex-shrink-0"
      >
        {buttonText}
      </Link>
    </div>
  )
}
