# 大阪 15 套封面 — 獨立 Verification 實測（2026-11-20）

- 結果：**FAIL**，**0/15** 可發布。
- 已檢查前一輪提供的獨立封面 ZIP 原始檔與既有生成腳本：2 張各自有獨立視覺輸入，13 張取自 3×5 合成圖裁切後放大。
- 13 張的裁切原生來源不符合獨立生成要求；15 張全缺少符合新版協議的獨立生成 receipts／獨立視覺評分／人類核准紀錄。
- 這份報告針對**當時的素材快照**，不是未來版本的永久結論。重新生成後需重新執行檢查，SHA-256 與審核紀錄也需要重新建立。

## 主要失敗項目
- E_INDEPENDENT_GENERATION_UNPROVEN: 15/15
- E_GENERATION_RECEIPT_MISSING: 15/15
- E_ATLAS_CROP_NOT_INDEPENDENT: 13/15
- E_NATIVE_RESOLUTION: 13/15

## 結論

舊 3×5 圖集只能作**預覽參考**，不能標為 15 張獨立、具原生解析度且經驗收的高品質封面。獨立驗證 CLI **退出碼 2**，發布指令拒絕升級；正式總覽保留 `qaStatus=pending`，只有 `?previewArtwork=1` 才能預覽。

獨立驗證工具、版本化 15 套 Style Recipe 與不依賴產圖模型的負例測試隨新版工具提供。完整 HTML/Chromium 美術驗收尚未執行。