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

## 本地預覽與資料檢查

```sh
python3 -m http.server 8000
node scripts/check-item-ids.mjs trip.json
```

資料係依《京都旅行 NOTE》三個工作表匯入：主行程以頂部11天為準，舊版航班／京都留宿／夜間黑潮前往田邊方案均不覆蓋新版。11/11完整交通查核及備案仍以原工作表歷史版本為來源，不保證即時發車。此版本尚未取得本人逐日驗收，`trip.publication` 為 `draft/not-run`。原始Excel含私人訂房資訊，不上傳公開Repository，公開網站不含完整訂單號與機票憑證。

## 授權與來源

保留原始 [LICENSE](./LICENSE)、[NOTICE.md](./NOTICE.md)、上游檔案內授權與版權聲明。原程式來源為 [world4jason/Travel-lite-Template](https://github.com/world4jason/Travel-lite-Template)，依適用 AGPL-3.0-or-later 或個別上游檔案授權。2026-11-04 加入獨立行程資料與參考頁；上游程式庫未修改。
