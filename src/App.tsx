import React, { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Shield, AlertTriangle, Heart, Activity, TrendingUp, Star,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle,
  Flame, User, Calendar, Briefcase, ArrowUpRight, BadgeAlert,
  BarChart3
} from 'lucide-react'

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs))

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientInfo {
  name: string
  birthdate: string
  gender: string
  jobLevel: string
}

interface MedicalData {
  currentRealDailyAmount: number
  currentFixedDailyAmount: number
  currentRealSurgery: number
  currentRealOutpatientSurgery: number
  currentRealMisc: number
  currentFixedSurgery: number
  proposedRealDailyAmount: number
  proposedFixedDailyAmount: number
  proposedRealSurgery: number
  proposedRealOutpatientSurgery: number
  proposedRealMisc: number
  proposedFixedSurgery: number
}

interface PolicyData {
  // 壽險
  lifeCurrentAmount: number
  lifeProposedAmount: number
  lifeCurrentPremium: number
  lifeProposedPremium: number
  // 意外
  accidentCurrentDeath: number
  accidentProposedDeath: number
  accidentCurrentDaily: number
  accidentProposedDaily: number
  accidentCurrentMisc: number
  accidentProposedMisc: number
  // 醫療
  medical: MedicalData
  // 重大傷病
  criticalType: 'critical_illness' | 'serious_injury'
  criticalCurrentAmount: number
  criticalProposedAmount: number
  criticalCurrentPremium: number
  criticalProposedPremium: number
  // 癌症
  cancerCurrentLumpSum: number
  cancerProposedLumpSum: number
  cancerCurrentDaily: number
  cancerProposedDaily: number
  cancerCurrentSurgery: number
  cancerProposedSurgery: number
  cancerCurrentChemo: number
  cancerProposedChemo: number
  // 長照
  ltcCurrentLumpSum: number
  ltcProposedLumpSum: number
  ltcCurrentMonthly: number
  ltcProposedMonthly: number
  // 總保費
  totalCurrentPremium: number
  totalProposedPremium: number
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialClient: ClientInfo = {
  name: '王小明',
  birthdate: '1985-03-15',
  gender: 'male',
  jobLevel: '1',
}

const initialPolicy: PolicyData = {
  lifeCurrentAmount: 300,
  lifeProposedAmount: 800,
  lifeCurrentPremium: 18000,
  lifeProposedPremium: 32000,
  accidentCurrentDeath: 200,
  accidentProposedDeath: 500,
  accidentCurrentDaily: 500,
  accidentProposedDaily: 1500,
  accidentCurrentMisc: 0,
  accidentProposedMisc: 300000,
  medical: {
    currentRealDailyAmount: 1000,
    currentFixedDailyAmount: 1500,
    currentRealSurgery: 30000,
    currentRealOutpatientSurgery: 0,
    currentRealMisc: 100000,
    currentFixedSurgery: 20000,
    proposedRealDailyAmount: 2000,
    proposedFixedDailyAmount: 2500,
    proposedRealSurgery: 100000,
    proposedRealOutpatientSurgery: 50000,
    proposedRealMisc: 300000,
    proposedFixedSurgery: 50000,
  },
  criticalType: 'critical_illness',
  criticalCurrentAmount: 100,
  criticalProposedAmount: 200,
  criticalCurrentPremium: 12000,
  criticalProposedPremium: 22000,
  cancerCurrentLumpSum: 30,
  cancerProposedLumpSum: 100,
  cancerCurrentDaily: 2000,
  cancerProposedDaily: 3000,
  cancerCurrentSurgery: 50000,
  cancerProposedSurgery: 150000,
  cancerCurrentChemo: 10000,
  cancerProposedChemo: 30000,
  ltcCurrentLumpSum: 0,
  ltcProposedLumpSum: 100,
  ltcCurrentMonthly: 0,
  ltcProposedMonthly: 30000,
  totalCurrentPremium: 42000,
  totalProposedPremium: 86000,
}

// ─── Editable Number Input ────────────────────────────────────────────────────

interface NumInputProps {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  className?: string
  isProposed?: boolean
  isZero?: boolean
}

function NumInput({ value, onChange, prefix, suffix, className, isProposed, isZero }: NumInputProps) {
  const isEmpty = isZero && value === 0
  return (
    <div className="flex items-center gap-1">
      {prefix && <span className={cn('text-sm shrink-0', isProposed ? 'text-blue-500' : 'text-slate-400')}>{prefix}</span>}
      <input
        type="number"
        value={value === 0 && isEmpty ? '' : value}
        placeholder={isEmpty ? '未投保' : '0'}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className={cn(
          'w-full bg-transparent border-b-2 border-transparent text-right',
          'focus:outline-none focus:ring-0 focus:border-b-2',
          'transition-colors duration-150',
          isProposed
            ? 'text-blue-600 font-bold text-base focus:border-blue-400 placeholder:text-blue-300'
            : 'text-slate-400 font-medium text-base focus:border-slate-300 placeholder:text-slate-300',
          isEmpty && !isProposed && 'italic text-red-400 placeholder:text-red-300',
          className
        )}
      />
      {suffix && <span className={cn('text-xs shrink-0 whitespace-nowrap', isProposed ? 'text-blue-400' : 'text-slate-400')}>{suffix}</span>}
    </div>
  )
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

type Status = 'good' | 'warning' | 'danger'

function StatusPill({ status, label }: { status: Status; label?: string }) {
  const cfg = {
    good:    { icon: <CheckCircle size={13} />,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: label || '保障完善' },
    warning: { icon: <AlertCircle size={13} />,  cls: 'bg-blue-50 text-blue-700 border-blue-200',          text: label || '建議提升' },
    danger:  { icon: <XCircle size={13} />,      cls: 'text-red-600 bg-red-50 border-red-200',             text: label || '缺口風險' },
  }[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap', cfg.cls)}>
      {cfg.icon}{cfg.text}
    </span>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

interface RowProps {
  label: string
  note?: string
  hotTag?: boolean
  alertTag?: boolean
  highlight​​​​​​​​​​​​​​​​
