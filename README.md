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

- **總覽**：11天濃縮成日期卡，保留每一天的景點／祭典重點與銜接路線。
- **單日 Trip**：景點停留起訖時間＋其間交通直接展開；祭典的固定開始時間獨立列出。長篇交通比較放在下方「交通詳細與備案」，不應蓋過實際行程。
- **Transport**：站點／出發／抵達及備案優先；Google Maps 只做地點查找，原本無經緯度的底圖折疊收納。
- **11/08–11/10**：已把13:00本殿祭、14:00火焚、17:30／19:30太秦演出、貴船17:30–20:30點燈、白濱三景與17:30田邊領冊期限放入直接可見的行程時間軸；候選交通仍標明未購票與估算。
- **11/11**：52號大齋原前的12:16、13:26、14:46、16:11與末班17:36依情境並排。**14:46**為主線，其他是備案，不等同已改行程。
- **11/09**：貴船夜間33號巴士末班未核實，視覺上明示警告，絕不標示為已確認。

畫面參考：[手機總覽](docs/ui-proof/mobile-overview.png) · [11/11手機交通](docs/ui-proof/mobile-kumano-trip.png) · [52號班次比較](docs/ui-proof/mobile-kumano-alternatives.png) · [桌面交通](docs/ui-proof/desktop-kumano-transport.png)。

交通快照是 Excel 既有資料，不是即時班次。`trip.json.days[].mobility` 是網站顯示的唯一共用交通資料；詳細舊版來源仍留在 `reference.html`。

## 共用日期導航（2026/11/05）

Trip、Transport、Places 使用同一個手機日期下拉與前後一天箭頭，共用選定日期。Trip 保留11天摘要總覽、Places 保留所有景點總覽、Transport 只切單日；切分頁、瀏覽器 Back/Forward、重新整理仍維持最後選定日期。程式依上游 [Template #129](https://github.com/world4jason/Travel-lite-Template/issues/129) 與 [PR #130](https://github.com/world4jason/Travel-lite-Template/pull/130) 套用；仍需 Owner 真機與三位真人後續審查。

## 11/05 伊勢・鳥羽更新（2026/11/05）

- **主案**：伊勢市站直接搭09:40 51號巴士至內宮，不去外宮；11:50–13:20托福橫丁／午餐；13:34 CAN 往二見夫婦岩；14:42 CAN 往鳥羽，御木本珍珠島首選、水族館備案。
- 近鐵全部 **普通／急行／準急免指定席**，去程06:54難波→09:27伊勢市；鳥羽回程16:57→19:56難波、可延後17:22→20:43。當地三重交通1DAY ¥1,300與不買的近鐵¥7,500套票不同。
- **原版外宮＋內宮仍保留**於 [完整參考表的雙宮分頁](./reference.html#ise-legacy)；主要交通前後班、錯車後是否可保留夫婦岩／鳥羽入館見 [11/05前後班](./reference.html#ise-transit)。班次不是即時保證。

## 熊野古道集章手冊

- [11/10 田邊行程](./#trip/day/2026-11-10)：空白雙朝聖手冊免費、田邊站旁09:00–18:00領取；**白濱返回田邊能否趕上18:00仍待確認**。¥100中邊路押印帳不是同一制度。
- [11/11 熊野交通](./#trip/day/2026-11-11)、[11/12 那智山](./#trip/day/2026-11-12)：沿路 7＋3 處官方集章點的可展開清單。More → 準備清單內有 10 個裝置本地勾選項。
- [官方免費手冊領取點](https://www.tb-kumano.jp/tw/kumano-kodo/dual-pilgrim/credential-2/) · [官方指定印章](https://www.tb-kumano.jp/kumano-kodo/dual-pilgrim/stamp-lists/) · [和歌山縣¥100中邊路押印帳](https://www.sekaiisan-wakayama.jp/walk/ouinchou.html)。短程朝聖**不等於集滿41章完全踏破**，也不等於已經完成西班牙側雙朝聖認證。

## 驗收

```sh
node --test tests/transport-data.test.mjs
node scripts/check-item-ids.mjs trip.json
python3 -m http.server 8107
# 另開一個終端機（需安裝 Playwright 和 Chromium/Chrome）
python3 tests/transport-visual-smoke.py
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
