"""
═══════════════════════════════════════════════════════════════
  郭華益 團隊業績獎金系統  ── Streamlit 版
  115 年度 (2026)  |  框架: Streamlit + Plotly + Pandas
═══════════════════════════════════════════════════════════════

執行方式:
  pip install streamlit plotly pandas openpyxl
  streamlit run app.py

雲端部署 (免費):
  streamlit.io  →  New app  →  選 GitHub repo  →  一鍵佈署

資料庫串接預留（目前使用 session_state + CSV）:
  見 §DB  區塊的 TODO 說明
"""

import streamlit as st
import pandas as pd
import json
import io
from datetime import date, datetime
from typing import Optional

# ─── 必要套件檢查 ──────────────────────────────────────────────────
try:
    import plotly.graph_objects as go
    import plotly.express as px
    PLOTLY_OK = True
except ImportError:
    PLOTLY_OK = False
    st.warning("⚠ plotly 未安裝。執行 `pip install plotly` 後重啟。圖表功能將停用。")

# ══════════════════════════════════════════════════════════════════
#  §1  頁面設定
# ══════════════════════════════════════════════════════════════════

st.set_page_config(
    page_title="郭華益 團隊業績系統",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── 自訂 CSS（手機適配）──────────────────────────────────────────
st.markdown("""
<style>
  /* 縮小側邊欄按鈕間距，手機好點擊 */
  .stRadio > div { gap: 0.25rem; }
  .stNumberInput > label { font-size: 0.8rem; }
  /* 進度條加高，手機易辨識 */
  .stProgress > div > div { height: 12px; border-radius: 6px; }
  /* 數字輸入框對齊 */
  input[type="number"] { text-align: right; }
  /* 卡片樣式 */
  .metric-card {
    background: #f0f2f6; border-radius: 12px;
    padding: 1rem; text-align: center;
    border: 1px solid #e0e0e0;
  }
  .metric-card h3 { font-size: 1.6rem; margin: 0; color: #1e40af; }
  .metric-card p  { margin: 0; font-size: 0.75rem; color: #64748b; }
  /* 警示顏色 */
  .warn { color: #dc2626; font-weight: 700; }
  .ok   { color: #059669; font-weight: 700; }
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════
#  §2  常數與職級配置
# ══════════════════════════════════════════════════════════════════

ROLES = {
    "CA":   {"label": "行銷專員",  "is_manager": False, "monthly_target": None,  "overriding_rate": None},
    "SP-A": {"label": "業務主任", "is_manager": True,  "monthly_target": 33000, "overriding_rate": 0.10},
    "AM-A": {"label": "業務襄理", "is_manager": True,  "monthly_target": 44000, "overriding_rate": 0.11},
    "UM-A": {"label": "業務經理", "is_manager": True,  "monthly_target": 55000, "overriding_rate": 0.13},
}

BASE_SALARY_TIERS = {
    "SP-A": [
        (1.00, 12900, None), (0.85, 9400,  None),
        (0.70, 6500,  None), (0.60, 4500,  None), (0, None, 0.10),
    ],
    "AM-A": [
        (1.00, 13750, None), (0.85, 11550, None),
        (0.70, 9350,  None), (0.60, 7150,  None), (0, None, 0.12),
    ],
    "UM-A": [
        (1.00, 20350, None), (0.85, 16500, None),
        (0.70, 12900, None), (0.60, 9350,  None), (0, None, 0.14),
    ],
}

FYC_TIERS = [
    (900000, 0.200, "≥90萬"), (700000, 0.175, "≥70萬"),
    (500000, 0.150, "≥50萬"), (400000, 0.125, "≥40萬"),
    (300000, 0.100, "≥30萬"), (200000, 0.080, "≥20萬"),
    (120000, 0.060, "≥12萬"), ( 80000, 0.040, "≥8萬" ),
    (     0, 0.000, "未達標"),
]

Q_TIERS = [
    (150000, 0.18, ">15萬"), (120000, 0.15, ">12萬"),
    ( 90000, 0.12, ">9萬"),  ( 60000, 0.10, ">6萬"),
    ( 40000, 0.05, ">4萬"),  (     0, 0.00, "未達標"),
]

# ── 115 年度官方工作月受理區間 ───────────────────────────────────
WORK_MONTHS = [
    {"wm": 1,  "perf_mi": 0,  "start": date(2025,12,27), "end": date(2026, 1,26), "close": date(2026, 2, 5), "label": "第1月 (12/27–1/26)"},
    {"wm": 2,  "perf_mi": 1,  "start": date(2026, 1,27), "end": date(2026, 2,25), "close": date(2026, 3, 7), "label": "第2月 (1/27–2/25)"},
    {"wm": 3,  "perf_mi": 2,  "start": date(2026, 2,26), "end": date(2026, 3,25), "close": date(2026, 4, 4), "label": "第3月 (2/26–3/25)"},
    {"wm": 4,  "perf_mi": 3,  "start": date(2026, 3,26), "end": date(2026, 4,27), "close": date(2026, 5, 7), "label": "第4月 (3/26–4/27)"},
    {"wm": 5,  "perf_mi": 4,  "start": date(2026, 4,28), "end": date(2026, 5,25), "close": date(2026, 6, 4), "label": "第5月 (4/28–5/25)"},
    {"wm": 6,  "perf_mi": 5,  "start": date(2026, 5,26), "end": date(2026, 6,25), "close": date(2026, 7, 5), "label": "第6月 (5/26–6/25)"},
    {"wm": 7,  "perf_mi": 6,  "start": date(2026, 6,26), "end": date(2026, 7,27), "close": date(2026, 8, 6), "label": "第7月 (6/26–7/27)"},
    {"wm": 8,  "perf_mi": 7,  "start": date(2026, 7,28), "end": date(2026, 8,25), "close": date(2026, 9, 4), "label": "第8月 (7/28–8/25)"},
    {"wm": 9,  "perf_mi": 8,  "start": date(2026, 8,26), "end": date(2026, 9,29), "close": date(2026,10, 9), "label": "第9月 (8/26–9/29)"},
    {"wm": 10, "perf_mi": 9,  "start": date(2026, 9,30), "end": date(2026,10,27), "close": date(2026,11, 6), "label": "第10月 (9/30–10/27)"},
    {"wm": 11, "perf_mi": 10, "start": date(2026,10,28), "end": date(2026,11,25), "close": date(2026,12, 5), "label": "第11月 (10/28–11/25)"},
    {"wm": 12, "perf_mi": 11, "start": date(2026,11,26), "end": date(2026,12,28), "close": date(2027, 1, 7), "label": "第12月 (11/26–12/28)"},
]
WM_LABELS = [w["label"] for w in WORK_MONTHS]


def get_current_work_month() -> dict:
    today = date.today()
    for wm in WORK_MONTHS:
        if wm["start"] <= today <= wm["end"]:
            return wm
    return WORK_MONTHS[-1] if today > WORK_MONTHS[-1]["end"] else WORK_MONTHS[0]


def work_month_progress() -> float:
    wm    = get_current_work_month()
    today = date.today()
    total = (wm["end"] - wm["start"]).days
    elapsed = max(0, min(total, (today - wm["start"]).days))
    return elapsed / total if total > 0 else 0


def roc_date(d: date) -> str:
    return f"{d.year - 1911}/{d.month:02d}/{d.day:02d}"


# ══════════════════════════════════════════════════════════════════
#  §3  獎金計算引擎
# ══════════════════════════════════════════════════════════════════

def calc_activity_bonus(monthly: float, role: str) -> int:
    if role == "CA":
        if monthly >= 20000: return 2000
        if monthly >= 10000: return 1000
        return 0
    cfg = ROLES.get(role, {})
    return 1000 if monthly >= 20000 else 0


def calc_base_salary(direct_group_monthly: float, role: str) -> dict:
    tiers = BASE_SALARY_TIERS.get(role, [])
    if not tiers:
        return {"achievement": 0, "pct": 0, "base_salary": 0, "tier_label": "—"}
    target = ROLES[role]["monthly_target"]
    ach    = direct_group_monthly / target if target else 0
    for min_rate, amount, rate in tiers:
        if ach >= min_rate:
            salary = round(direct_group_monthly * rate) if rate else amount
            pct_str = f"≥{int(min_rate*100)}%" if min_rate > 0 else "<60%"
            return {"achievement": ach, "pct": round(ach * 100), "base_salary": salary, "tier_label": pct_str}
    return {"achievement": 0, "pct": 0, "base_salary": 0, "tier_label": "—"}


def calc_monthly_overriding(full_team_monthly: float, role: str) -> int:
    cfg = ROLES.get(role, {})
    if not cfg.get("overriding_rate") or not cfg.get("monthly_target"):
        return 0
    excess = full_team_monthly - cfg["monthly_target"]
    return round(excess * cfg["overriding_rate"]) if excess > 0 else 0


def get_fyc_tier(year_total: float, is_newcomer: bool = False) -> tuple:
    effective = year_total * 2 if is_newcomer else year_total
    for min_val, rate, label in FYC_TIERS:
        if effective >= min_val:
            return rate, label
    return 0, "未達標"


def get_q_tier(q_total: float) -> tuple:
    for min_val, rate, label in Q_TIERS:
        if q_total >= min_val:
            return rate, label
    return 0, "未達標"


def fmt(n: float) -> str:
    if n == 0:
        return "–"
    if n >= 10000:
        return f"{n/10000:.1f}萬"
    return f"{int(n):,}"


# ══════════════════════════════════════════════════════════════════
#  §DB  資料儲存層（session_state + CSV）
#
#  現在: st.session_state + 本地 JSON / CSV
#  未來串接雲端步驟:
#    1. pip install supabase-py
#    2. 在 .streamlit/secrets.toml 加入:
#         [supabase]
#         url = "https://xxx.supabase.co"
#         key = "your-anon-key"
#    3. 解開下方 TODO 區塊，刪除 session_state 的讀寫
#
#  Firebase 替代方案:
#    pip install firebase-admin
#    secrets.toml → [firebase] key = "..."
# ══════════════════════════════════════════════════════════════════

EMPTY_PERF = [[0.0, 0.0] for _ in range(12)]   # [life, non_life] × 12 months

def init_state():
    """初始化 session_state 預設值"""
    if "members" not in st.session_state:
        st.session_state.members = [
            {"id": "GHY", "name": "郭華益", "role": "UM-A", "parent": None},
            {"id": "CLM", "name": "陳立閔", "role": "SP-A", "parent": "GHY"},
            {"id": "ZYJ", "name": "鄭宇倢", "role": "CA",   "parent": "GHY"},
            {"id": "ZYX", "name": "張永璇", "role": "CA",   "parent": "GHY"},
            {"id": "LWC", "name": "李偉誠", "role": "SP-A", "parent": "GHY"},
            {"id": "ZCX", "name": "鍾承修", "role": "CA",   "parent": "LWC"},
            {"id": "LGY", "name": "林冠佑", "role": "CA",   "parent": "ZCX"},
        ]
    if "perf" not in st.session_state:
        st.session_state.perf = {
            m["id"]: [list(row) for row in EMPTY_PERF]
            for m in st.session_state.members
        }
    if "targets" not in st.session_state:
        st.session_state.targets = {}   # {member_id: {life, non_life, recruit}}
    if "recruits" not in st.session_state:
        st.session_state.recruits = []  # [{member_id, name, role, month_idx}]

    # TODO: 串接 Supabase 時替換上方為:
    # from supabase import create_client
    # url  = st.secrets["supabase"]["url"]
    # key  = st.secrets["supabase"]["key"]
    # supa = create_client(url, key)
    # data = supa.table("perf").select("*").execute()
    # st.session_state.perf = {row["member_id"]: row["data"] for row in data.data}


def get_perf(member_id: str) -> list:
    return st.session_state.perf.get(member_id, [list(row) for row in EMPTY_PERF])


def save_perf(member_id: str, mi: int, col: int, val: float):
    if member_id not in st.session_state.perf:
        st.session_state.perf[member_id] = [list(row) for row in EMPTY_PERF]
    st.session_state.perf[member_id][mi][col] = val


# ══════════════════════════════════════════════════════════════════
#  §4  業績輸入頁面
# ══════════════════════════════════════════════════════════════════

def page_perf_input():
    st.header("📊 業績輸入")

    members = st.session_state.members
    names   = [m["name"] for m in members]
    sel_idx = st.selectbox("選擇成員", range(len(names)), format_func=lambda i: names[i])
    member  = members[sel_idx]
    mid     = member["id"]
    role    = member["role"]
    perf    = get_perf(mid)

    curwm   = get_current_work_month()
    progress = work_month_progress()

    # ── 成員資訊 strip ──────────────────────────────────────────
    col1, col2, col3, col4 = st.columns(4)
    year_life    = sum(r[0] for r in perf)
    year_nonlife = sum(r[1] for r in perf)
    year_total   = year_life + year_nonlife

    col1.metric("職級",     ROLES[role]["label"])
    col2.metric("年度壽險", fmt(year_life))
    col3.metric("年度產險", fmt(year_nonlife))
    col4.metric("年度總績效", fmt(year_total))

    # ── 本月進度提示 ─────────────────────────────────────────────
    with st.expander(f"⏱ 本工作月進度 — {curwm['label']}", expanded=True):
        c1, c2, c3 = st.columns(3)
        c1.write(f"**受理區間：** {roc_date(curwm['start'])} ～ {roc_date(curwm['end'])}")
        c2.write(f"**結案截止：** :red[{roc_date(curwm['close'])}]")
        c3.write(f"**工作月進度：** {progress*100:.0f}% 已過")
        st.progress(progress)

        tgt = st.session_state.targets.get(mid, {})
        monthly_target = (tgt.get("life", 0) + tgt.get("non_life", 0))
        if monthly_target > 0:
            mi = curwm["perf_mi"]
            this_month = perf[mi][0] + perf[mi][1]
            should_have = monthly_target * progress
            col_a, col_b, col_c = st.columns(3)
            col_a.metric("此刻應達業績", fmt(should_have))
            col_b.metric("本月實際業績", fmt(this_month),
                         delta=f"+{fmt(this_month - should_have)}" if this_month >= should_have
                               else f"-{fmt(should_have - this_month)}")
            col_c.metric("月均目標",     fmt(monthly_target))

    # ── 月度業績輸入 ─────────────────────────────────────────────
    st.subheader("月度業績輸入")
    st.caption("壽險: 深藍色  ｜  產險: 綠色")

    changed = False
    for wm in WORK_MONTHS:
        mi  = wm["perf_mi"]
        cur = wm["wm"] == curwm["wm"]
        life_val    = float(perf[mi][0])
        nonlife_val = float(perf[mi][1])
        total       = life_val + nonlife_val

        # 標頭（可收摺，本月預設展開）
        with st.expander(
            f"{wm['label']}  "
            + (f"── 總計 **{fmt(total)}**" if total > 0 else "（未輸入）")
            + (" 🔵 本月" if cur else ""),
            expanded=cur,
        ):
            st.caption(f"受理：{roc_date(wm['start'])} ～ {roc_date(wm['end'])}  ｜  "
                       f":red[結案截止 {roc_date(wm['close'])}]")

            c1, c2, c3 = st.columns(3)
            new_life = c1.number_input(
                "壽險業績", min_value=0.0, value=life_val, step=1000.0,
                key=f"life_{mid}_{mi}", format="%.0f",
            )
            new_nl = c2.number_input(
                "產險業績", min_value=0.0, value=nonlife_val, step=1000.0,
                key=f"nl_{mid}_{mi}", format="%.0f",
            )
            c3.metric("合計", fmt(new_life + new_nl))
            ab = calc_activity_bonus(new_life + new_nl, role)
            if ab > 0:
                c3.success(f"✓ 實動金 +{ab:,}")

            if new_life != life_val or new_nl != nonlife_val:
                save_perf(mid, mi, 0, new_life)
                save_perf(mid, mi, 1, new_nl)
                changed = True

    if changed:
        st.rerun()

    # ── 業績圖表 ─────────────────────────────────────────────────
    st.subheader("業績圖表")
    if PLOTLY_OK:
        labels = [w["label"].split(" ")[0] for w in WORK_MONTHS]
        lives    = [perf[w["perf_mi"]][0] for w in WORK_MONTHS]
        nonlives = [perf[w["perf_mi"]][1] for w in WORK_MONTHS]

        fig = go.Figure()
        fig.add_bar(name="壽險", x=labels, y=lives,    marker_color="#1e40af")
        fig.add_bar(name="產險", x=labels, y=nonlives, marker_color="#10b981")
        fig.update_layout(
            barmode="stack", height=280,
            margin=dict(l=0, r=0, t=20, b=0),
            legend=dict(orientation="h", y=1.1),
            yaxis_title="業績 (元)",
        )
        # 月均目標線
        tgt = st.session_state.targets.get(mid, {})
        mt  = tgt.get("life", 0) + tgt.get("non_life", 0)
        if mt > 0:
            fig.add_hline(y=mt, line_dash="dash", line_color="#94a3b8",
                          annotation_text=f"月均目標 {fmt(mt)}")

        st.plotly_chart(fig, use_container_width=True)
    else:
        df = pd.DataFrame({
            "工作月": [w["label"].split(" ")[0] for w in WORK_MONTHS],
            "壽險": [perf[w["perf_mi"]][0] for w in WORK_MONTHS],
            "產險": [perf[w["perf_mi"]][1] for w in WORK_MONTHS],
        })
        st.bar_chart(df.set_index("工作月"))

    # ── CSV / Excel 匯出 ────────────────────────────────────────
    st.divider()
    st.subheader("📥 資料匯出")
    rows = []
    for wm in WORK_MONTHS:
        mi = wm["perf_mi"]
        life_v = perf[mi][0]; nl_v = perf[mi][1]
        ab = calc_activity_bonus(life_v + nl_v, role)
        rows.append({
            "工作月": wm["label"],
            "受理起日": roc_date(wm["start"]),
            "受理迄日": roc_date(wm["end"]),
            "結案截止": roc_date(wm["close"]),
            "壽險業績": life_v,
            "產險業績": nl_v,
            "總業績":   life_v + nl_v,
            "實動津貼": ab,
        })
    df_export = pd.DataFrame(rows)

    ec1, ec2 = st.columns(2)
    # CSV
    csv_buf = io.StringIO()
    df_export.to_csv(csv_buf, index=False, encoding="utf-8-sig")
    ec1.download_button(
        "⬇ 下載 CSV",
        data=csv_buf.getvalue().encode("utf-8-sig"),
        file_name=f"perf_{member['name']}_115.csv",
        mime="text/csv",
    )
    # Excel
    xlsx_buf = io.BytesIO()
    with pd.ExcelWriter(xlsx_buf, engine="openpyxl") as writer:
        df_export.to_excel(writer, index=False, sheet_name="業績")
    ec2.download_button(
        "⬇ 下載 Excel",
        data=xlsx_buf.getvalue(),
        file_name=f"perf_{member['name']}_115.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ══════════════════════════════════════════════════════════════════
#  §5  目標達成進度頁面
# ══════════════════════════════════════════════════════════════════

def page_targets():
    st.header("🎯 115 年度目標達成進度")

    members = st.session_state.members
    names   = [m["name"] for m in members]
    sel_idx = st.selectbox("選擇成員", range(len(names)), format_func=lambda i: names[i], key="tgt_sel")
    member  = members[sel_idx]
    mid     = member["id"]
    role    = member["role"]
    perf    = get_perf(mid)
    tgt     = st.session_state.targets.get(mid, {"life": 0, "non_life": 0, "recruit": 0})

    is_new = st.session_state.targets.get(mid, {}).get("is_newcomer", False)

    # ── 目標設定 ────────────────────────────────────────────────
    with st.expander("✏️ 設定個人年度目標", expanded=False):
        tc1, tc2, tc3 = st.columns(3)
        new_life_tgt = tc1.number_input("月均壽險目標", min_value=0, value=int(tgt.get("life", 0)), step=1000, key=f"tgt_life_{mid}")
        new_nl_tgt   = tc2.number_input("月均產險目標", min_value=0, value=int(tgt.get("non_life", 0)), step=1000, key=f"tgt_nl_{mid}")
        new_rec_tgt  = tc3.number_input("年度增員目標（人）", min_value=0, value=int(tgt.get("recruit", 0)), step=1, key=f"tgt_rec_{mid}")
        is_new = st.checkbox("未滿一年新人（FYC 門檻減半）", value=is_new, key=f"tgt_new_{mid}")
        if st.button("儲存目標", key=f"save_tgt_{mid}"):
            st.session_state.targets[mid] = {
                "life": new_life_tgt, "non_life": new_nl_tgt,
                "recruit": new_rec_tgt, "is_newcomer": is_new,
            }
            st.success("✓ 目標已儲存")
            st.rerun()

    tgt = st.session_state.targets.get(mid, {"life": 0, "non_life": 0, "recruit": 0})
    monthly_target = tgt.get("life", 0) + tgt.get("non_life", 0)
    yearly_target  = monthly_target * 12

    year_life    = sum(r[0] for r in perf)
    year_nonlife = sum(r[1] for r in perf)
    year_total   = year_life + year_nonlife
    filled_months = [i for i in range(12) if (perf[i][0] + perf[i][1]) > 0]
    avg_actual = year_total / len(filled_months) if filled_months else 0

    st.markdown("---")

    # ── 指標一：月均業績 ─────────────────────────────────────────
    st.subheader("📌 指標一：個人月均業績")
    m1, m2, m3 = st.columns(3)
    m1.metric("目標月均",   fmt(monthly_target))
    m2.metric("實際月均",   fmt(avg_actual),
              delta=f"+{fmt(avg_actual - monthly_target)}" if avg_actual >= monthly_target
                    else f"-{fmt(monthly_target - avg_actual)}")
    if monthly_target > 0:
        pct_val = min(1.0, avg_actual / monthly_target)
        m3.metric("達成率", f"{pct_val*100:.1f}%")
        st.progress(pct_val, text=f"月均達成率 {pct_val*100:.1f}%")
    else:
        m3.metric("達成率", "未設目標")

    # 月度堆疊圖
    if PLOTLY_OK and any((perf[i][0]+perf[i][1]) > 0 for i in range(12)):
        labels = [w["label"].split(" ")[0] for w in WORK_MONTHS]
        lives    = [perf[w["perf_mi"]][0] for w in WORK_MONTHS]
        nonlives = [perf[w["perf_mi"]][1] for w in WORK_MONTHS]
        fig = go.Figure()
        fig.add_bar(name="壽險", x=labels, y=lives,    marker_color="#1e40af")
        fig.add_bar(name="產險", x=labels, y=nonlives, marker_color="#10b981")
        if monthly_target > 0:
            fig.add_hline(y=monthly_target, line_dash="dash", line_color="#ef4444",
                          annotation_text=f"月均目標 {fmt(monthly_target)}")
        fig.update_layout(barmode="stack", height=220,
                          margin=dict(l=0,r=0,t=20,b=0),
                          legend=dict(orientation="h", y=1.15))
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    # ── 指標二：年度累計 FYC ─────────────────────────────────────
    st.subheader("📌 指標二：年度累計 FYC")
    fyc_rate, fyc_label = get_fyc_tier(year_total, is_new)
    fyc_bonus = round(year_total * fyc_rate)

    fa, fb, fc = st.columns(3)
    fa.metric("年度總 FYC",   fmt(year_total))
    fb.metric("目前 FYC 加成", f"{fyc_label}  {fyc_rate*100:.1f}%")
    fc.metric("預估 FYC 年終", f"${fyc_bonus:,}")

    # FYC 進度條（以 90 萬為滿格）
    MAX_FYC = 900000
    st.progress(min(1.0, year_total / MAX_FYC), text=f"FYC 進度 {year_total/MAX_FYC*100:.1f}%")

    # 級距刻度表
    if PLOTLY_OK:
        tier_labels = [t[2] for t in FYC_TIERS[:-1]]
        tier_mins   = [t[0] for t in FYC_TIERS[:-1]]
        colors      = ["#059669" if year_total >= m else "#e2e8f0" for m in tier_mins]
        fig2 = go.Figure(go.Bar(
            x=tier_labels, y=tier_mins,
            marker_color=colors,
            text=[f"{t[1]*100:.1f}%" for t in FYC_TIERS[:-1]],
            textposition="inside",
        ))
        fig2.add_hline(y=year_total, line_color="#1e40af", line_width=2,
                       annotation_text=f"目前 {fmt(year_total)}", annotation_position="right")
        fig2.update_layout(height=200, margin=dict(l=0,r=0,t=20,b=0),
                           yaxis_title="門檻 (元)", showlegend=False)
        st.plotly_chart(fig2, use_container_width=True)

    # 距下一級距
    for m, r, lbl in FYC_TIERS[:-1]:
        eff = year_total * 2 if is_new else year_total
        if eff < m:
            gap = m - (year_total * 2 if is_new else year_total)
            adj = gap / 2 if is_new else gap
            st.info(f"📈 距離下一級距 **{lbl} ({r*100:.1f}%)** 還差 **{fmt(adj)}**"
                    + (" (新人門檻減半)" if is_new else ""))
            break

    st.markdown("---")

    # ── 指標三：年度增員 ─────────────────────────────────────────
    st.subheader("📌 指標三：年度增員")
    my_recruits = [r for r in st.session_state.recruits if r["member_id"] == mid]
    rec_target  = tgt.get("recruit", 0)

    ra, rb = st.columns(2)
    ra.metric("已增員人數", f"{len(my_recruits)} 人")
    rb.metric("年度目標",   f"{rec_target} 人" if rec_target > 0 else "未設定")

    if rec_target > 0:
        st.progress(min(1.0, len(my_recruits) / rec_target),
                    text=f"增員進度 {len(my_recruits)}/{rec_target} 人")

    # 增員名單
    with st.expander("增員名單管理", expanded=len(my_recruits) > 0):
        with st.form(f"add_recruit_{mid}"):
            nc1, nc2, nc3 = st.columns(3)
            rname = nc1.text_input("增員姓名")
            rrole = nc2.selectbox("職級", list(ROLES.keys()), format_func=lambda r: ROLES[r]["label"])
            rmonth = nc3.selectbox("增員月份", range(12), format_func=lambda i: WORK_MONTHS[i]["label"])
            if st.form_submit_button("新增"):
                if rname.strip():
                    st.session_state.recruits.append({
                        "member_id": mid, "name": rname.strip(),
                        "role": rrole, "month_idx": rmonth,
                    })
                    st.success(f"✓ 已新增 {rname}")
                    st.rerun()

        if my_recruits:
            df_rec = pd.DataFrame(my_recruits)
            df_rec["職級"] = df_rec["role"].map(lambda r: ROLES[r]["label"])
            df_rec["月份"] = df_rec["month_idx"].map(lambda i: WORK_MONTHS[i]["label"].split(" ")[0])
            st.dataframe(df_rec[["name","職級","月份"]].rename(columns={"name":"姓名"}),
                         use_container_width=True, hide_index=True)

            del_idx = st.selectbox("刪除增員", range(len(my_recruits)),
                                   format_func=lambda i: my_recruits[i]["name"],
                                   key="del_rec_sel")
            if st.button("刪除選取", key="del_rec_btn"):
                rec_id = id(my_recruits[del_idx])
                st.session_state.recruits = [
                    r for r in st.session_state.recruits
                    if not (r["member_id"] == mid and r["name"] == my_recruits[del_idx]["name"]
                            and r["month_idx"] == my_recruits[del_idx]["month_idx"])
                ]
                st.rerun()


# ══════════════════════════════════════════════════════════════════
#  §6  晉升 / 考核追蹤頁面
# ══════════════════════════════════════════════════════════════════

def page_promotion():
    st.header("🏆 晉升 / 考核追蹤")

    tabs = st.tabs(["CA 三月考核", "主管六月考核", "晉升 DM 追蹤（台北 A 級）"])

    # ── Tab 1: CA 考核 ──────────────────────────────────────────
    with tabs[0]:
        st.subheader("行銷專員 — 三個月考核")
        ca_members = [m for m in st.session_state.members if m["role"] == "CA"]
        if not ca_members:
            st.info("目前無 CA 成員"); return

        for ca in ca_members:
            perf = get_perf(ca["id"])
            with st.expander(f"**{ca['name']}**", expanded=False):
                q_sel = st.radio("考核週期", ["Q1 (1-3月)", "Q2 (4-6月)", "Q3 (7-9月)", "Q4 (10-12月)"],
                                 horizontal=True, key=f"q_{ca['id']}")
                qi = ["Q1","Q2","Q3","Q4"].index(q_sel[:2])
                start_mi = qi * 3
                months   = list(range(start_mi, start_mi + 3))

                cycle_total = sum(perf[i][0] + perf[i][1] for i in months)
                month_max   = max((perf[i][0] + perf[i][1] for i in months), default=0)
                case_count  = st.number_input("週期件數", 0, key=f"cases_{ca['id']}_{qi}", step=1)

                perf_ok  = month_max >= 10000 or cycle_total >= 45000
                cases_ok = case_count >= 1
                passed   = perf_ok and cases_ok

                c1, c2, c3 = st.columns(3)
                c1.metric("週期累計", fmt(cycle_total),
                          delta="✓ 達標" if perf_ok else f"差 {fmt(45000 - cycle_total)}")
                c2.metric("單月最高", fmt(month_max),
                          delta="✓ ≥1萬" if month_max >= 10000 else "未達單月標準")
                c3.metric("累計件數", f"{int(case_count)} 件",
                          delta="✓" if cases_ok else "差 1 件")

                if passed:
                    st.success("✅ 本週期考核達標")
                else:
                    missing = []
                    if not perf_ok:  missing.append("業績（單月≥1萬 或 累計≥4.5萬）")
                    if not cases_ok: missing.append("件數（≥1件）")
                    st.error(f"❌ 未達標：{' ／ '.join(missing)}")

                st.progress(min(1.0, cycle_total / 45000), text=f"累計進度 {cycle_total/45000*100:.0f}%")

    # ── Tab 2: 主管考核 ─────────────────────────────────────────
    with tabs[1]:
        st.subheader("主管 — 六個月考核")
        ASSESS = {"SP-A": (160000, 9), "AM-A": (220000, 15), "UM-A": (280000, 21)}
        mgr_members = [m for m in st.session_state.members if m["role"] in ASSESS]

        for mgr in mgr_members:
            perf = get_perf(mgr["id"])
            role = mgr["role"]
            perf_thr, fte_thr = ASSESS[role]

            with st.expander(f"**{mgr['name']}** ({ROLES[role]['label']})", expanded=False):
                half = st.radio("考核週期", ["前半年 (1-6月)", "後半年 (7-12月)"],
                                horizontal=True, key=f"half_{mgr['id']}")
                mis = list(range(6)) if "前" in half else list(range(6, 12))
                cycle_total = sum(perf[i][0] + perf[i][1] for i in mis)
                fte_count   = st.number_input("專職人數", 0, key=f"fte_{mgr['id']}", step=1)

                perf_ok = cycle_total >= perf_thr
                fte_ok  = fte_count >= fte_thr
                passed  = perf_ok and fte_ok

                c1, c2 = st.columns(2)
                c1.metric("直轄組累計", fmt(cycle_total),
                          delta=f"{'✓' if perf_ok else f'差{fmt(perf_thr-cycle_total)}'}")
                c2.metric("專職人數", f"{int(fte_count)} 人",
                          delta=f"{'✓' if fte_ok else f'差{fte_thr-int(fte_count)}人'}")

                st.progress(min(1.0, cycle_total / perf_thr), text=f"業績進度 {cycle_total/perf_thr*100:.0f}%")
                st.progress(min(1.0, fte_count / fte_thr),   text=f"人力進度 {fte_count/fte_thr*100:.0f}%")

                if passed: st.success("✅ 六個月考核達標")
                else:      st.error("❌ 考核未達標")

    # ── Tab 3: 晉升 DM（台北 A 級）─────────────────────────────
    with tabs[2]:
        st.subheader("🏆 晉升處經理 DM — 台北 A 級門檻")

        DM = {
            "valid_headcount": 240, "direct_group_min": 5,
            "avg_fyc_min": 700000,
            "first_gen_min": 6, "first_gen_sp_min": 5, "first_gen_am_min": 1,
            "total_groups_min": 10,
            "personal_recruit_min": 2, "ca_to_sp_rate_min": 0.10,
        }

        st.markdown("##### 業務條件")
        d1, d2 = st.columns(2)
        valid_hc    = d1.number_input("6個月有效人次",    0, key="dm_hc",    step=1)
        direct_grp  = d2.number_input("申請月直轄組人力", 0, key="dm_dg",    step=1)

        st.markdown("##### 業績條件（自動計算）")
        um_members = [m for m in st.session_state.members if m["role"] == "UM-A"]
        um = um_members[0] if um_members else None
        if um:
            all_ids = [m["id"] for m in st.session_state.members]
            # 全轄月平均 FYC
            all_monthly = [
                sum(get_perf(mid)[mi][0] + get_perf(mid)[mi][1] for mid in all_ids)
                for mi in range(12)
            ]
            filled = [v for v in all_monthly if v > 0]
            avg_fyc6 = sum(filled[-6:]) / min(6, len(filled)) if filled else 0

            a1, a2 = st.columns(2)
            avg_ok = avg_fyc6 >= DM["avg_fyc_min"]
            a1.metric("全轄月平均 FYC", fmt(avg_fyc6),
                      delta="✓ 達標" if avg_ok else f"差 {fmt(DM['avg_fyc_min'] - avg_fyc6)}")

        st.markdown("##### 組織架構")
        o1, o2, o3, o4 = st.columns(4)
        fg_total = o1.number_input("第一代組數",     0, key="dm_fg",   step=1)
        fg_sp    = o2.number_input("其中 SP+ 組數",  0, key="dm_sp",   step=1)
        fg_am    = o3.number_input("其中 AM+ 組數",  0, key="dm_am",   step=1)
        total_g  = o4.number_input("全體系總組數",   0, key="dm_tg",   step=1)

        st.markdown("##### 年度發展")
        r1, r2, r3 = st.columns(3)
        p_recruit   = r1.number_input("個人增員人數",       0, key="dm_pr",  step=1)
        ca_12m      = r2.number_input("12個月內 CA 人數",   0, key="dm_ca",  step=1)
        ca_to_sp    = r3.number_input("其中晉升 SP 人數",   0, key="dm_sp2", step=1)
        ca_sp_rate  = ca_to_sp / ca_12m if ca_12m > 0 else 0

        # 判定結果
        checks = [
            ("有效人次",   valid_hc  >= DM["valid_headcount"],    f"{int(valid_hc)}/{DM['valid_headcount']}人次"),
            ("直轄組人力", direct_grp>= DM["direct_group_min"],   f"{int(direct_grp)}/{DM['direct_group_min']}人"),
            ("平均業績",   avg_fyc6  >= DM["avg_fyc_min"] if um else False, fmt(avg_fyc6) + "/" + fmt(DM["avg_fyc_min"])),
            ("第一代6組",  fg_total  >= DM["first_gen_min"],      f"{int(fg_total)}/6組"),
            ("SP5組",      fg_sp     >= DM["first_gen_sp_min"],   f"{int(fg_sp)}/5組"),
            ("AM1組",      fg_am     >= DM["first_gen_am_min"],   f"{int(fg_am)}/1組"),
            ("全系10組",   total_g   >= DM["total_groups_min"],   f"{int(total_g)}/10組"),
            ("個人增員",   p_recruit >= DM["personal_recruit_min"], f"{int(p_recruit)}/2人"),
            ("晉升率10%",  ca_sp_rate>= DM["ca_to_sp_rate_min"],  f"{ca_sp_rate*100:.1f}%/10%"),
        ]

        passed_n = sum(1 for _, ok, _ in checks if ok)
        total_n  = len(checks)

        st.markdown("---")
        st.markdown(f"### 達標進度：**{passed_n}/{total_n}** 項")
        st.progress(passed_n / total_n, text=f"整體達成率 {passed_n/total_n*100:.0f}%")

        # 逐項顯示
        for label, ok, detail in checks:
            icon = "✅" if ok else "❌"
            st.markdown(f"{icon} **{label}** &nbsp; `{detail}`")

        if passed_n == total_n:
            st.balloons()
            st.success("🎉 全部達標！可申請晉升 DM！")
        elif passed_n >= 7:
            st.warning(f"⚡ 還差 {total_n - passed_n} 項即可達標！")
        else:
            st.error(f"📋 尚需努力，還差 {total_n - passed_n} 項")


# ══════════════════════════════════════════════════════════════════
#  §7  獎金計算頁面
# ══════════════════════════════════════════════════════════════════

def page_bonus():
    st.header("💰 獎金計算")

    members = st.session_state.members
    names   = [m["name"] for m in members]
    sel_idx = st.selectbox("選擇成員", range(len(names)), format_func=lambda i: names[i], key="bonus_sel")
    member  = members[sel_idx]
    mid     = member["id"]
    role    = member["role"]
    perf    = get_perf(mid)
    is_new  = st.session_state.targets.get(mid, {}).get("is_newcomer", False)

    year_total = sum(r[0] + r[1] for r in perf)

    st.subheader("👤 個人獎金")

    # 季獎金
    q_data = []
    for qi, (q_label, months) in enumerate([("Q1",[0,1,2]),("Q2",[3,4,5]),("Q3",[6,7,8]),("Q4",[9,10,11])]):
        qt = sum(perf[m][0] + perf[m][1] for m in months)
        r, lbl = get_q_tier(qt)
        q_data.append({"季度": q_label, "業績": qt, "級距": lbl, "季獎金": round(qt*r)})

    df_q = pd.DataFrame(q_data)
    st.dataframe(df_q.style.format({"業績": lambda x: fmt(x), "季獎金": lambda x: f"${x:,}"}),
                 use_container_width=True, hide_index=True)

    total_q_bonus = df_q["季獎金"].sum()
    act_bonus = sum(calc_activity_bonus(perf[i][0]+perf[i][1], role) for i in range(12))
    fyc_rate, fyc_lbl = get_fyc_tier(year_total, is_new)
    fyc_bonus = round(year_total * fyc_rate)
    year_end  = round(act_bonus * 0.18)

    b1, b2, b3, b4 = st.columns(4)
    b1.metric("實動津貼", f"${act_bonus:,}")
    b2.metric("季獎金合計", f"${total_q_bonus:,}")
    b3.metric("個人年終 (×18%)", f"${year_end:,}")
    b4.metric(f"FYC年終 ({fyc_lbl})", f"${fyc_bonus:,}")

    personal_total = act_bonus + total_q_bonus + year_end + fyc_bonus
    st.metric("個人部分合計", f"${personal_total:,}")

    # 主管加成
    is_manager = ROLES[role].get("is_manager", False)
    if is_manager:
        st.markdown("---")
        st.subheader("👥 團隊部分")
        st.caption("直轄組月業績 = 本人 + 所有CA下屬")

        dg_monthly = [
            sum(
                get_perf(m2["id"])[mi][0] + get_perf(m2["id"])[mi][1]
                for m2 in members
                if m2["id"] == mid or (m2["parent"] == mid and m2["role"] == "CA")
            )
            for mi in range(12)
        ]
        bs_year = sum(calc_base_salary(dg, role)["base_salary"] for dg in dg_monthly)
        ov_year = sum(calc_monthly_overriding(dg, role) for dg in dg_monthly)

        t1, t2, t3 = st.columns(3)
        t1.metric("年度基本薪",     f"${bs_year:,}")
        t2.metric("年度超額獎金",   f"${ov_year:,}")
        t3.metric("團隊部分合計",   f"${bs_year+ov_year:,}")

        grand = personal_total + bs_year + ov_year
    else:
        grand = personal_total

    st.markdown("---")
    st.metric("🏆 年度預估總收入", f"${grand:,}", help="個人獎金 + 團隊獎金（主管限定）的合計估算")


# ══════════════════════════════════════════════════════════════════
#  §8  主程式
# ══════════════════════════════════════════════════════════════════

def main():
    init_state()

    # ── Sidebar 導覽 ─────────────────────────────────────────────
    with st.sidebar:
        st.image("https://img.shields.io/badge/115年度-業績系統-1e40af?style=for-the-badge",
                 use_container_width=True)
        st.markdown("### 郭華益 團隊")
        st.caption("業績 · 獎金 · 考核管理系統")
        st.divider()

        page = st.radio(
            "導覽",
            ["📊 業績輸入", "🎯 目標達成進度", "💰 獎金計算", "🏆 晉升/考核追蹤"],
            label_visibility="collapsed",
        )
        st.divider()

        # 目前工作月快覽
        curwm = get_current_work_month()
        st.markdown(f"**📅 目前工作月**")
        st.markdown(f"第 **{curwm['wm']}** 工作月")
        st.markdown(f"{roc_date(curwm['start'])} ～ {roc_date(curwm['end'])}")
        st.markdown(f":red[結案截止 {roc_date(curwm['close'])}]")
        st.progress(work_month_progress())
        st.divider()

        # 全團快覽
        total_life  = sum(get_perf(m["id"])[mi][0] for m in st.session_state.members for mi in range(12))
        total_nl    = sum(get_perf(m["id"])[mi][1] for m in st.session_state.members for mi in range(12))
        st.markdown("**全團累計**")
        st.markdown(f"壽險 {fmt(total_life)}  ｜  產險 {fmt(total_nl)}")
        st.markdown(f"**合計 {fmt(total_life + total_nl)}**")
        st.divider()

        # 資料管理
        with st.expander("⚙ 資料管理"):
            if st.button("清除所有資料", type="secondary"):
                for key in ["perf","targets","recruits"]:
                    if key in st.session_state:
                        del st.session_state[key]
                st.rerun()
            # 全量 JSON 備份
            backup = {
                "perf":     {mid: [[float(v) for v in row] for row in rows]
                             for mid, rows in st.session_state.perf.items()},
                "targets":  st.session_state.targets,
                "recruits": st.session_state.recruits,
            }
            st.download_button(
                "⬇ 備份全量資料 (JSON)",
                data=json.dumps(backup, ensure_ascii=False, indent=2),
                file_name="backup_115.json",
                mime="application/json",
            )

    # ── 頁面路由 ─────────────────────────────────────────────────
    if page == "📊 業績輸入":
        page_perf_input()
    elif page == "🎯 目標達成進度":
        page_targets()
    elif page == "💰 獎金計算":
        page_bonus()
    elif page == "🏆 晉升/考核追蹤":
        page_promotion()


if __name__ == "__main__":
    main()
