// AltiFlow Design System — shared tokens and small UI primitives

export const colors = {
  bg: '#09090b',
  card: '#0f0f14',
  cardElevated: '#141418',
  border: '#222228',
  borderMuted: '#1a1a1f',

  primary: '#3b82f6',
  primaryMuted: '#1d3a5f',
  primaryText: '#93c5fd',

  success: '#10b981',
  successMuted: '#064e3b',
  successText: '#6ee7b7',

  warning: '#f59e0b',
  warningMuted: '#451a03',
  warningText: '#fcd34d',

  danger: '#dc2626',
  dangerMuted: '#450a0a',
  dangerText: '#fca5a5',

  purple: '#8b5cf6',
  purpleMuted: '#2e1065',
  purpleText: '#c4b5fd',

  textPrimary: '#fafafa',
  textSecondary: '#e4e4e7',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',
  textDim: '#52525b',
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Pending':       { bg: colors.primaryMuted,  text: colors.primaryText,  border: colors.primary + '40' },
  'In Progress':   { bg: '#1a3a2a',            text: colors.successText,  border: colors.success + '40' },
  'Done':          { bg: colors.successMuted,  text: colors.successText,  border: colors.success + '40' },
  'Blocked':       { bg: colors.dangerMuted,   text: colors.dangerText,   border: colors.danger + '40' },
  'Cancelled':     { bg: colors.dangerMuted,   text: colors.dangerText,   border: colors.danger + '40' },
  'Yet to Upload': { bg: '#1a1a1f',            text: colors.textDim,      border: colors.border },
  'Open':          { bg: colors.primaryMuted,  text: colors.primaryText,  border: colors.primary + '40' },
  'Failed_Refly':  { bg: colors.warningMuted,  text: colors.warningText,  border: colors.warning + '40' },
  'Delivery':      { bg: '#1a2e1a',            text: '#86efac',           border: '#4ade8040' },
  'Resolved':      { bg: colors.successMuted,  text: colors.successText,  border: colors.success + '40' },
  'Closed':        { bg: '#1a1a1f',            text: colors.textDim,      border: colors.border },
}

export const ROLE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  'Super-Admin':  { color: '#f87171', bg: '#450a0a', border: '#dc262640' },
  'Admin':        { color: colors.warningText, bg: colors.warningMuted, border: colors.warning + '40' },
  'Client-Admin': { color: colors.primaryText, bg: colors.primaryMuted, border: colors.primary + '40' },
  'Client-User':  { color: colors.successText, bg: colors.successMuted, border: colors.success + '40' },
}
