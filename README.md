# Python 沙城訓練場

繁體中文（香港）的第一人稱 3D Python 入門遊戲。設有 6 關、16 項任務，涵蓋 `str`、`int`、`float`、`bool`、`print()`、列表、索引、`len()` 及 `for` 迴圈。設有即時提示、得分和本機進度。遊戲使用原創沙城及資料靶。

## 遊玩

- 電腦用 WASD 移動。按畫面上的滑鼠圖示啟用滑鼠瞄準，左擊開火，按 Esc 離開。也可拖曳或用方向鍵瞄準，再按空白鍵開火。按 R 換彈，按 Q 或右擊開關狙擊鏡。
- iPad 按住畫面左下的方向按鈕移動，拖曳瞄準，再按「開火」。亦可輕觸資料靶射擊。
- 首四關依次提供手槍、步槍、散彈槍、配備 3 倍鏡的狙擊槍。
- 部分關卡有程式任務。按「執行程式」查看 Python 輸出及回饋。
- 資料及進度只保存於目前瀏覽器，無須學生登入。

## 本機啟動

在原始碼根目錄執行 `python -m http.server 8000 --directory dist`，開啟 http://localhost:8000/。

遊戲不需要建置步驟。所有網頁檔案在 `dist/`；GitHub Pages 工作流程會以此資料夾部署。GitHub Pages 的來源需選擇 GitHub Actions。

## 原始碼

- `dist/lessons.js` 設定每關題目、提示和程式任務。
- `dist/world.js` 建立 3D 場景、攝影機與碰撞。
- `dist/firing-range.js` 管理瞄準、彈量、換彈、開火與命中。
- `dist/python-worker.js` 在 Web Worker 內以 Skulpt 執行本遊戲的 Python 3 練習。執行時間和輸出有上限。

Skulpt 及其附帶元件的授權全文見 `dist/SKULPT-LICENSE.txt`。
