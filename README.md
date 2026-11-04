# 2026 大阪・京都・熊野古道｜Travel Lite

以 [Travel-lite-Template](https://github.com/world4jason/Travel-lite-Template) 建立的獨立關西旅行網站。

- **日期**：2026/11/04–11/14，11天10夜；11/14返回桃園。
- **路線**：大阪、伊勢、京都、白濱、紀伊田邊、熊野古道、紀伊勝浦、臨空城。
- **行程主檔**：[trip.json](./trip.json)；靜態網站：[index.html](./index.html)。
- **所有票券及交通組合**：[reference.html](./reference.html)（包含11/11巴士、JR及備案）。
- **介面**：繁體中文，預設 Vintage Watercolor；可在 More → Appearance 切換。

## GitHub Pages

若未啟用：Repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)`。
啟用後預期網址：`https://world4jason.github.io/2026-Oksaka-Kyoto-Kumano-Kodo/`。

## 交通優先的畫面

- **總覽**：11天濃縮成日期卡，保留出發地、目的地、交通方式與關鍵時間，不堆疊長備註。
- **單日**：主要交通軸在前，重要班次與轉乘標為「關鍵」；行程全文與註記要點開才會顯示。
- **交通**：站點／出發／抵達為主；無經緯度時，不顯示空白底圖，改成可展開的站名路線卡（Google Maps 交通／步行導航）。多段、船舶及航班僅開啟地點搜尋，不假裝能自動算完整路線。
- **11/11**：52號大齋原前的12:16、13:26、14:46、16:11與末班17:36依情境並排。**14:46**為主線，其他是備案，不等同已改行程。
- **11/09**：貴船夜間33號巴士末班未核實，視覺上明示警告，絕不標示為已確認。

畫面參考：[手機總覽](docs/ui-proof/mobile-overview.png) · [11/11手機交通](docs/ui-proof/mobile-kumano-trip.png) · [52號班次比較](docs/ui-proof/mobile-kumano-alternatives.png) · [桌面交通](docs/ui-proof/desktop-kumano-transport.png)。

交通快照是 Excel 既有資料，不是即時班次。`trip.json.days[].mobility` 是網站顯示的唯一共用交通資料；詳細舊版來源仍留在 `reference.html`。

## 驗收

```sh
node --test tests/transport-data.test.mjs
node scripts/check-item-ids.mjs trip.json
python3 -m http.server 8107
# 另開一個終端機（需安裝 Playwright 和 Chromium/Chrome）
python3 tests/transport-visual-smoke.py
python3 tests/named-map-fallback-smoke.py
```

已實測 320 / 390 / 1100px、11/11交通和備案、地圖頁切換與無橫向捲動。介面外觀未經本人最終驗收，不能把靜態測試當成交通官方確認。

## 本地預覽與資料檢查

```sh
python3 -m http.server 8000
node scripts/check-item-ids.mjs trip.json
```

資料係依《京都旅行 NOTE》三個工作表匯入：主行程以頂部11天為準，舊版航班／京都留宿／夜間黑潮前往田邊方案均不覆蓋新版。11/11完整交通查核及備案仍以原工作表歷史版本為來源，不保證即時發車。此版本尚未取得本人逐日驗收，`trip.publication` 為 `draft/not-run`。原始Excel含私人訂房資訊，不上傳公開Repository，公開網站不含完整訂單號與機票憑證。

## 授權與來源

保留原始 [LICENSE](./LICENSE)、[NOTICE.md](./NOTICE.md)、上游檔案內授權與版權聲明。原程式來源為 [world4jason/Travel-lite-Template](https://github.com/world4jason/Travel-lite-Template)，依適用 AGPL-3.0-or-later 或個別上游檔案授權。2026-11-04 加入獨立行程資料與參考頁；上游程式庫未修改。
