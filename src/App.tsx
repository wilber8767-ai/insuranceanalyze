import React, { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Shield, AlertTriangle, TrendingUp, Heart, Activity,
  ChevronDown, ChevronUp, Star, ArrowRight, Info, CheckCircle, XCircle
} from 'lucide-react'

const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs))

// ─── Types ───────────────────────────────────────────────────────────────────

type CoverageStatus = 'good' | 'warning' | 'danger' | 'new'

interface PolicyItem {
  label: string
  current: string
  proposed: string
  status: CoverageStatus
  highlight?: boolean
  note?: string
}

interface InsuranceSection {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  items: PolicyItem[]
  alert?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockData: InsuranceSection[] = [
  {
    id: 'life',
    title: '壽險',
    icon: <Shield size={20} />,
    color: 'blue',
    items: [
      {
        label: '身故保障額度',
        current: '300 萬',
        proposed: '800 萬',
        status: 'warning',
        note: '建議提升至家庭年收入 10 倍'
      },
      {
        label: '保費',
        current: 'NT$18,000 / 年',
        proposed: 'NT$32,000 / 年',
        status: 'good',
      },
    ],
  },
  {
    id: 'accident',
    title: '意外險',
    icon: <AlertTriangle size={20} />,
    color: 'amber',
    items: [
      {
        label: '意外身故',
        current: '200 萬',
        proposed: '500 萬',
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
        current: '無',
        proposed: 'NT$30 萬 / 次',
        status: 'danger',
        highlight: true,
        note: '⚡ 重點保障，目前缺口最大'
      },
    ],
  },
  {
    id: 'medical',
    title: '醫療險',
    icon: <Activity size={20} />,
    color: 'teal',
    items: [
      {
        label: '【實支】住院日額',
        current: 'NT$1,000 / 日',
        proposed: 'NT$2,000 / 日',
        status: 'warning',
      },
      {
        label: '【實支】住院手術',
        current: 'NT$3 萬 / 次',
        proposed: 'NT$10 萬 / 次',
        status: 'warning',
      },
      {
        label: '【實支】門診手術',
        current: '無',
        proposed: 'NT$5 萬 / 次',
        status: 'danger',
        highlight: false,
      },
      {
        label: '【實支】雜費上限',
        current: 'NT$10 萬',
        proposed: 'NT$30 萬',
        status: 'warning',
        highlight: true,
        note: '🔑 最重點項目：涵蓋自費醫材、藥費'
      },
      {
        label: '【定額】住院日額',
        current: 'NT$1,500 / 日',
        proposed: 'NT$2,500 / 日',
        status: 'warning',
      },
      {
        label: '【定額】住院手術',
        current: 'NT$2 萬 / 次',
        proposed: 'NT$5 萬 / 次',
        status: 'warning',
      },
      {
        label: '▶ 合計住院日額（實支＋定額）',
        current: 'NT$2,500 / 日',
        proposed: 'NT$4,500 / 日',
        status: 'good',
        highlight: true,
        note: '自動加總：實支日額＋定額日額'
      },
    ],
  },
  {
    id: 'critical',
    title: '重大傷病險',
    icon: <Heart size={20} />,
    color: 'rose',
    alert: '⚠️ 舊保單為「重大疾病(7項)」— 保障範圍落後，需立即優化！',
    items: [
      {
        label: '保障範圍',
        current: '重大疾病 7 項',
        proposed: '重大傷病 22 萬＋項',
        status: 'danger',
        highlight: true,
        note: '重大疾病(7項) vs 重大傷病卡制度，差距極大'
      },
      {
        label: '一次給付額度',
        current: '100 萬',
        proposed: '200 萬',
        status: 'warning',
      },
      {
        label: '保費',
        current: 'NT$12,000 / 年',
        proposed: 'NT$22,000 / 年',
        status: 'good',
      },
    ],
  },
  {
    id: 'cancer',
    title: '癌症險',
    icon: <TrendingUp size={20} />,
    color: 'purple',
    items: [
      {
        label: '初次罹癌一次金',
        current: '30 萬',
        proposed: '100 萬',
        status: 'warning',
      },
      {
        label: '住院日額',
        current: 'NT$2,000 / 日',
        proposed: 'NT$3,000 / 日',
        status: 'good',
      },
      {
        label: '住院手術',
        current: 'NT$5 萬 / 次',
        proposed: 'NT$15 萬 / 次',
        status: 'warning',
      },
      {
        label: '化療／放療補助',
        current: 'NT$1 萬 / 次',
        proposed: 'NT$3 萬 / 次',
        status: 'warning',
        note: '含標靶治療補助'
      },
    ],
  },
  {
    id: 'ltc',
    title: '長照險',
    icon: <Star size={20} />,
    color: 'indigo',
    items: [
      {
        label: '一次給付金',
        current: '無',
        proposed: '100 萬',
        status: 'danger',
        highlight: true,
      },
      {
        label: '每月給付額',
        current: '無',
        proposed: 'NT$3 萬 / 月',
        status: 'danger',
        highlight: true,
        note: '失能扶助金：最長給付至終身'
      },
    ],
  },
]

// ─── Color Maps ───────────────────────────────────────────────────────────────

const colorMap = {
  blue:   { bg: 'bg-blue-950', border: 'border-blue-700', text: 'text-blue-300', badge: 'bg-blue-900 text-blue-200', icon: 'text-blue-400' },
  amber:  { bg: 'bg-amber-950', border: 'border-amber-700', text: 'text-amber-300', badge: 'bg-amber-900 text-amber-200', icon: 'text-amber-400' },
  teal:   { bg: 'bg-teal-950', border: 'border-teal-700', text: 'text-teal-300', badge: 'bg-teal-900 text-teal-200', icon: 'text-teal-400' },
  rose:   { bg: 'bg-rose-950', border: 'border-rose-700', text: 'text-rose-300', badge: 'bg-rose-900 text-rose-200', icon: 'text-rose-400' },
  purple: { bg: 'bg-purple-950', border: 'border-purple-700', text: 'text-purple-300', badge: 'bg-purple-900 text-purple-200', icon: 'text-purple-400' },
  indigo: { bg: 'bg-indigo-950', border: 'border-indigo-700', text: 'text-indigo-300', badge: 'bg-indigo-900 text-indigo-200', icon: 'text-indigo-400' },
}

const statusConfig = {
  good:    { icon: <CheckCircle size={14} />, label: '已覆蓋', cls: 'text-emerald-400 bg-emerald-950 border border-emerald-800' },
  warning: { icon: <Info size={14} />,        label: '建議提升', cls: 'text-amber-400 bg-amber-950 border border-amber-800' },
  danger:  { icon: <XCircle size={14} />,     label: '缺口風險', cls: 'text-rose-400 bg-rose-950 border border-rose-800' },
  new:     { icon: <ArrowRight size={14} />,  label: '新增保障', cls: 'text-sky-400 bg-sky-950 border border-sky-800' },
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CoverageStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.cls)}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function ComparisonRow({ item }: { item: PolicyItem }) {
  return (
    <tr className={cn(
      'border-b border-slate-800 transition-colors',
      item.highlight ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
    )}>
      <td className="py-3 pl-4 pr-2 align-top">
        <div className="flex flex-col gap-1">
          <span className={cn(
            'text-sm font-medium',
            item.highlight ? 'text-white' : 'text-slate-300'
          )}>
            {item.label}
            {item.highlight && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" />
            )}
          </span>
          {item.note && (
            <span className="text-xs text-slate-500 leading-snug">{item.note}</span>
          )}
        </div>
      </td>
      <td className="py-3 px-3 align-middle">
        <span className={cn(
          'font-mono text-sm px-2 py-1 rounded',
          item.current === '無'
            ? 'text-slate-500 bg-slate-800'
            : 'text-slate-300 bg-slate-800'
        )}>
          {item.current}
        </span>
      </td>
      <td className="py-3 px-3 align-middle">
        <span className="font-mono text-sm px-2 py-1 rounded text-sky-300 bg-sky-950 border border-sky-800 font-semibold">
          {item.proposed}
        </span>
      </td>
      <td className="py-3 pr-4 pl-2 align-middle">
        <StatusBadge status={item.status} />
      </td>
    </tr>
  )
}

function SectionCard({ section }: { section: InsuranceSection }) {
  const [expanded, setExpanded] = useState(true)
  const colors = colorMap[section.color as keyof typeof colorMap]

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-300',
      'bg-slate-900 border-slate-700',
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4',
          'border-b border-slate-700 hover:bg-slate-800/50 transition-colors',
          expanded ? colors.bg : ''
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn('p-2 rounded-lg', colors.badge, colors.icon)}>
            {section.icon}
          </span>
          <span className={cn('text-base font-semibold font-serif', colors.text)}>
            {section.title}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {section.items.length} 項比較
          </span>
        </div>
        <span className="text-slate-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Alert Banner */}
      {section.alert && expanded && (
        <div className="mx-4 mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-rose-950 border border-rose-700 text-rose-300 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          {section.alert}
        </div>
      )}

      {/* Table */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[38%]">
                  保障項目
                </th>
                <th className="py-2.5 px-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[22%]">
                  現有方案
                </th>
                <th className="py-2.5 px-3 text-left text-xs font-medium text-sky-500 uppercase tracking-wider w-[22%]">
                  建議方案
                </th>
                <th className="py-2.5 pr-4 pl-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[18%]">
                  狀態
                </th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item, i) => (
                <ComparisonRow key={i} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar() {
  const stats = [
    { label: '保障缺口', value: '4', unit: '項', color: 'text-rose-400' },
    { label: '建議提升', value: '9', unit: '項', color: 'text-amber-400' },
    { label: '保障完善', value: '3', unit: '項', color: 'text-emerald-400' },
    { label: '總保費增幅', value: '+78%', unit: '', color: 'text-sky-400' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
          <div className={cn('text-2xl font-mono font-bold', s.color)}>
            {s.value}<span className="text-sm ml-0.5">{s.unit}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 mb-6 text-xs">
      {Object.entries(statusConfig).map(([key, val]) => (
        <span key={key} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full', val.cls)}>
          {val.icon}
          {val.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-amber-300 bg-slate-800 border border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        重點項目
      </span>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      {/* Top stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-teal-500" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-white tracking-tight">
              保險規劃分析報告
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">六大險種保障缺口全面檢視</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            分析日期：2025/06/01
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Intro */}
        <div className="mb-8 p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <p className="text-sm text-slate-300 leading-relaxed">
            以下為您的現有保單與建議方案的詳細比較。
            <span className="text-sky-400 font-medium">藍色數字</span>為建議方案，
            <span className="text-slate-400">灰色數字</span>為現有方案。
            標有 <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle mx-0.5" /> 的項目為重點保障，請優先檢視。
          </p>
        </div>

        <SummaryBar />
        <Legend />

        {/* Sections */}
        <div className="space-y-4">
          {mockData.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          本報告僅供參考，實際保障內容以保單條款為準。請諮詢專業保險顧問。
        </footer>
      </main>
    </div>
  )
}
