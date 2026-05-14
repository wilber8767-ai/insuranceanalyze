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
  highlight?: boolean
  currentNode: React.ReactNode
  proposedNode: React.ReactNode
  status: Status
  statusLabel?: string
}

function Row({ label, note, hotTag, alertTag, highlight, currentNode, proposedNode, status, statusLabel }: RowProps) {
  return (
    <tr className={cn('border-b border-slate-100 last:border-0 align-top', highlight ? 'bg-blue-50/30' : 'hover:bg-slate-50/60')}>
      <td className="py-4 pl-6 pr-4 w-[38%]">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-start gap-1.5">
            {hotTag && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 text-[10px] font-bold border border-orange-200 shrink-0">
                <Flame size={9} />最重要
              </span>
            )}
            {alertTag && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 shrink-0">
                <BadgeAlert size={9} />保障範圍極窄
              </span>
            )}
            <span className={cn('text-sm leading-snug', highlight ? 'font-semibold text-slate-800' : 'font-medium text-slate-700')}>
              {label}
            </span>
          </div>
          {note && <p className="text-xs text-slate-400 leading-snug">{note}</p>}
        </div>
      </td>
      <td className="py-4 px-3 w-[22%]">{currentNode}</td>
      <td className="py-4 px-3 w-[22%]">{proposedNode}</td>
      <td className="py-4 pr-6 pl-2 w-[18%]"><StatusPill status={status} label={statusLabel} /></td>
    </tr>
  )
}

// ─── Summary Card (合計) ──────────────────────────────────────────────────────

function SummaryRow({ currentTotal, proposedTotal }: { currentTotal: number; proposedTotal: number }) {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-3">
        <div className="rounded-xl bg-slate-800 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">每日合計保障金額（實支＋定額）</p>
            <p className="text-[11px] text-slate-500 mt-0.5">自動加總：實支日額 + 定額日額</p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">現有方案</p>
              <p className="text-xl font-bold text-slate-300 font-mono">NT${currentTotal.toLocaleString()} <span className="text-sm font-normal">/ 日</span></p>
            </div>
            <div className="w-px h-8 bg-slate-600" />
            <div className="text-center">
              <p className="text-xs text-emerald-400 mb-1">建議方案</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">NT${proposedTotal.toLocaleString()} <span className="text-sm font-normal">/ 日</span></p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Section Card Wrapper ─────────────────────────────────────────────────────

interface SectionWrapperProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  accentColor: string
  borderColor: string
  iconBg: string
  criticalAlert?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function SectionCard({ title, subtitle, icon, accentColor, borderColor, iconBg, criticalAlert, children, defaultOpen = true }: SectionWrapperProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border overflow-hidden', borderColor)}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/60 transition-colors">
        <div className="flex items-center gap-4">
          <div className={cn('p-2.5 rounded-xl', iconBg)}>{icon}</div>
          <div className="text-left">
            <h2 className={cn('text-base font-bold', accentColor)}>{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-slate-300">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>
      {criticalAlert && open && (
        <div className="mx-6 mb-2 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-600">{criticalAlert}</p>
        </div>
      )}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-t border-b border-slate-100 bg-slate-50/70">
                <th className="py-3 pl-6 pr-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">保障項目</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">現有方案</th>
                <th className="py-3 px-3 text-left text-[11px] font-semibold text-blue-500 uppercase tracking-wider">建議方案</th>
                <th className="py-3 pr-6 pl-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">狀態</th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Client Info Card ─────────────────────────────────────────────────────────

function ClientCard({ client, onChange }: { client: ClientInfo; onChange: (c: ClientInfo) => void }) {
  const set = (k: keyof ClientInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...client, [k]: e.target.value })

  const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-300'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><User size={18} /></div>
        <div>
          <h2 className="text-base font-bold text-slate-800">客戶基本資料</h2>
          <p className="text-xs text-slate-400 mt-0.5">被保險人資訊</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">客戶姓名</label>
          <input value={client.name} onChange={set('name')} placeholder="王小明" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            <span className="inline-flex items-center gap-1"><Calendar size={11} />出生年月日</span>
          </label>
          <input type="date" value={client.birthdate} onChange={set('birthdate')} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">性別</label>
          <select value={client.gender} onChange={set('gender')} className={inputCls}>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            <span className="inline-flex items-center gap-1"><Briefcase size={11} />職業等級</span>
          </label>
          <select value={client.jobLevel} onChange={set('jobLevel')} className={inputCls}>
            <option value="1">1 類（內勤/文職）</option>
            <option value="2">2 類（業務/輕勞動）</option>
            <option value="3">3 類（技術/輕機械）</option>
            <option value="4">4 類（重體力勞動）</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Optimization Summary ─────────────────────────────────────────────────────

interface SummaryProps {
  policy: PolicyData
  client: ClientInfo
}

function OptimizationSummary({ policy, client }: SummaryProps) {
  const premiumDiff = policy.totalProposedPremium - policy.totalCurrentPremium
  const lifePct = policy.lifeCurrentAmount > 0
    ? Math.round(((policy.lifeProposedAmount - policy.lifeCurrentAmount) / policy.lifeCurrentAmount) * 100) : 0
  const miscCurrent = policy.medical.currentRealMisc / 10000
  const miscProposed = policy.medical.proposedRealMisc / 10000
  const miscDiff = miscProposed - miscCurrent
  const dailyCurrent = policy.medical.currentRealDailyAmount + policy.medical.currentFixedDailyAmount
  const dailyProposed = policy.medical.proposedRealDailyAmount + policy.medical.proposedFixedDailyAmount
  const dailyPct = dailyCurrent > 0 ? Math.round(((dailyProposed - dailyCurrent) / dailyCurrent) * 100) : 0

  const cards = [
    {
      label: '年保費增加',
      value: `+NT$${premiumDiff.toLocaleString()}`,
      sub: `現有 ${policy.totalCurrentPremium.toLocaleString()} → 建議 ${policy.totalProposedPremium.toLocaleString()}`,
      color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
    },
    {
      label: '身故保障提升',
      value: `+${lifePct}%`,
      sub: `${policy.lifeCurrentAmount} 萬 → ${policy.lifeProposedAmount} 萬`,
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
    },
    {
      label: '醫療雜費額度提升',
      value: `+${miscDiff} 萬`,
      sub: `${miscCurrent} 萬 → ${miscProposed} 萬`,
      color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100',
    },
    {
      label: '住院日額合計提升',
      value: `+${dailyPct}%`,
      sub: `NT$${dailyCurrent.toLocaleString()} → NT$${dailyProposed.toLocaleString()} / 日`,
      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><BarChart3 size={18} /></div>
        <div>
          <h2 className="text-base font-bold text-slate-800">優化效益總結</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {client.name || '客戶'} 的保障提升分析（數據即時聯動）
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((c, i) => (
            <div key={i} className={cn('rounded-xl border p-4', c.bg, c.border)}>
              <p className={cn('text-2xl font-bold font-mono', c.color)}>{c.value}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{c.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Premium bar */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">年繳保費對比</p>
          <div className="space-y-3">
            {[
              { label: '現有方案合計', val: policy.totalCurrentPremium, max: policy.totalProposedPremium, color: 'bg-slate-300' },
              { label: '建議方案合計', val: policy.totalProposedPremium, max: policy.totalProposedPremium, color: 'bg-blue-500' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 shrink-0">{b.label}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', b.color)}
                    style={{ width: `${Math.min((b.val / b.max) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 font-mono w-28 text-right">
                  NT${b.val.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {policy.criticalType === 'critical_illness' && (
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">
              ⚠️ 重大疾病(7項)保障範圍極窄，建議優先升級為重大傷病險，此為本次規劃最關鍵優化項目。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [client, setClient] = useState<ClientInfo>(initialClient)
  const [p, setP] = useState<PolicyData>(initialPolicy)

  const set = useCallback(<K extends keyof PolicyData>(key: K, value: PolicyData[K]) => {
    setP(prev => ({ ...prev, [key]: value }))
  }, [])

  const setMed = useCallback(<K extends keyof MedicalData>(key: K, value: number) => {
    setP(prev => ({ ...prev, medical: { ...prev.medical, [key]: value } }))
  }, [])

  const dailyCurrent = p.medical.currentRealDailyAmount + p.medical.currentFixedDailyAmount
  const dailyProposed = p.medical.proposedRealDailyAmount + p.medical.proposedFixedDailyAmount

  const getLifeStatus = (): Status => p.lifeProposedAmount >= 500 ? 'good' : 'warning'
  const getAccMiscStatus = (): Status => p.accidentCurrentMisc === 0 ? 'danger' : p.accidentProposedMisc > p.accidentCurrentMisc ? 'warning' : 'good'
  const getMiscStatus = (): Status => p.medical.proposedRealMisc >= 300000 ? 'good' : 'warning'
  const getCriticalStatus = (): Status => p.criticalType === 'critical_illness' ? 'danger' : p.criticalProposedAmount > p.criticalCurrentAmount ? 'warning' : 'good'

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">保險規劃分析工具</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">互動填寫 · 即時分析</p>
            </div>
          </div>
          {client.name && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <User size={13} className="text-blue-500" />
              <span className="text-xs text-blue-700 font-semibold">{client.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">

        {/* Client Info */}
        <ClientCard client={client} onChange={setClient} />

        {/* 壽險 */}
        <SectionCard
          title="壽險" subtitle="身故保障"
          icon={<Shield size={18} />}
          accentColor="text-blue-600" borderColor="border-blue-100"
          iconBg="bg-blue-50 text-blue-600"
        >
          <Row
            label="身故保障額度"
            note="建議提升至家庭年收入 10 倍以上"
            currentNode={<NumInput value={p.lifeCurrentAmount} onChange={v => set('lifeCurrentAmount', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.lifeProposedAmount} onChange={v => set('lifeProposedAmount', v)} suffix="萬" isProposed />}
            status={getLifeStatus()}
          />
          <Row
            label="年繳保費"
            currentNode={<NumInput value={p.lifeCurrentPremium} onChange={v => set('lifeCurrentPremium', v)} prefix="NT$" />}
            proposedNode={<NumInput value={p.lifeProposedPremium} onChange={v => set('lifeProposedPremium', v)} prefix="NT$" isProposed />}
            status="good"
          />
        </SectionCard>

        {/* 意外險 */}
        <SectionCard
          title="意外險" subtitle="意外身故・住院・實支"
          icon={<AlertTriangle size={18} />}
          accentColor="text-orange-500" borderColor="border-orange-100"
          iconBg="bg-orange-50 text-orange-500"
        >
          <Row
            label="意外身故"
            currentNode={<NumInput value={p.accidentCurrentDeath} onChange={v => set('accidentCurrentDeath', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.accidentProposedDeath} onChange={v => set('accidentProposedDeath', v)} suffix="萬" isProposed />}
            status={p.accidentProposedDeath >= 400 ? 'good' : 'warning'}
          />
          <Row
            label="意外住院日額"
            currentNode={<NumInput value={p.accidentCurrentDaily} onChange={v => set('accidentCurrentDaily', v)} prefix="NT$" suffix="/ 日" />}
            proposedNode={<NumInput value={p.accidentProposedDaily} onChange={v => set('accidentProposedDaily', v)} prefix="NT$" suffix="/ 日" isProposed />}
            status="warning"
          />
          <Row
            label="意外實支實付（雜費上限）"
            note="目前最大保障缺口，強烈建議優先補足"
            highlight hotTag
            currentNode={<NumInput value={p.accidentCurrentMisc} onChange={v => set('accidentCurrentMisc', v)} prefix="NT$" isZero />}
            proposedNode={<NumInput value={p.accidentProposedMisc} onChange={v => set('accidentProposedMisc', v)} prefix="NT$" isProposed />}
            status={getAccMiscStatus()}
            statusLabel={p.accidentCurrentMisc === 0 ? '缺口風險' : undefined}
          />
        </SectionCard>

        {/* 醫療險 */}
        <SectionCard
          title="醫療險" subtitle="實支實付・定額給付"
          icon={<Activity size={18} />}
          accentColor="text-teal-600" borderColor="border-teal-100"
          iconBg="bg-teal-50 text-teal-600"
        >
          <Row label="【實支】住院日額"
            currentNode={<NumInput value={p.medical.currentRealDailyAmount} onChange={v => setMed('currentRealDailyAmount', v)} prefix="NT$" suffix="/ 日" />}
            proposedNode={<NumInput value={p.medical.proposedRealDailyAmount} onChange={v => setMed('proposedRealDailyAmount', v)} prefix="NT$" suffix="/ 日" isProposed />}
            status="warning"
          />
          <Row label="【實支】住院手術"
            currentNode={<NumInput value={p.medical.currentRealSurgery} onChange={v => setMed('currentRealSurgery', v)} prefix="NT$" suffix="/ 次" />}
            proposedNode={<NumInput value={p.medical.proposedRealSurgery} onChange={v => setMed('proposedRealSurgery', v)} prefix="NT$" suffix="/ 次" isProposed />}
            status="warning"
          />
          <Row label="【實支】門診手術"
            currentNode={<NumInput value={p.medical.currentRealOutpatientSurgery} onChange={v => setMed('currentRealOutpatientSurgery', v)} prefix="NT$" suffix="/ 次" isZero />}
            proposedNode={<NumInput value={p.medical.proposedRealOutpatientSurgery} onChange={v => setMed('proposedRealOutpatientSurgery', v)} prefix="NT$" suffix="/ 次" isProposed />}
            status={p.medical.currentRealOutpatientSurgery === 0 ? 'danger' : 'warning'}
          />
          <Row
            label="【實支】雜費上限"
            note="涵蓋自費醫材、新式藥物、達文西手術費等"
            highlight hotTag
            currentNode={<NumInput value={p.medical.currentRealMisc} onChange={v => setMed('currentRealMisc', v)} prefix="NT$" />}
            proposedNode={<NumInput value={p.medical.proposedRealMisc} onChange={v => setMed('proposedRealMisc', v)} prefix="NT$" isProposed />}
            status={getMiscStatus()}
          />
          <Row label="【定額】住院日額"
            currentNode={<NumInput value={p.medical.currentFixedDailyAmount} onChange={v => setMed('currentFixedDailyAmount', v)} prefix="NT$" suffix="/ 日" />}
            proposedNode={<NumInput value={p.medical.proposedFixedDailyAmount} onChange={v => setMed('proposedFixedDailyAmount', v)} prefix="NT$" suffix="/ 日" isProposed />}
            status="warning"
          />
          <Row label="【定額】住院手術"
            currentNode={<NumInput value={p.medical.currentFixedSurgery} onChange={v => setMed('currentFixedSurgery', v)} prefix="NT$" suffix="/ 次" />}
            proposedNode={<NumInput value={p.medical.proposedFixedSurgery} onChange={v => setMed('proposedFixedSurgery', v)} prefix="NT$" suffix="/ 次" isProposed />}
            status="warning"
          />
          <SummaryRow currentTotal={dailyCurrent} proposedTotal={dailyProposed} />
        </SectionCard>

        {/* 重大傷病險 */}
        <SectionCard
          title="重大傷病險" subtitle="重大疾病・重大傷病"
          icon={<Heart size={18} />}
          accentColor="text-rose-600" borderColor="border-rose-100"
          iconBg="bg-rose-50 text-rose-600"
          criticalAlert={p.criticalType === 'critical_illness' ? '現有保單為「重大疾病(7項)」— 保障範圍極窄，需立即優化！' : undefined}
        >
          {/* Toggle row */}
          <tr className="border-b border-slate-100 bg-rose-50/20">
            <td className="py-4 pl-6 pr-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-800">保障範圍類型</span>
                <span className="text-xs text-slate-400">現有保單的保障類型</span>
              </div>
            </td>
            <td colSpan={2} className="py-4 px-3">
              <div className="flex items-center gap-2">
                {(['critical_illness', 'serious_injury'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => set('criticalType', type)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                      p.criticalType === type
                        ? type === 'critical_illness'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {type === 'critical_illness' ? '重大疾病（7項）' : '重大傷病（新制）'}
                  </button>
                ))}
              </div>
            </td>
            <td className="py-4 pr-6 pl-2">
              {p.criticalType === 'critical_illness'
                ? <StatusPill status="danger" label="保障範圍極窄" />
                : <StatusPill status="good" label="符合新制" />
              }
            </td>
          </tr>

          <Row
            label="一次給付額度"
            note={p.criticalType === 'critical_illness' ? '重大疾病7項 vs 重大傷病22萬+項，差距極大' : undefined}
            highlight
            alertTag={p.criticalType === 'critical_illness'}
            currentNode={<NumInput value={p.criticalCurrentAmount} onChange={v => set('criticalCurrentAmount', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.criticalProposedAmount} onChange={v => set('criticalProposedAmount', v)} suffix="萬" isProposed />}
            status={getCriticalStatus()}
          />
          <Row
            label="年繳保費"
            currentNode={<NumInput value={p.criticalCurrentPremium} onChange={v => set('criticalCurrentPremium', v)} prefix="NT$" />}
            proposedNode={<NumInput value={p.criticalProposedPremium} onChange={v => set('criticalProposedPremium', v)} prefix="NT$" isProposed />}
            status="good"
          />
        </SectionCard>

        {/* 癌症險 */}
        <SectionCard
          title="癌症險" subtitle="一次金・住院・化放療"
          icon={<TrendingUp size={18} />}
          accentColor="text-violet-600" borderColor="border-violet-100"
          iconBg="bg-violet-50 text-violet-600"
        >
          <Row label="初次罹癌一次金" highlight
            currentNode={<NumInput value={p.cancerCurrentLumpSum} onChange={v => set('cancerCurrentLumpSum', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.cancerProposedLumpSum} onChange={v => set('cancerProposedLumpSum', v)} suffix="萬" isProposed />}
            status={p.cancerProposedLumpSum >= 100 ? 'good' : 'warning'}
          />
          <Row label="住院日額"
            currentNode={<NumInput value={p.cancerCurrentDaily} onChange={v => set('cancerCurrentDaily', v)} prefix="NT$" suffix="/ 日" />}
            proposedNode={<NumInput value={p.cancerProposedDaily} onChange={v => set('cancerProposedDaily', v)} prefix="NT$" suffix="/ 日" isProposed />}
            status="good"
          />
          <Row label="住院手術"
            currentNode={<NumInput value={p.cancerCurrentSurgery} onChange={v => set('cancerCurrentSurgery', v)} prefix="NT$" suffix="/ 次" />}
            proposedNode={<NumInput value={p.cancerProposedSurgery} onChange={v => set('cancerProposedSurgery', v)} prefix="NT$" suffix="/ 次" isProposed />}
            status="warning"
          />
          <Row label="化療／放療補助" note="含標靶治療、免疫療法補助"
            currentNode={<NumInput value={p.cancerCurrentChemo} onChange={v => set('cancerCurrentChemo', v)} prefix="NT$" suffix="/ 次" />}
            proposedNode={<NumInput value={p.cancerProposedChemo} onChange={v => set('cancerProposedChemo', v)} prefix="NT$" suffix="/ 次" isProposed />}
            status="warning"
          />
        </SectionCard>

        {/* 長照險 */}
        <SectionCard
          title="長照險" subtitle="失能扶助・長期照護"
          icon={<Star size={18} />}
          accentColor="text-indigo-600" borderColor="border-indigo-100"
          iconBg="bg-indigo-50 text-indigo-600"
        >
          <Row label="一次給付金" highlight
            currentNode={<NumInput value={p.ltcCurrentLumpSum} onChange={v => set('ltcCurrentLumpSum', v)} suffix="萬" isZero />}
            proposedNode={<NumInput value={p.ltcProposedLumpSum} onChange={v => set('ltcProposedLumpSum', v)} suffix="萬" isProposed />}
            status={p.ltcCurrentLumpSum === 0 ? 'danger' : 'good'}
          />
          <Row label="每月給付額" highlight note="失能扶助金，最長給付至終身"
            currentNode={<NumInput value={p.ltcCurrentMonthly} onChange={v => set('ltcCurrentMonthly', v)} prefix="NT$" suffix="/ 月" isZero />}
            proposedNode={<NumInput value={p.ltcProposedMonthly} onChange={v => set('ltcProposedMonthly', v)} prefix="NT$" suffix="/ 月" isProposed />}
            status={p.ltcCurrentMonthly === 0 ? 'danger' : 'good'}
          />
        </SectionCard>

        {/* 總保費 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700 mb-4">年繳總保費（手動填入）</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '現有方案總保費', key: 'totalCurrentPremium' as const, isProposed: false },
              { label: '建議方案總保費', key: 'totalProposedPremium' as const, isProposed: true },
            ].map(f => (
              <div key={f.key} className={cn('rounded-xl p-4 border', f.isProposed ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100')}>
                <p className={cn('text-xs font-semibold mb-2', f.isProposed ? 'text-blue-500' : 'text-slate-400')}>{f.label}</p>
                <NumInput
                  value={p[f.key]}
                  onChange={v => set(f.key, v)}
                  prefix="NT$"
                  isProposed={f.isProposed}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <OptimizationSummary policy={p} client={client} />

        <footer className="text-center text-xs text-slate-400 pt-4 pb-8">
          本工具僅供規劃參考，實際保障內容以各保單條款為準。
        </footer>
      </main>
    </div>
  )
}
