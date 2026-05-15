import React, { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Shield, AlertTriangle, Heart, Activity, TrendingUp, Star,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle,
  Flame, User, Calendar, Briefcase, BadgeAlert, BarChart3,
  FileText, X, Zap, PieChart, Minus
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
  currentRealDaily: number
  currentFixedDaily: number
  currentRealSurgery: number
  currentRealOutpatient: number
  currentRealMisc: number
  currentFixedSurgery: number
  proposedRealDaily: number
  proposedFixedDaily: number
  proposedRealSurgery: number
  proposedRealOutpatient: number
  proposedRealMisc: number
  proposedFixedSurgery: number
}

interface PolicyData {
  lifeCurrentAmount: number
  lifeProposedAmount: number
  lifeCurrentPremium: number
  lifeProposedPremium: number
  accidentCurrentDeath: number
  accidentProposedDeath: number
  accidentCurrentDaily: number
  accidentProposedDaily: number
  accidentCurrentMisc: number
  accidentProposedMisc: number
  medical: MedicalData
  criticalType: 'critical_illness' | 'serious_injury'
  criticalCurrentAmount: number
  criticalProposedAmount: number
  criticalCurrentPremium: number
  criticalProposedPremium: number
  cancerCurrentLumpSum: number
  cancerProposedLumpSum: number
  cancerCurrentDaily: number
  cancerProposedDaily: number
  cancerCurrentSurgery: number
  cancerProposedSurgery: number
  cancerCurrentChemo: number
  cancerProposedChemo: number
  ltcCurrentLumpSum: number
  ltcProposedLumpSum: number
  ltcCurrentMonthly: number
  ltcProposedMonthly: number
  totalCurrentPremium: number
  totalProposedPremium: number
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initClient: ClientInfo = {
  name: '王小明', birthdate: '1985-03-15', gender: 'male', jobLevel: '1',
}

const initPolicy: PolicyData = {
  lifeCurrentAmount: 300, lifeProposedAmount: 800,
  lifeCurrentPremium: 18000, lifeProposedPremium: 32000,
  accidentCurrentDeath: 200, accidentProposedDeath: 500,
  accidentCurrentDaily: 500, accidentProposedDaily: 1500,
  accidentCurrentMisc: 0, accidentProposedMisc: 300000,
  medical: {
    currentRealDaily: 1000, currentFixedDaily: 1500,
    currentRealSurgery: 30000, currentRealOutpatient: 0,
    currentRealMisc: 100000, currentFixedSurgery: 20000,
    proposedRealDaily: 2000, proposedFixedDaily: 2500,
    proposedRealSurgery: 100000, proposedRealOutpatient: 50000,
    proposedRealMisc: 300000, proposedFixedSurgery: 50000,
  },
  criticalType: 'critical_illness',
  criticalCurrentAmount: 100, criticalProposedAmount: 200,
  criticalCurrentPremium: 12000, criticalProposedPremium: 22000,
  cancerCurrentLumpSum: 30, cancerProposedLumpSum: 100,
  cancerCurrentDaily: 2000, cancerProposedDaily: 3000,
  cancerCurrentSurgery: 50000, cancerProposedSurgery: 150000,
  cancerCurrentChemo: 10000, cancerProposedChemo: 30000,
  ltcCurrentLumpSum: 0, ltcProposedLumpSum: 100,
  ltcCurrentMonthly: 0, ltcProposedMonthly: 30000,
  totalCurrentPremium: 42000, totalProposedPremium: 86000,
}

// ─── Helper: 增幅文字 ─────────────────────────────────────────────────────────

function calcChange(cur: number, prop: number): string {
  if (prop <= 0) return '維持原保單額度'
  if (cur <= 0) return '【新增保障】'
  const pct = Math.round(((prop - cur) / cur) * 100)
  if (pct === 0) return '維持現狀'
  if (pct > 0) return `提升 ${pct}%`
  return `調整 ${Math.abs(pct)}%`
}

// ─── Num Input ────────────────────────────────────────────────────────────────

interface NumInputProps {
  value: number
  onChange: (v: number) => void
  suffix?: string
  isProposed?: boolean
  allowZero?: boolean
}

function NumInput({ value, onChange, suffix, isProposed, allowZero }: NumInputProps) {
  const isEmpty = !allowZero && value === 0
  return (
    <div className="flex items-center gap-1.5 w-full">
      <input
        type="number"
        value={isEmpty ? '' : value}
        placeholder={isEmpty ? '未投保' : '0'}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className={cn(
          'w-full rounded-lg px-3 py-2.5 text-right text-base',
          'bg-slate-100 border-2 border-transparent',
          'focus:outline-none focus:border-blue-400 focus:bg-white',
          'transition-all duration-150',
          'font-black',   // 最粗字重
          isEmpty
            ? 'text-red-500 placeholder:text-red-400 placeholder:font-medium'
            : isProposed
              ? 'text-blue-700'
              : 'text-black',
        )}
        style={{ color: isEmpty ? undefined : isProposed ? '#1d4ed8' : '#000000' }}
      />
      {suffix && (
        <span className={cn(
          'text-sm font-semibold shrink-0 min-w-[2.5rem]',
          isProposed ? 'text-blue-600' : 'text-slate-700'
        )}>
          {suffix}
        </span>
      )}
    </div>
  )
}

// ─── Status Pill (智能判斷) ───────────────────────────────────────────────────

type Status = 'good' | 'warning' | 'danger' | 'adjusted' | 'maintained'

function SmartStatus({ cur, prop, dangerIfZero }: { cur: number; prop: number; dangerIfZero?: boolean }) {
  if (dangerIfZero && cur === 0 && prop === 0) {
    return <StatusPill status="danger" label="缺口風險" />
  }
  if (dangerIfZero && cur === 0 && prop > 0) {
    return <StatusPill status="warning" label="建議新增" />
  }
  if (prop > cur) return <StatusPill status="warning" label="強化提升" />
  if (prop === cur) return <StatusPill status="good" label="維持現狀" />
  if (prop < cur && prop > 0) return <StatusPill status="adjusted" label="額度調整" />
  return <StatusPill status="danger" label="缺口風險" />
}

function StatusPill({ status, label }: { status: Status; label: string }) {
  const cfg: Record<Status, { icon: React.ReactNode; cls: string }> = {
    good:       { icon: <CheckCircle size={13} />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning:    { icon: <AlertCircle size={13} />, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    danger:     { icon: <XCircle size={13} />,     cls: 'bg-red-50 text-red-600 border-red-200' },
    adjusted:   { icon: <Minus size={13} />,       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    maintained: { icon: <CheckCircle size={13} />, cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  }
  const c = cfg[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap', c.cls)}>
      {c.icon}{label}
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
  statusNode: React.ReactNode
}

function Row({ label, note, hotTag, alertTag, highlight, currentNode, proposedNode, statusNode }: RowProps) {
  return (
    <tr className={cn('border-b border-slate-100 last:border-0', highlight ? 'bg-blue-50/40' : 'hover:bg-slate-50/50')}>
      <td className="py-4 pl-5 pr-3 align-middle" style={{ width: '36%' }}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-start gap-1.5">
            {hotTag && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 text-[10px] font-bold border border-orange-200 shrink-0 mt-0.5">
                <Flame size={9} />最重要
              </span>
            )}
            {alertTag && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 shrink-0 mt-0.5">
                <BadgeAlert size={9} />保障極窄
              </span>
            )}
            <span className={cn('text-sm leading-snug', highlight ? 'font-black text-black' : 'font-bold text-slate-900')}>
              {label}
            </span>
          </div>
          {note && <p className="text-xs text-slate-500 leading-snug">{note}</p>}
        </div>
      </td>
      <td className="py-4 px-3 align-middle" style={{ width: '24%' }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">現有</span>
          {currentNode}
        </div>
      </td>
      <td className="py-4 px-3 align-middle" style={{ width: '24%' }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">建議</span>
          {proposedNode}
        </div>
      </td>
      <td className="py-4 pr-5 pl-2 align-middle" style={{ width: '16%' }}>
        {statusNode}
      </td>
    </tr>
  )
}

// ─── Summary Row ──────────────────────────────────────────────────────────────

function SummaryRow({ cur, prop }: { cur: number; prop: number }) {
  return (
    <tr>
      <td colSpan={4} className="px-5 py-3">
        <div className="rounded-xl bg-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">每日合計保障（實支＋定額）</p>
            <p className="text-[11px] text-slate-500 mt-0.5">實支日額 + 定額日額，即時聯動</p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">現有</p>
              <p className="text-xl font-black text-slate-200 font-mono">
                NT${cur.toLocaleString()}<span className="text-sm font-normal ml-1">/ 日</span>
              </p>
            </div>
            <div className="w-px h-8 bg-slate-600" />
            <div className="text-center">
              <p className="text-xs text-emerald-400 mb-1">建議</p>
              <p className="text-xl font-black text-emerald-400 font-mono">
                NT${prop.toLocaleString()}<span className="text-sm font-normal ml-1">/ 日</span>
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, subtitle, icon, accentColor, borderColor, iconBg, criticalAlert, children, defaultOpen = true
}: {
  title: string; subtitle: string; icon: React.ReactNode
  accentColor: string; borderColor: string; iconBg: string
  criticalAlert?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border overflow-hidden', borderColor)}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', iconBg)}>{icon}</div>
          <div className="text-left">
            <h2 className={cn('text-base font-black', accentColor)}>{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-slate-300">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>
      {criticalAlert && open && (
        <div className="mx-5 mb-2 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm font-black text-red-600">{criticalAlert}</p>
        </div>
      )}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 580 }}>
            <thead>
              <tr className="border-t border-b border-slate-100 bg-slate-50">
                <th className="py-2.5 pl-5 pr-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider" style={{ width: '36%' }}>保障項目</th>
                <th className="py-2.5 px-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider" style={{ width: '24%' }}>現有方案</th>
                <th className="py-2.5 px-3 text-left text-[11px] font-black text-blue-500 uppercase tracking-wider" style={{ width: '24%' }}>建議方案</th>
                <th className="py-2.5 pr-5 pl-2 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider" style={{ width: '16%' }}>狀態</th>
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Client Card ──────────────────────────────────────────────────────────────

function ClientCard({ client, onChange }: { client: ClientInfo; onChange: (c: ClientInfo) => void }) {
  const set = (k: keyof ClientInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...client, [k]: e.target.value })

  const fieldCls = [
    'w-full block box-border',
    'bg-slate-100 border-2 border-transparent rounded-xl',
    'px-4 py-3',
    'text-sm font-black text-black',
    'focus:outline-none focus:border-blue-400 focus:bg-white',
    'transition-all',
  ].join(' ')

  const labelCls = 'block text-xs font-black text-slate-600 mb-1.5'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 overflow-hidden">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><User size={18} /></div>
        <div>
          <h2 className="text-base font-black text-slate-900">客戶基本資料</h2>
          <p className="text-xs text-slate-400 mt-0.5">被保險人資訊</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="w-full min-w-0">
          <label className={labelCls}>
            <span className="inline-flex items-center gap-1"><User size={11} />客戶姓名</span>
          </label>
          <input value={client.name} onChange={set('name')} placeholder="王小明" className={fieldCls} />
        </div>
        <div className="w-full min-w-0">
          <label className={labelCls}>
            <span className="inline-flex items-center gap-1"><Calendar size={11} />出生年月日</span>
          </label>
          <input
            type="date" value={client.birthdate} onChange={set('birthdate')}
            className={fieldCls}
            style={{ boxSizing: 'border-box', maxWidth: '100%' }}
          />
        </div>
        <div className="w-full min-w-0">
          <label className={labelCls}>性別</label>
          <select value={client.gender} onChange={set('gender')} className={fieldCls}>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </div>
        <div className="w-full min-w-0">
          <label className={labelCls}>
            <span className="inline-flex items-center gap-1"><Briefcase size={11} />職業等級</span>
          </label>
          <select value={client.jobLevel} onChange={set('jobLevel')} className={fieldCls}>
            <option value="1">1 類（內勤 / 文職）</option>
            <option value="2">2 類（業務 / 輕勞動）</option>
            <option value="3">3 類（技術 / 輕機械）</option>
            <option value="4">4 類（重體力勞動）</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({ policy, client, onClose }: { policy: PolicyData; client: ClientInfo; onClose: () => void }) {
  const premiumDiff = policy.totalProposedPremium - policy.totalCurrentPremium
  const monthlyDiff = Math.round(premiumDiff / 12)

  const dailyCur  = policy.medical.currentRealDaily  + policy.medical.currentFixedDaily
  const dailyProp = policy.medical.proposedRealDaily + policy.medical.proposedFixedDaily

  // ── 新增保障清單（修正邏輯）────────────────────────────────────────────────
  const upgrades: { title: string; detail: string; estMonthly: number }[] = []

  if (policy.accidentCurrentMisc === 0 && policy.accidentProposedMisc > 0) {
    upgrades.push({
      title: '新增意外實支實付',
      detail: `雜費上限 NT$${(policy.accidentProposedMisc / 10000).toFixed(0)} 萬`,
      estMonthly: 800,
    })
  }
  if (policy.medical.currentRealOutpatient === 0 && policy.medical.proposedRealOutpatient > 0) {
    upgrades.push({
      title: '新增門診手術保障',
      detail: `NT$${(policy.medical.proposedRealOutpatient / 10000).toFixed(0)} 萬 / 次`,
      estMonthly: 500,
    })
  }
  // 長照：只有建議方案 > 0 才顯示
  if ((policy.ltcProposedLumpSum > 0 || policy.ltcProposedMonthly > 0) && policy.ltcCurrentMonthly === 0) {
    upgrades.push({
      title: '新增長照失能扶助',
      detail: policy.ltcProposedMonthly > 0
        ? `每月 NT$${policy.ltcProposedMonthly.toLocaleString()} 給付，最長至終身`
        : `一次金 NT$${policy.ltcProposedLumpSum} 萬`,
      estMonthly: Math.round(monthlyDiff * 0.25),
    })
  }
  if (policy.criticalType === 'critical_illness') {
    upgrades.push({
      title: '升級重大傷病險',
      detail: `從重大疾病(7項) 升級為重大傷病(逾22萬項)`,
      estMonthly: Math.round((policy.criticalProposedPremium - policy.criticalCurrentPremium) / 12),
    })
  }

  // ── 預算分配 ───────────────────────────────────────────────────────────────
  const totalUpgradeMonthly = upgrades.reduce((s, u) => s + u.estMonthly, 0)
  const baseMonthly = monthlyDiff - totalUpgradeMonthly

  // ── 核心論點 ──────────────────────────────────────────────────────────────
  const insights: string[] = []

  // 壽險（防止負數）
  if (policy.lifeProposedAmount > 0 && policy.lifeCurrentAmount > 0) {
    const lifePct = Math.round(((policy.lifeProposedAmount - policy.lifeCurrentAmount) / policy.lifeCurrentAmount) * 100)
    if (lifePct > 0) insights.push(`身故保障從 ${policy.lifeCurrentAmount} 萬提升至 ${policy.lifeProposedAmount} 萬，增幅 ${lifePct}%`)
    else if (lifePct === 0) insights.push(`身故保障維持 ${policy.lifeCurrentAmount} 萬不變`)
  } else if (policy.lifeProposedAmount > 0 && policy.lifeCurrentAmount === 0) {
    insights.push(`【新增壽險】身故保障 ${policy.lifeProposedAmount} 萬`)
  }

  // 醫療雜費
  const miscCur  = policy.medical.currentRealMisc / 10000
  const miscProp = policy.medical.proposedRealMisc / 10000
  if (miscProp > miscCur) {
    insights.push(`每年僅增加 NT$${premiumDiff.toLocaleString()} 預算，醫療雜費從 ${miscCur} 萬補足至 ${miscProp} 萬`)
  }

  // 住院日額
  if (dailyProp > dailyCur) {
    const dailyPct = Math.round(((dailyProp - dailyCur) / dailyCur) * 100)
    insights.push(`住院日額合計 NT$${dailyCur.toLocaleString()} → NT$${dailyProp.toLocaleString()}，提升 ${dailyPct}%`)
  } else if (dailyCur === 0 && dailyProp > 0) {
    insights.push(`【新增】住院日額每日 NT$${dailyProp.toLocaleString()}`)
  }

  // 癌症一次金
  const cancerChange = calcChange(policy.cancerCurrentLumpSum, policy.cancerProposedLumpSum)
  if (policy.cancerProposedLumpSum > 0) {
    insights.push(`癌症初次罹患一次金：${policy.cancerCurrentLumpSum} 萬 → ${policy.cancerProposedLumpSum} 萬（${cancerChange}）`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-2xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><FileText size={18} className="text-white" /></div>
            <div>
              <h2 className="text-lg font-black text-white">保障規劃比較分析報告</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {client.name || '客戶'} · {new Date().toLocaleDateString('zh-TW')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* 重大疾病警告 */}
          {policy.criticalType === 'critical_illness' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-300">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-red-700">⚠️ 舊型重大疾病僅保障 7 項，且定義嚴苛</p>
                <p className="text-sm text-red-600 mt-1 leading-relaxed">
                  現行重大疾病保單須達「末期狀態」才符合理賠定義，實際理賠率極低。
                  建議立即升級為「重大傷病險」，理賠標準與健保卡一致，逾 22 萬項自動涵蓋。
                </p>
              </div>
            </div>
          )}

          {/* 保費大數據 */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-5 py-3 flex items-center gap-2">
              <BarChart3 size={15} className="text-white" />
              <p className="text-sm font-black text-white">保費大數據對比</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-1 font-semibold">現有年繳</p>
                <p className="text-2xl font-black text-slate-800 font-mono">
                  {(policy.totalCurrentPremium / 10000).toFixed(1)}<span className="text-base font-semibold">萬</span>
                </p>
              </div>
              <div className="p-4 text-center bg-blue-50">
                <p className="text-xs text-blue-500 mb-1 font-semibold">建議年繳</p>
                <p className="text-2xl font-black text-blue-700 font-mono">
                  {(policy.totalProposedPremium / 10000).toFixed(1)}<span className="text-base font-semibold">萬</span>
                </p>
              </div>
              <div className={cn('p-4 text-center', premiumDiff >= 0 ? 'bg-orange-50' : 'bg-emerald-50')}>
                <p className="text-xs text-slate-500 mb-1 font-semibold">每月增加</p>
                <p className={cn('text-2xl font-black font-mono', premiumDiff >= 0 ? 'text-orange-600' : 'text-emerald-600')}>
                  {premiumDiff >= 0 ? '+' : ''}{monthlyDiff.toLocaleString()}
                  <span className="text-base font-semibold">元</span>
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 space-y-2.5">
              {[
                { label: '現有方案', val: policy.totalCurrentPremium, max: Math.max(policy.totalProposedPremium, policy.totalCurrentPremium), cls: 'bg-slate-400' },
                { label: '建議方案', val: policy.totalProposedPremium, max: Math.max(policy.totalProposedPremium, policy.totalCurrentPremium), cls: 'bg-blue-500' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-16 shrink-0">{b.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', b.cls)}
                      style={{ width: `${b.max > 0 ? (b.val / b.max) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-black text-black font-mono w-28 text-right">
                    NT${b.val.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 新增保障清單 */}
          {upgrades.length > 0 && (
            <div className="rounded-xl border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-600 px-5 py-3 flex items-center gap-2">
                <Zap size={15} className="text-white" />
                <p className="text-sm font-black text-white">新增 / 升級保障項目</p>
              </div>
              <div className="divide-y divide-slate-100">
                {upgrades.map((u, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">{u.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{u.detail}</p>
                    </div>
                    {u.estMonthly > 0 && (
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs text-emerald-600 font-bold">月均約</p>
                        <p className="text-base font-black text-emerald-700 font-mono">
                          +${u.estMonthly.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 預算分配建議 */}
          {premiumDiff > 0 && (
            <div className="rounded-xl border border-violet-200 overflow-hidden">
              <div className="bg-violet-600 px-5 py-3 flex items-center gap-2">
                <PieChart size={15} className="text-white" />
                <p className="text-sm font-black text-white">預算分配建議</p>
              </div>
              <div className="p-5 space-y-3">
                {upgrades.map((u, i) => {
                  const pct = premiumDiff > 0 ? Math.round((u.estMonthly * 12 / premiumDiff) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600 w-36 shrink-0">{u.title}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400 transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs font-black text-violet-700 w-12 text-right">{pct}%</span>
                    </div>
                  )
                })}
                {baseMonthly > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 w-36 shrink-0">既有保障強化</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-400 transition-all duration-500"
                        style={{ width: `${Math.min(Math.round((baseMonthly * 12 / premiumDiff) * 100), 100)}%` }} />
                    </div>
                    <span className="text-xs font-black text-slate-600 w-12 text-right">
                      {Math.round((baseMonthly * 12 / premiumDiff) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 核心價值主張 */}
          {insights.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-black text-blue-800 flex items-center gap-2 mb-3">
                <TrendingUp size={15} />核心規劃價值
              </p>
              <ul className="space-y-2.5">
                {insights.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold text-blue-900 leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            本報告依填寫數據自動產生，僅供規劃參考，以實際保單條款為準。
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [client, setClient] = useState<ClientInfo>(initClient)
  const [p, setP] = useState<PolicyData>(initPolicy)
  const [showModal, setShowModal] = useState(false)

  const set = useCallback(<K extends keyof PolicyData>(key: K, val: PolicyData[K]) =>
    setP(prev => ({ ...prev, [key]: val })), [])

  const setMed = useCallback(<K extends keyof MedicalData>(key: K, val: number) =>
    setP(prev => ({ ...prev, medical: { ...prev.medical, [key]: val } })), [])

  const dailyCur  = p.medical.currentRealDaily  + p.medical.currentFixedDaily
  const dailyProp = p.medical.proposedRealDaily + p.medical.proposedFixedDaily
  const monthlyDiff = Math.round((p.totalProposedPremium - p.totalCurrentPremium) / 12)

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Shield size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">保險規劃分析工具</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">互動填寫 · 即時分析</p>
            </div>
          </div>
          {client.name && (
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <User size={12} className="text-blue-500" />
              <span className="text-xs font-black text-blue-700">{client.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        <ClientCard client={client} onChange={setClient} />

        {/* 壽險 */}
        <SectionCard title="壽險" subtitle="身故保障" icon={<Shield size={18} />}
          accentColor="text-blue-700" borderColor="border-blue-100" iconBg="bg-blue-50 text-blue-600">
          <Row label="身故保障額度" note="建議提升至家庭年收入 10 倍以上"
            currentNode={<NumInput value={p.lifeCurrentAmount} onChange={v => set('lifeCurrentAmount', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.lifeProposedAmount} onChange={v => set('lifeProposedAmount', v)} suffix="萬" isProposed />}
            statusNode={<SmartStatus cur={p.lifeCurrentAmount} prop={p.lifeProposedAmount} />}
          />
          <Row label="年繳保費"
            currentNode={<NumInput value={p.lifeCurrentPremium} onChange={v => set('lifeCurrentPremium', v)} suffix="元" allowZero />}
            proposedNode={<NumInput value={p.lifeProposedPremium} onChange={v => set('lifeProposedPremium', v)} suffix="元" isProposed allowZero />}
            statusNode={<SmartStatus cur={p.lifeCurrentPremium} prop={p.lifeProposedPremium} />}
          />
        </SectionCard>

        {/* 意外險 */}
        <SectionCard title="意外險" subtitle="意外身故・住院・實支" icon={<AlertTriangle size={18} />}
          accentColor="text-orange-600" borderColor="border-orange-100" iconBg="bg-orange-50 text-orange-500">
          <Row label="意外身故"
            currentNode={<NumInput value={p.accidentCurrentDeath} onChange={v => set('accidentCurrentDeath', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.accidentProposedDeath} onChange={v => set('accidentProposedDeath', v)} suffix="萬" isProposed />}
            statusNode={<SmartStatus cur={p.accidentCurrentDeath} prop={p.accidentProposedDeath} />}
          />
          <Row label="意外住院日額"
            currentNode={<NumInput value={p.accidentCurrentDaily} onChange={v => set('accidentCurrentDaily', v)} suffix="元/日" />}
            proposedNode={<NumInput value={p.accidentProposedDaily} onChange={v => set('accidentProposedDaily', v)} suffix="元/日" isProposed />}
            statusNode={<SmartStatus cur={p.accidentCurrentDaily} prop={p.accidentProposedDaily} />}
          />
          <Row label="意外實支（雜費上限）" note="目前最大保障缺口，建議優先補足" highlight hotTag
            currentNode={<NumInput value={p.accidentCurrentMisc} onChange={v => set('accidentCurrentMisc', v)} suffix="元" />}
            proposedNode={<NumInput value={p.accidentProposedMisc} onChange={v => set('accidentProposedMisc', v)} suffix="元" isProposed />}
            statusNode={<SmartStatus cur={p.accidentCurrentMisc} prop={p.accidentProposedMisc} dangerIfZero />}
          />
        </SectionCard>

        {/* 醫療險 */}
        <SectionCard title="醫療險" subtitle="實支實付・定額給付" icon={<Activity size={18} />}
          accentColor="text-teal-700" borderColor="border-teal-100" iconBg="bg-teal-50 text-teal-600">
          <Row label="【實支】住院日額"
            currentNode={<NumInput value={p.medical.currentRealDaily} onChange={v => setMed('currentRealDaily', v)} suffix="元/日" />}
            proposedNode={<NumInput value={p.medical.proposedRealDaily} onChange={v => setMed('proposedRealDaily', v)} suffix="元/日" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentRealDaily} prop={p.medical.proposedRealDaily} />}
          />
          <Row label="【實支】住院手術"
            currentNode={<NumInput value={p.medical.currentRealSurgery} onChange={v => setMed('currentRealSurgery', v)} suffix="元/次" />}
            proposedNode={<NumInput value={p.medical.proposedRealSurgery} onChange={v => setMed('proposedRealSurgery', v)} suffix="元/次" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentRealSurgery} prop={p.medical.proposedRealSurgery} />}
          />
          <Row label="【實支】門診手術"
            currentNode={<NumInput value={p.medical.currentRealOutpatient} onChange={v => setMed('currentRealOutpatient', v)} suffix="元/次" />}
            proposedNode={<NumInput value={p.medical.proposedRealOutpatient} onChange={v => setMed('proposedRealOutpatient', v)} suffix="元/次" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentRealOutpatient} prop={p.medical.proposedRealOutpatient} dangerIfZero />}
          />
          <Row label="【實支】雜費上限" note="涵蓋自費醫材、達文西手術、新式藥物" highlight hotTag
            currentNode={<NumInput value={p.medical.currentRealMisc} onChange={v => setMed('currentRealMisc', v)} suffix="元" />}
            proposedNode={<NumInput value={p.medical.proposedRealMisc} onChange={v => setMed('proposedRealMisc', v)} suffix="元" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentRealMisc} prop={p.medical.proposedRealMisc} />}
          />
          <Row label="【定額】住院日額"
            currentNode={<NumInput value={p.medical.currentFixedDaily} onChange={v => setMed('currentFixedDaily', v)} suffix="元/日" />}
            proposedNode={<NumInput value={p.medical.proposedFixedDaily} onChange={v => setMed('proposedFixedDaily', v)} suffix="元/日" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentFixedDaily} prop={p.medical.proposedFixedDaily} />}
          />
          <Row label="【定額】住院手術"
            currentNode={<NumInput value={p.medical.currentFixedSurgery} onChange={v => setMed('currentFixedSurgery', v)} suffix="元/次" />}
            proposedNode={<NumInput value={p.medical.proposedFixedSurgery} onChange={v => setMed('proposedFixedSurgery', v)} suffix="元/次" isProposed />}
            statusNode={<SmartStatus cur={p.medical.currentFixedSurgery} prop={p.medical.proposedFixedSurgery} />}
          />
          <SummaryRow cur={dailyCur} prop={dailyProp} />
        </SectionCard>

        {/* 重大傷病險 */}
        <SectionCard title="重大傷病險" subtitle="重大疾病 / 重大傷病" icon={<Heart size={18} />}
          accentColor="text-rose-600" borderColor="border-rose-100" iconBg="bg-rose-50 text-rose-600"
          criticalAlert={p.criticalType === 'critical_illness' ? '現有保單為「重大疾病(7項)」— 保障範圍極窄，需立即優化！' : undefined}>
          <tr className="border-b border-slate-100 bg-rose-50/30">
            <td className="py-4 pl-5 pr-3 align-middle">
              <span className="text-sm font-black text-slate-900">現有保障類型</span>
            </td>
            <td colSpan={2} className="py-4 px-3 align-middle">
              <div className="flex gap-2 flex-wrap">
                {([
                  { val: 'critical_illness', label: '重大疾病（7項）' },
                  { val: 'serious_injury',   label: '重大傷病（新制）' },
                ] as const).map(opt => (
                  <button key={opt.val} onClick={() => set('criticalType', opt.val)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-black border-2 transition-all',
                      p.criticalType === opt.val
                        ? opt.val === 'critical_illness'
                          ? 'bg-red-600 text-white border-red-600 shadow'
                          : 'bg-teal-600 text-white border-teal-600 shadow'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </td>
            <td className="py-4 pr-5 pl-2 align-middle">
              {p.criticalType === 'critical_illness'
                ? <StatusPill status="danger" label="保障範圍極窄" />
                : <StatusPill status="good" label="符合新制" />}
            </td>
          </tr>
          <Row label="一次給付額度" highlight
            alertTag={p.criticalType === 'critical_illness'}
            note={p.criticalType === 'critical_illness' ? '重大疾病7項定義嚴苛，達末期才理賠' : undefined}
            currentNode={<NumInput value={p.criticalCurrentAmount} onChange={v => set('criticalCurrentAmount', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.criticalProposedAmount} onChange={v => set('criticalProposedAmount', v)} suffix="萬" isProposed />}
            statusNode={<SmartStatus cur={p.criticalCurrentAmount} prop={p.criticalProposedAmount} />}
          />
          <Row label="年繳保費"
            currentNode={<NumInput value={p.criticalCurrentPremium} onChange={v => set('criticalCurrentPremium', v)} suffix="元" allowZero />}
            proposedNode={<NumInput value={p.criticalProposedPremium} onChange={v => set('criticalProposedPremium', v)} suffix="元" isProposed allowZero />}
            statusNode={<SmartStatus cur={p.criticalCurrentPremium} prop={p.criticalProposedPremium} />}
          />
        </SectionCard>

        {/* 癌症險 */}
        <SectionCard title="癌症險" subtitle="一次金・住院・化放療" icon={<TrendingUp size={18} />}
          accentColor="text-violet-700" borderColor="border-violet-100" iconBg="bg-violet-50 text-violet-600">
          <Row label="初次罹癌一次金" highlight
            currentNode={<NumInput value={p.cancerCurrentLumpSum} onChange={v => set('cancerCurrentLumpSum', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.cancerProposedLumpSum} onChange={v => set('cancerProposedLumpSum', v)} suffix="萬" isProposed />}
            statusNode={<SmartStatus cur={p.cancerCurrentLumpSum} prop={p.cancerProposedLumpSum} />}
          />
          <Row label="住院日額"
            currentNode={<NumInput value={p.cancerCurrentDaily} onChange={v => set('cancerCurrentDaily', v)} suffix="元/日" />}
            proposedNode={<NumInput value={p.cancerProposedDaily} onChange={v => set('cancerProposedDaily', v)} suffix="元/日" isProposed />}
            statusNode={<SmartStatus cur={p.cancerCurrentDaily} prop={p.cancerProposedDaily} />}
          />
          <Row label="住院手術"
            currentNode={<NumInput value={p.cancerCurrentSurgery} onChange={v => set('cancerCurrentSurgery', v)} suffix="元/次" />}
            proposedNode={<NumInput value={p.cancerProposedSurgery} onChange={v => set('cancerProposedSurgery', v)} suffix="元/次" isProposed />}
            statusNode={<SmartStatus cur={p.cancerCurrentSurgery} prop={p.cancerProposedSurgery} />}
          />
          <Row label="化療／放療補助" note="含標靶治療、免疫療法"
            currentNode={<NumInput value={p.cancerCurrentChemo} onChange={v => set('cancerCurrentChemo', v)} suffix="元/次" />}
            proposedNode={<NumInput value={p.cancerProposedChemo} onChange={v => set('cancerProposedChemo', v)} suffix="元/次" isProposed />}
            statusNode={<SmartStatus cur={p.cancerCurrentChemo} prop={p.cancerProposedChemo} />}
          />
        </SectionCard>

        {/* 長照險 */}
        <SectionCard title="長照險" subtitle="失能扶助・長期照護" icon={<Star size={18} />}
          accentColor="text-indigo-700" borderColor="border-indigo-100" iconBg="bg-indigo-50 text-indigo-600">
          <Row label="一次給付金" highlight
            currentNode={<NumInput value={p.ltcCurrentLumpSum} onChange={v => set('ltcCurrentLumpSum', v)} suffix="萬" />}
            proposedNode={<NumInput value={p.ltcProposedLumpSum} onChange={v => set('ltcProposedLumpSum', v)} suffix="萬" isProposed />}
            statusNode={<SmartStatus cur={p.ltcCurrentLumpSum} prop={p.ltcProposedLumpSum} dangerIfZero />}
          />
          <Row label="每月給付額" highlight note="最長給付至終身"
            currentNode={<NumInput value={p.ltcCurrentMonthly} onChange={v => set('ltcCurrentMonthly', v)} suffix="元/月" />}
            proposedNode={<NumInput value={p.ltcProposedMonthly} onChange={v => set('ltcProposedMonthly', v)} suffix="元/月" isProposed />}
            statusNode={<SmartStatus cur={p.ltcCurrentMonthly} prop={p.ltcProposedMonthly} dangerIfZero />}
          />
        </SectionCard>

        {/* 總保費 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <p className="text-sm font-black text-slate-900 mb-4">年繳總保費（手動填入）</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '現有方案總保費', key: 'totalCurrentPremium' as const, isProposed: false },
              { label: '建議方案總保費', key: 'totalProposedPremium' as const, isProposed: true },
            ].map(f => (
              <div key={f.key} className={cn('rounded-xl p-4 border-2', f.isProposed ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200')}>
                <p className={cn('text-xs font-black mb-2', f.isProposed ? 'text-blue-600' : 'text-slate-600')}>{f.label}</p>
                <NumInput value={p[f.key]} onChange={v => set(f.key, v)} suffix="元" isProposed={f.isProposed} allowZero />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-sm text-slate-600 font-bold">每月增加負擔</span>
            <span className={cn('text-2xl font-black font-mono', monthlyDiff >= 0 ? 'text-orange-600' : 'text-emerald-600')}
              style={{ color: monthlyDiff >= 0 ? '#ea580c' : '#059669' }}>
              {monthlyDiff >= 0 ? '+' : ''}NT${monthlyDiff.toLocaleString()}
            </span>
            <span className="text-sm text-slate-600 font-bold">元 / 月</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-lg shadow-lg shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <FileText size={22} />
          產出比較分析報告
        </button>

        <p className="text-center text-xs text-slate-400 pb-8">本工具僅供規劃參考，以實際保單條款為準。</p>
      </main>

      {showModal && <ReportModal policy={p} client={client} onClose={() => setShowModal(false)} />}
    </div>
  )
}
