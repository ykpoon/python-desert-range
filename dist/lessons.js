export const lessons = [
  {
    name: '字串與整數', tag: 'str · int', icon: 'code', site: '砂岩入口',
    intro: '從引號辨認資料，分清文字和整數。',
    rounds: [
      {
        prompt: '找出屬於 str（字串）的資料靶。',
        options: ['"72"', '72', '72.0'], correct: 0,
        hint: '字串用引號包住。數字放進引號之後，Python 會把它當成文字。',
        explanation: '"72" 有引號，所以是字串 str。72 是整數，72.0 是浮點數。',
      },
      {
        prompt: '找出屬於 int（整數）的資料靶。',
        options: ['"5"', '5.5', '-5'], correct: 2,
        hint: '整數可以是負數。留意有沒有引號或小數點。',
        explanation: '-5 沒有引號及小數點，屬於整數 int。',
      },
      {
        prompt: '"2" + "3" 的結果是甚麼？射中正確的輸出。',
        options: ['5', '"23"', '23'], correct: 1,
        hint: '兩個字串使用 + 時，Python 會把文字接起來。',
        explanation: '"2" + "3" 把兩段文字接起來，結果是字串 "23"。',
      },
    ],
  },
  {
    name: '小數與布林值', tag: 'float · bool', icon: 'grid', site: '補給小巷',
    intro: '辨認有小數點的數值，以及比較運算的結果。',
    rounds: [
      {
        prompt: '找出屬於 float（浮點數）的資料靶。',
        options: ['30', '"30.0"', '30.0'], correct: 2,
        hint: '沒有引號而寫成 30.0 的數值，即使小數位是 0，仍然是 float。',
        explanation: '30.0 是浮點數 float。30 屬於 int，"30.0" 仍是 str。',
      },
      {
        prompt: '哪個資料靶是 Python 的 bool（布林值）？',
        options: ['true', 'True', '"True"'], correct: 1,
        hint: 'Python 的兩個布林值是 True 和 False，首個字母必須大寫。',
        explanation: 'True 是布林值。小寫 true 並非 Python 的布林常數。',
      },
      {
        prompt: '在 Python 中，3 > 7 會得到甚麼結果？',
        options: ['False', 'True', '"False"'], correct: 0,
        hint: '比較結果是布林值。問自己「3 是否大過 7？」',
        explanation: '3 大過 7 的說法不成立，結果是布林值 False。',
      },
    ],
  },
  {
    name: '輸出訊息', tag: 'print()', icon: 'terminal', site: '廣播小廣場',
    intro: '先預測輸出，再打開控制台寫一行 Python。',
    rounds: [
      {
        prompt: '執行 print("READY") 時，畫面會顯示甚麼？',
        options: ['"READY"', 'print(READY)', 'READY'], correct: 2,
        hint: '引號用來標記字串；print() 會顯示字串的內容。',
        explanation: 'print("READY") 顯示 READY。現在試寫自己的訊息。',
        code: {
          instruction: '用 print() 顯示「出發」，請保留括號及字串的引號。',
          initial: '# 用 print() 顯示文字\n', expected: '出發', syntax: ['print'],
          hint: '可以寫 print("出發")。字串兩端用半形引號。',
        },
      },
      {
        prompt: 'score = 8。執行 print(score + 2) 會顯示甚麼？',
        options: ['10', '82', 'score + 2'], correct: 0,
        hint: 'Python 會先算括號內的整數加法，再顯示結果。',
        explanation: 'score 的值為 8，8 + 2 得到 10。',
        code: {
          instruction: '將變數 score 加 5，再用 print() 顯示結果。',
          initial: 'score = 8\n# 在下一行寫程式\n', expected: '13', syntax: ['print','score-add'],
          hint: '使用 print(score + 5)，讓 Python 讀取 score 後再相加。',
        },
      },
    ],
  },
  {
    name: '列表補給站', tag: 'list · index', icon: 'list', site: '補給倉',
    intro: '將多項資料放進列表，從索引 0 開始數。',
    rounds: [
      {
        prompt: '哪一個資料靶是由兩項資料組成的 Python list？',
        options: ['"水,地圖"', '["水", "地圖"]', '("水", "地圖")'], correct: 1,
        hint: '用方括號 [ ] 包住列表。項目用逗號分隔。',
        explanation: '["水", "地圖"] 是列表，圓括號寫的這個例子是 tuple。',
        code: {
          instruction: '建立包含「水」和「地圖」的列表 items，再用 print(items) 顯示整個列表。',
          initial: '# 建立 items，再輸出整個列表\n', expected: "['水', '地圖']", syntax: ['print','items-list'],
          hint: '先寫 items = ["水", "地圖"]，下一行寫 print(items)。',
        },
      },
      {
        prompt: 'items = ["水", "地圖", "指南針"]。items[0] 是哪一項？',
        options: ['地圖', '指南針', '水'], correct: 2,
        hint: '列表的第一項索引是 0，第二項索引是 1。',
        explanation: 'items[0] 取出列表的第一項「水」。',
        code: {
          instruction: '用索引取出 items 的第二項，並顯示它。',
          initial: 'items = ["水", "地圖", "指南針"]\n', expected: '地圖', syntax: ['print','items-index'],
          hint: '第二項的索引是 1，試用 print(items[1])。',
        },
      },
      {
        prompt: 'len(["水", "地圖", "指南針"]) 會傳回甚麼？',
        options: ['3', '2', '0'], correct: 0,
        hint: 'len() 計算整個列表有多少項。',
        explanation: '列表內有三項資料，len() 會傳回整數 3。',
      },
    ],
  },
  {
    name: '循環巡查', tag: 'for · range()', icon: 'loop', site: '石拱巡查區',
    intro: '用 for 逐個處理數字或列表項目。',
    rounds: [
      {
        prompt: 'for n in range(3) 依次會產生哪些數字？',
        options: ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3'], correct: 1,
        hint: 'range(3) 從 0 開始，到 3 之前停。',
        explanation: 'range(3) 讓迴圈跑三次，n 依次為 0、1、2。',
        code: {
          instruction: '用 for 和 range()，逐行顯示 0、1、2。',
          initial: 'for n in range(3):\n    # 在這裏用 print()\n', expected: '0\n1\n2', syntax: ['print','for-range'],
          hint: '在 for 下一行縮排四格，寫 print(n)。',
        },
      },
      {
        prompt: 'for item in ["水", "地圖"] 的第一次循環，item 的值是甚麼？',
        options: ['水', '地圖', '0'], correct: 0,
        hint: '直接遍歷列表時，item 每次會取得下一個項目的值。',
        explanation: '第一次取得「水」，第二次才是「地圖」。',
        code: {
          instruction: '用 for 遍歷 supplies，逐行顯示每項補給品。',
          initial: 'supplies = ["水", "地圖", "指南針"]\n', expected: '水\n地圖\n指南針', syntax: ['print','for-supplies'],
          hint: '寫 for item in supplies:，在下一行縮排四格後寫 print(item)。',
        },
      },
      {
        prompt: '若想在 for 迴圈內執行 print()，應怎樣處理那一行？',
        options: ['加引號', '放在 for 上面', '縮排'], correct: 2,
        hint: 'Python 用縮排辨認哪些指令屬於同一組。',
        explanation: '迴圈內的指令需要縮排。常用做法是縮排四個空格。',
      },
    ],
  },
  {
    name: '沙城最後挑戰', tag: '綜合練習', icon: 'flag', site: '內城出口',
    intro: '結合資料類型、列表和迴圈，完成最後的傳訊。',
    rounds: [
      {
        prompt: 'status = [False, 6, "開門"]。status[1] 屬於甚麼資料類型？',
        options: ['bool', 'str', 'int'], correct: 2,
        hint: '索引 1 是第二項，而這一項沒有引號或小數點。',
        explanation: 'status[1] 的值是 6，屬於 int。',
      },
      {
        prompt: '你要依序輸出清單內所有項目。先射中可放入控制台的正確迴圈開首。',
        options: ['for x in codes:', 'print(codes)', 'for codes:'], correct: 0,
        hint: 'for 後面是接收每一項的變數，in 後面是要遍歷的列表。',
        explanation: 'for x in codes: 可逐個讀取 codes，再用 print() 顯示每項。',
        code: {
          instruction: '建立含 6、8、10 的列表 codes，用 for 逐項把數字乘以 2，並逐行顯示結果。',
          initial: '# 建立 codes，再用 for 輸出每項的兩倍\n', expected: '12\n16\n20', syntax: ['print','codes-list','for-codes','double'],
          hint: '先寫 codes = [6, 8, 10]，再寫 for x in codes:。在縮排的下一行用 print(x * 2)。',
        },
      },
    ],
  },
];
