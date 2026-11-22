# Python 沙城訓練場

繁體中文（香港）的第一人稱 3D Python 入門遊戲。設有 6 關、16 項任務，涵蓋 `str`、`int`、`float`、`bool`、`print()`、列表、索引、`len()` 及 `for` 迴圈。設有即時提示、得分和本機進度。遊戲使用原創沙城及資料靶。

## 遊玩

- 電腦用 WASD 移動，拖曳或按方向鍵改變視角。點選資料靶、按 1–3，或對準靶後按空白鍵掃描。
- iPad 按住畫面左下的方向按鈕移動，拖曳轉視角，輕觸資料靶。
- 部分關卡有程式任務。按「執行程式」查看 Python 輸出及回饋。
- 資料及進度只保存於目前瀏覽器，無須學生登入。

## 本機啟動

在原始碼根目錄執行 `python -m http.server 8000 --directory dist`，開啟 http://localhost:8000/。

遊戲不需要建置步驟。所有網頁檔案在 `dist/`；GitHub Pages 工作流程會以此資料夾部署。GitHub Pages 的來源需選擇 GitHub Actions。

## 原始碼

- `dist/lessons.js` 設定每關題目、提示和程式任務。
- `dist/world.js` 建立 WebGL 場景、攝影機與碰撞。
- `dist/python-worker.js` 在 Web Worker 內以 Skulpt 執行本遊戲的 Python 3 練習。執行時間和輸出有上限。

Skulpt 及其附帶元件的授權全文見 `dist/SKULPT-LICENSE.txt`。
