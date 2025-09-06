# WebSocket Realtime To-Do List + Chat Room

A realtime collaborative **to-do list** and **chat room** built with **Node.js** and **WebSockets**.  
一個使用 Node.js + WebSocket 打造的 **多人即時同步待辦清單與聊天室** 小專案。

---

## 🚀 Features

### 📝 To-Do List
- 即時同步：多人同時操作，任務即時更新
- 基本操作：
  - 新增任務
  - 編輯任務
  - 勾選 / 取消完成
  - 刪除單筆任務
  - 刪除全部任務  

### 💬 Chat Room
- 多人聊天室：即時傳送與接收訊息
- 系統提示：顯示新使用者加入聊天室
- 安全輸入：使用者訊息自動防止 XSS

### 🎨 UI
- Bootstrap 5 + 原生 JS，無需額外前端框架
- 響應式版面，To-Do 與 Chat 並排顯示

---

## 🛠️ Tech Stack

- **Backend**: Node.js, WebSocket (`ws`)  
- **Frontend**: HTML, CSS, Vanilla JavaScript, Bootstrap 5  
- **Deployment**: Render (Web Service)

---

## 📦 Installation

1. Clone repo:
   ```bash
   git clone https://github.com/你的帳號/realtime-todo.git
   cd realtime-todo
   ```

2. Install dependencies:
  ```bash
  npm install
  ```

3. Start server:
  ```bash
  npm start
  ```

4. Open browser and visit:
  ```bash
  http://localhost:8081
  ```  

## 🔮 Future Improvements

- 支援使用者暱稱（顯示誰發的訊息）
- 儲存訊息與待辦至資料庫（持久化）
- 聊天室多房間功能（不同群組 / 主題）
- 新增登入系統，支援不同使用者權限
- 優化 UI/UX（深色模式、自訂主題）
<!-- 📸 Screenshot (Optional) -->
<!-- (放一張 To-Do + Chat Room 並排的畫面截圖在這裡) -->
