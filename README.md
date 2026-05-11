# 郭華益 團隊業績獎金系統 — Streamlit 版

115 年度業績輸入・獎金計算・考核追蹤・晉升 DM 分析

---

## ▶ 快速啟動（本機）

```bash
# 1. 安裝套件
pip install streamlit plotly pandas openpyxl

# 2. 執行
streamlit run app.py
```

瀏覽器自動開啟 `http://localhost:8501`

---

## 📱 手機 / iPad 使用

啟動後，在同一 Wi-Fi 下用手機開啟終端機顯示的 **Network URL**（格式為 `http://192.168.x.x:8501`）即可使用行動版介面。

---

## ☁ 雲端部署（免費，多裝置同步）

### 方案一：Streamlit Cloud（推薦）

1. 把 `app.py` + `requirements.txt` 推上 GitHub
2. 前往 [share.streamlit.io](https://share.streamlit.io)
3. New app → 選 repo → Deploy
4. 取得公開 URL，電腦手機通用

### 方案二：Railway / Render（更穩定）

```bash
# Procfile
web: streamlit run app.py --server.port $PORT --server.address 0.0.0.0
```

---

## 🗄 串接資料庫（雲端儲存）

### Supabase（免費 PostgreSQL，推薦）

```bash
pip install supabase-py
```

**建立 `.streamlit/secrets.toml`**（不要上傳 GitHub）：

```toml
[supabase]
url = "https://xxxxx.supabase.co"
key = "your-anon-key"
```

**在 `app.py` 的 `§DB` 區塊解開 TODO：**

```python
from supabase import create_client

@st.cache_resource
def get_supabase():
    url = st.secrets["supabase"]["url"]
    key = st.secrets["supabase"]["key"]
    return create_client(url, key)

# 讀取
def load_perf_from_db(member_id):
    supa = get_supabase()
    data = supa.table("perf").select("*").eq("member_id", member_id).execute()
    return data.data[0]["rows"] if data.data else EMPTY_PERF

# 寫入
def save_perf_to_db(member_id, rows):
    supa = get_supabase()
    supa.table("perf").upsert({"member_id": member_id, "rows": rows}).execute()
```

### Firebase（可選）

```bash
pip install firebase-admin
```

```toml
# secrets.toml
[firebase]
type = "service_account"
project_id = "your-project"
# ... 其他金鑰欄位
```

---

## 📁 檔案結構

```
app.py              # 主程式（所有功能合一）
requirements.txt    # 套件清單
.streamlit/
  secrets.toml      # 密鑰（本機，不上傳）
  config.toml       # 主題設定（可選）
```

---

## 🎨 可選主題設定（`.streamlit/config.toml`）

```toml
[theme]
primaryColor       = "#1e40af"
backgroundColor    = "#f1f5f9"
secondaryBackgroundColor = "#ffffff"
textColor          = "#0f172a"
font               = "monospace"
```

---

## ✅ 已實作功能

| 功能 | 說明 |
|------|------|
| 115 年度工作月 | 官方 12 個受理區間 + 結案截止日提示 |
| 業績輸入 | 壽/產分類，可收摺，本月預設展開 |
| 實動津貼 | CA: 1萬→1K / 2萬→2K，主管: ≥2萬→1K |
| 基本薪 | UM/AM/SP 達成率四段 + <60% 比例計算 |
| 超額獎金 | UM 13% / AM 11% / SP 10% |
| FYC 年終 | 8級距 + 新人減半，進度條+升級提示 |
| 季獎金 | 6級距 5%–18% |
| 三大年度指標 | 月均業績 / FYC累計 / 增員人數 |
| CA 三月考核 | 業績 + 件數雙條件 |
| 主管六月考核 | 業績 + 專職人數 |
| 晉升 DM | 台北A級 9 項條件逐一追蹤 |
| 資料匯出 | CSV + Excel + JSON 全量備份 |
| 手機適配 | 響應式佈局 + 數字鍵盤 |
