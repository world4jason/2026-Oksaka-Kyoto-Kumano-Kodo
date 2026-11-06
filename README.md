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
- **交通**：站點／出發／抵達為主，Google Maps 只做地點查找，原本無經緯度的底圖折疊收納。
- **11/11**：52號大齋原前的12:16、13:26、14:46、16:11與末班17:36依情境並排。**14:46**為主線，其他是備案，不等同已改行程。
- **11/09**：貴船夜間33號巴士末班未核實，視覺上明示警告，絕不標示為已確認。

畫面參考：[手機總覽](docs/ui-proof/mobile-overview.png) · [11/11手機交通](docs/ui-proof/mobile-kumano-trip.png) · [52號班次比較](docs/ui-proof/mobile-kumano-alternatives.png) · [桌面交通](docs/ui-proof/desktop-kumano-transport.png)。

交通快照已於2026/11/07由 Google Sheet 更新主行程及11/06伊勢相關分頁，並不是即時班次。`trip.json.days[].mobility` 是網站顯示的唯一共用交通資料；詳細舊版來源仍留在 `reference.html`。

## 共用日期導航（2026/11/05）

Trip、Transport、Places 使用同一個手機日期下拉與前後一天箭頭，共用選定日期。Trip 保留11天摘要總覽、Places 保留所有景點總覽、Transport 只切單日；切分頁、瀏覽器 Back/Forward、重新整理仍維持最後選定日期。程式依上游 [Template #129](https://github.com/world4jason/Travel-lite-Template/issues/129) 與 [PR #130](https://github.com/world4jason/Travel-lite-Template/pull/130) 套用；仍需 Owner 真機與三位真人後續審查。

## Google Sheet 同步：11/05–11/06 實際行程（2026/11/07）

此獨立網站已改以最新《京都旅行NOTE》為主要來源；`trip.json` 是網站共用行程，`reference.html` 已重新讀入主行程11天、11/06精簡版與前後班（其餘票券／熊野完整參考保留原快照）。**沒有公開私人 Google Sheet、訂房編號或個人照片。**

- **11/05（四）**：大阪天滿宮已到訪，生駒山・寶山寺周邊有下午行程與下山紀錄，但寺內完整參拜內容未確認；伊勢活動不再錯排這天。上午起床時間沒有記錄。
- **11/06（五）**：伊勢內宮→13:34 CAN→14:02二見興玉神社・夫婦岩（成功接14:42 CAN）→15:20御木本珍珠島入場／觀看海女潛水表演→16:20離島→**16:35鳥羽 Vista Car 直達大阪難波18:42**→御堂筋燈光散步→北御堂約20分鐘、兩輪多光影 Show。
- **最重要的回程直達班次**：16:30 しまかぜ→18:21（專用席另加費）；**16:35 Vista Car→18:42（實搭）**；下一班**17:32 Vista Car→19:36**，晚57分鐘。一般車16:57→19:56或17:22→20:45需轉乘，僅作未搭的省錢備案；特急車須購指定席特急券。
- **11/10與11/13**：黑潮3號／5號往白濱仍是待選未購票；11/13更新黑潮22號11:49至日根野15:08、15:19接關空快速至臨空城15:24，晚班黑潮26號13:46為備案，臨空城住宿未訂。

## 景點代表照片與授權

11/05、11/06共 **7 個景點**在 Places 清單與詳情頁加入照片；來源皆為 Wikimedia Commons 開放授權／公有領域作品，圖片連結為外部 HTTPS（需網路才能保證載入，並非使用者2026年的現場照片）。點開每張景點卡可見作者、授權類型、原始作品來源。北御堂照片為寺院外觀示意，**不是2026光影演出實拍**。

全部影像著作權資訊請看 [docs/PHOTO_CREDITS.md](./docs/PHOTO_CREDITS.md)。

## 熊野古道集章手冊

- [11/10 田邊行程](./#trip/day/2026-11-10)：空白雙朝聖手冊免費、田邊站旁09:00–18:00領取；**白濱返回田邊能否趕上18:00仍待確認**。¥100中邊路押印帳不是同一制度。
- [11/11 熊野交通](./#trip/day/2026-11-11)、[11/12 那智山](./#trip/day/2026-11-12)：沿路 7＋3 處官方集章點的可展開清單。More → 準備清單內有 10 個裝置本地勾選項。
- [官方免費手冊領取點](https://www.tb-kumano.jp/tw/kumano-kodo/dual-pilgrim/credential-2/) · [官方指定印章](https://www.tb-kumano.jp/kumano-kodo/dual-pilgrim/stamp-lists/) · [和歌山縣¥100中邊路押印帳](https://www.sekaiisan-wakayama.jp/walk/ouinchou.html)。短程朝聖**不等於集滿41章完全踏破**，也不等於已經完成西班牙側雙朝聖認證。

## 驗收

```sh
node --test tests/transport-data.test.mjs
node --test tests/kansai-2026-11-sync.test.mjs
node scripts/check-item-ids.mjs trip.json
python3 -m http.server 8107
# 另開一個終端機（需安裝 Playwright 和 Chromium/Chrome）
python3 tests/transport-visual-smoke.py
```

原版先前曾測試320 / 390 / 1100px、11/11交通和備案、地圖切換與無橫向捲動；**此次11/07行程與照片同步後尚未執行新的Chromium視覺驗收**。介面外觀未經本人最終驗收，不能把靜態測試當成交通官方確認。

## 本地預覽與資料檢查

```sh
python3 -m http.server 8000
node scripts/check-item-ids.mjs trip.json
```

資料原本依《京都旅行NOTE》匯入，已於2026/11/07重新讀取主行程、11/06精簡版、11/06前後班及舊雙宮備案修正網站。舊版航班／京都留宿／夜間黑潮前往田邊方案均不覆蓋新版。11/11完整交通查核及備案仍以原工作表歷史版本為來源，不保證即時發車。此版本尚未取得本人逐日驗收，`trip.publication` 為 `draft/not-run`。原始Excel含私人訂房資訊，不上傳公開Repository，公開網站不含完整訂單號與機票憑證。

## 授權與來源

保留原始 [LICENSE](./LICENSE)、[NOTICE.md](./NOTICE.md)、上游檔案內授權與版權聲明。原程式來源為 [world4jason/Travel-lite-Template](https://github.com/world4jason/Travel-lite-Template)，依適用 AGPL-3.0-or-later 或個別上游檔案授權。2026-11-04 加入獨立行程資料與參考頁；上游程式庫未修改。
