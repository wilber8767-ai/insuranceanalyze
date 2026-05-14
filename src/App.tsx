import React, { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Shield, AlertTriangle, Heart, Activity, TrendingUp, Star,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, XCircle,
  Flame, ArrowUpRight, BadgeAlert
} from 'lucide-react'

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs))

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'good' | 'warning' | 'danger' | 'new'

interface PolicyItem {
  label: string
  current: string
  proposed: string
  status: Status
  highlight?: boolean
  hotTag?: boolean       // 🔥 最重要
  alertTag?: boolean     // 紅色警告
  note?: string
  isSummary?: boolean    // 合計列
}

interface Section {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  accentColor: string
  borderColor: string
  iconBg: string
  items: PolicyItem[]
  criticalAlert?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: 'life',
    title: '壽險',
    subtitle: '身故保障',
    icon: <Shield size={18} />,
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    iconBg: 'bg-blue-50 text-blue-600',
    items: [
      {
        label: '身故保障額度',
        current: 'NT$300 萬',
        proposed: 'NT$800 萬',
        status: 'warning',
        note: '建議提升至家庭年收入 10 倍以上'
      },
      {
        label: '年繳保費',
        current: 'NT$18,000',
        proposed: 'NT$32,000',
        status: 'good',
      },
    ],
  },
  {
    id: 'accident',
    title: '意外險',
    subtitle: '意外身故・住院・實支',
    icon: <AlertTriangle size={18} />,
    accentColor: 'text-orange-500',
    borderColor: 'border-orange-100',
    iconBg: 'bg-orange-50 text-orange-500',
    items: [
      {
        label: '意外身故',
        current: 'NT$200 萬',
        proposed: 'NT$500 萬',
        status: 'warning',
      },
      {
        label: '意外住院日額',
        current: 'NT$500 / 日',
        proposed: 'NT$1,500 / 日',
        status: 'warning',
      },
      {
        label: '意外實支實付（雜費上限）',
        current: '未投保',
        proposed: 'NT$30 萬 / 次',
        status: 'danger',
        highlight: true,
        hotTag: true,
        note: '目前最大保障缺口，強烈建議優先補足'
      },
    ],
  },
  {
    id: 'medical',
    title: '醫療險',
    subtitle: '實支實付・定額給付',
    icon: <Activity size={18} />,
    accentColor: 'text-teal-600',
    borderColor: 'border-teal-100',
    iconBg: 'bg-teal-50 text-teal-600',
    items: [
      {
        label: '【實支】住院日額',
        current: 'NT$1,000 / 日',
        proposed: 'NT$2,000 / 日',
        status: 'warning',
      },
      {
        label: '【實支】住院手術',
        current: 'NT$30,000 / 次',
        proposed: 'NT$100,000 / 次',
        status: 'warning',
      },
      {
        label: '【實支】門診手術',
        current: '未投保',
        proposed: 'NT$50,000 / 次',
        status: 'danger',
      },
      {
        label: '【實支】雜費上限',
        current: 'NT$10 萬',
        proposed: 'NT$30 萬',
        status: 'warning',
        highlight: true,
        hotTag: true,
        note: '涵蓋自費醫材、新式藥物、達文西手術費等'
      },
      {
        label: '【定額】住院日額',
        current: 'NT$1,500 / 日',
        proposed: 'NT$2,500 / 日',
        status: 'warning',
      },
      {
        label: '【定額】住院手術',
        current: 'NT$20,000 / 次',
        proposed: 'NT$50,000 / 次',
        status: 'warning',
      },
      {
        label: '每日合計保障金額（實支＋定額）',
        current: 'NT$2,500 / 日',
        proposed: 'NT$4,500 / 日',
        status: 'good',
        isSummary: true,
        note: '自動加總：實支日額 + 定額日額'
      },
    ],
  },
  {
    id: 'critical',
    title: '重大傷病險',
    subtitle: '重大疾病・重大傷病',
    icon: <Heart size={18} />,
    accentColor: 'text-rose-600',
    borderColor: 'border-rose-100',
    iconBg: 'bg-rose-50 text-rose-600',
    criticalAlert: '現有保單為「重大疾病(7項)」— 保障範圍極窄，需立即優化！',
    items: [
      {
        label: '保障範圍',
        current: '重大疾病 7 項',
        proposed: '重大傷病（逾22萬項）',
        status: 'danger',
        highlight: true,
        alertTag: true,
        note: '7項重大疾病 vs 健保重大傷病卡制度，差距天壤之別'
      },
      {
        label: '一次給付額度',
        current: 'NT$100 萬',
        proposed: 'NT$200 萬',
        status: 'warning',
      },
      {
        label: '年繳保費',
        current: 'NT$12,000',
        proposed: 'NT$22,000',
        status: 'good',
      },
    ],
  },
  {
    id: 'cancer',
    title: '癌症險',
    subtitle: '一次金・住院・化放療',
    icon: <TrendingUp size={18} />,
    accentColor: 'text-violet-600',
    borderColor: 'border-violet-100',
    iconBg: 'bg-violet-50 text-violet-600',
    items: [
      {
        label: '初次罹癌一次金',
        current: 'NT$30 萬',
        proposed: 'NT$100 萬',
        status: 'warning',
        highlight: true,
      },
      {
        label: '住院日額',
        current: 'NT$2,000 / 日',
        proposed: 'NT$3,000 / 日',
        status: 'good',
      },
      {
        label: '住院手術',
        current: 'NT$50,000 / 次',
        proposed: 'NT$150,000 / 次',
        status: 'warning',
      },
      {
        label: '化療／放療補助',
        current: 'NT$10,000 / 次',
        proposed: 'NT$30,000 / 次',
        status: 'warning',
        note: '含標靶治療、免疫療法補助'
      },
    ],
  },
  {
    id: 'ltc',
    title: '長照險',
    subtitle: '失能扶助・長期照護',
    icon: <Star size={18} />,
    accentColor: 'text-indigo-600',
    borderColor: 'border-indigo-100',
    iconBg: 'bg-indigo-50 text-indigo-600',
    items: [
      {
        label: '一次給付金',
        current: '未投保',
        proposed: 'NT$100 萬',
        status: 'danger',
        highlight: true,
      },
      {
        label: '每月給付額',
        current: '未投保',
        proposed: 'NT$30,000 / 月',
        status: 'danger',
        highlight: true,
        note: '失能扶助金，最長給付至終身'
      },
    ],
  },
]

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
  good:    { label: '保障完善', icon: <CheckCircle size={12} />, cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  warning: { label: '建議提升', icon: <AlertCircle size={12} />, cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  danger:  { label: '缺口風險', icon: <XCircle size={12} />,    cls: 'bg-red-50 text-red-600 border border-red-200' },
  new:     { label: '新增保障', icon: <ArrowUpRight size={12} />, cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const cfg = statusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
      cfg.cls
    )}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function SummaryCard({ item }: { item: PolicyItem }) {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-3">
        <div className="rounded-xl bg-slate-800 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5 font-medium uppercase tracking-wide">每日合計保障金額（實支＋定額）</p>
            <p className="text-[11px] text-slate-500">{item.note}</p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">現有方案</p>
              <p className="text-lg font-bold text-slate-300 font-mono">{item.current}</p>
            </div>
            <div className="w-px h-8 bg-slate-600" />
            <div className="text-center">
              <p className="text-xs text-emerald-400 mb-1">建議方案</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">{item.proposed}</p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

function ItemRow({ item }: { item: PolicyItem }) {
  if (item.isSummary) return <SummaryCard item={item} />

  return (
    <tr className={cn(
      'border-b border-slate-100 last:border-0 transition-colors group',
      item.highlight ? 'bg-blue-50/40' : 'hover:bg-slate-50'
    )}>
      {/* Label */}
      <td className="py-4 pl-6 pr-3 align-top w-[42%]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            {item.hotTag && (
              <span className="inline-flex items-center gap-0.5 shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-600 text-[10px] font-bold border border-orange-200">
                <Flame size={9} />最重要
              </span>
            )}
            {item.alertTag && (
              <span className="inline-flex items-center gap-0.5 shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold border border-red-200">
                <BadgeAlert size={9} />保障範圍極窄
              </span>
            )}
            <span className={cn(
              'text-sm leading-snug',
              item.highlight ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'
            )}>
              {item.label}
            </span>
          </div>
          {item.note && (
            <p className="text-xs text-slate-400 leading-snug pl-0.5">{item.note}</p>
          )}
        </div>
      </td>

      {/* Current */}
      <td className="py-4 px-3 align-middle w-[22%]">
        <span className={cn(
          'text-sm font-mono',
          item.current === '未投保' ? 'text-red-400 font-medium' : 'text-slate-400'
        )}>
          {item.current}
        </span>
      </td>

      {/* Proposed */}
      <td className="py-4 px-3 align-middle w-[22%]">
        <span className="text-sm font-mono font-bold text-blue-600">
          {item.proposed}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 pr-6 pl-2 align-middle w-[14%]">
        <StatusPill status={item.status} />
      </td>
    </tr>
  )
}

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-200',
      section.borderColor
    )}>
      {/* Card Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn('p-2.5 rounded-xl', section.iconBg)}>
            {section.icon}
          </div>
          <div className="text-left">
            <h2 className={cn('text-base font-bold', section.accentColor)}>
              {section.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{section.subtitle}</p>
          </div>
        </div>
        <span className="text-slate-300">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Critical Alert */}
      {section.criticalAlert && open && (
        <div className="mx-6 mb-1 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-600">{section.criticalAlert}</p>
        </div>
      )}

      {/* Table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="border-t border-b border-slate-100 bg-slate-50/70">
                <th className="py-2.5 pl-6 pr-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  保障項目
                </th>
                <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  現有方案
                </th>
                <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-blue-500 uppercase tracking-wider">
                  建議方案
                </th>
                <th className="py-2.5 pr-6 pl-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  狀態
                </th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, i) => (
                <ItemRow key={i} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '4', label: '保障缺口', sub: '需立即補足', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    { value: '9', label: '建議提升', sub: '優化空間大', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { value: '3', label: '保障完善', sub: '維持現狀', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { value: '+78%', label: '保費增幅', sub: '保障翻倍成長', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map((s, i) => (
        <div key={i} className={cn(
          'rounded-2xl border p-5 flex flex-col gap-1',
          s.bg, s.border
        )}>
          <span className={cn('text-3xl font-bold font-mono tracking-tight', s.color)}>
            {s.value}
          </span>
          <span className="text-sm font-semibold text-slate-700">{s.label}</span>
          <span className="text-xs text-slate-400">{s.sub}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {Object.values(statusConfig).map((cfg, i) => (
        <span key={i} className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
          cfg.cls
        )}>
          {cfg.icon}{cfg.label}
        </span>
      ))}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>

      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">
                保險規劃分析報告
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">六大險種保障缺口全面檢視</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500 font-medium">2025 / 06 / 01</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero intro */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
            保障分析摘要
          </p>
          <p className="text-sm leading-relaxed text-blue-100">
            以下報告比對您的現有保單與建議方案。
            <span className="text-white font-semibold">藍色粗體</span>為建議方案金額，
            <span className="text-blue-300">灰色</span>為現有方案。
            標有 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-400/30 text-orange-200 text-[11px] font-bold border border-orange-400/30"><Flame size={9} />最重要</span> 的項目請優先檢視。
          </p>
        </div>

        <StatsBar />
        <Legend />

        {/* Section Cards */}
        <div className="space-y-4">
          {sections.map(s => (
            <SectionCard key={s.id} section={s} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-400 border-t border-slate-200 pt-6">
          本報告僅供規劃參考，實際保障內容以各保單條款為準。建議諮詢合格保險顧問後再行投保。
        </footer>
      </main>
    </div>
  )
}
