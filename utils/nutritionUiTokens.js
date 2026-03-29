export function getNutritionUiTokens(theme = 'light') {
  const dark = theme === 'dark';

  return {
    panel: dark
      ? 'bg-zinc-900/95 border border-zinc-800 text-zinc-100'
      : 'bg-white/95 border border-zinc-200 text-zinc-900',
    input: dark
      ? 'w-full rounded-xl px-3 py-2 border transition-all duration-200 outline-none focus:ring-2 focus:ring-yellow-400 caret-yellow-400 !bg-zinc-900 !text-zinc-100 placeholder:text-zinc-500 border-zinc-800'
      : 'w-full rounded-xl px-3 py-2 border transition-all duration-200 outline-none focus:ring-2 focus:ring-yellow-400 caret-yellow-400 !bg-white !text-zinc-900 placeholder:text-zinc-400 border-zinc-300',
    row: dark ? 'bg-zinc-900' : 'bg-white',
    rowAlt: dark ? 'bg-zinc-950' : 'bg-zinc-50',
    head: dark ? 'bg-zinc-800' : 'bg-zinc-200',
    border: dark ? 'border-zinc-800' : 'border-zinc-300',
    headText: dark ? 'text-zinc-100' : 'text-zinc-900',
    cellText: dark ? 'text-zinc-200' : 'text-zinc-800',
    section: dark
      ? 'rounded-2xl p-5 shadow-sm ring-1 ring-zinc-800 bg-gradient-to-b from-zinc-900/95 to-zinc-900/75 border border-zinc-800 text-zinc-100'
      : 'rounded-2xl p-5 shadow-sm ring-1 ring-zinc-200 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200 text-zinc-900',
    label: dark ? 'block text-sm font-semibold text-zinc-100' : 'block text-sm font-semibold text-zinc-900',
    helper: dark ? 'text-xs text-zinc-400' : 'text-xs text-zinc-500',
    mutedText: dark ? 'text-sm text-zinc-300' : 'text-sm text-zinc-600',
    summaryBox: dark
      ? 'rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm'
      : 'rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm',
    metricCard: dark
      ? 'rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm'
      : 'rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm',
    primaryButton:
      'inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700',
    successButton:
      'inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-green-700',
    dangerButton:
      'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-red-700',
    secondaryButton: dark
      ? 'inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-zinc-100 shadow-sm transition hover:bg-zinc-800'
      : 'inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50',
    badge: dark
      ? 'inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-semibold text-yellow-200'
      : 'inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800',
  };
}
