const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const { TODO_MESSAGE_TYPES, CHAT_MESSAGE_TYPES } = require('./utils/constants.js');
const PORT = process.env.PORT || 8081;

// ---- 簡單靜態檔案伺服器（index.html）----
const server = http.createServer((req, res) => {
  // 如果是根路徑 → 回傳 public/index.html
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Server Error: ' + err.message);
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(data);
    });
    return;
  }

  // 其他靜態檔案
  if (req.url.startsWith('/utils/')) {
    const filePath = path.join(__dirname, req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=UTF-8' });
      res.end(data);
    });
    return;
  }

  if (req.url.startsWith('/public/')) {
    const filePath = path.join(__dirname, req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.css') contentType = 'text/css; charset=UTF-8';
      else if (ext === '.js') contentType = 'text/javascript; charset=UTF-8';
      else if (ext === '.html') contentType = 'text/html; charset=UTF-8';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  // 其他路徑 404
  res.writeHead(404);
  res.end('Not Found');
});

// ---- WebSocket 伺服器 ----
const wsServer = new WebSocket.Server({ server, path: '/ws' });

let todos = [];
let nextId = 1;


function broadcast(json, except = null) {
  const data = JSON.stringify(json);
  wsServer.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN && c !== except) {
      c.send(data);
    }
  });
}

// 保活機制：設定每個 client 的 isAlive，定期 ping
function heartbeat() { this.isAlive = true; }

wsServer.on('connection', (socket) => {
  socket.isAlive = true;
  socket.on('pong', heartbeat);

  // 預設名稱
  socket.username = "User" + Math.floor(Math.random() * 1000);


  console.log('[WS] client connected');
  // 初次連線 → 傳送目前 todos
  socket.send(JSON.stringify({ type: TODO_MESSAGE_TYPES.INIT, payload: { todos } }));

  socket.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, payload } = msg || {};

    // 防呆：沒有字串型別的 type 一律拒絕
    if (typeof type !== 'string') {
      console.warn('Bad message (no type):', msg);
      return;
    }

    switch (type) {
      // ToDo
      case TODO_MESSAGE_TYPES.ADD_TODO: {
        const text = (payload?.text || '').trim();
        if (!text) return;
        const todo = { id: nextId++, text, completed: false, createdAt: Date.now(), lockedBy: null };
        todos.push(todo);
        broadcast({ type: TODO_MESSAGE_TYPES.TODO_ADDED, payload: todo });
        break;
      }
      case TODO_MESSAGE_TYPES.TOGGLE_TODO: {
        const id = Number(payload?.id);
        const t = todos.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;
        broadcast({ type: TODO_MESSAGE_TYPES.TODO_UPDATED, payload: t });
        break;
      }
      case TODO_MESSAGE_TYPES.UPDATE_TODO: {
        const id = Number(payload?.id);
        const text = (payload?.text || '').trim();
        if (!id || !text) return;

        const t = todos.find(x => x.id === id);
        if (!t) return;

        t.text = text;
        // 記錄更新時間 updatedAt
        t.updatedAt = Date.now();

        // 廣播更新完成，讓所有客戶端覆蓋本地資料並 render()


        broadcast({ type: TODO_MESSAGE_TYPES.TODO_UPDATED, payload: t });
        break;
      }
      case TODO_MESSAGE_TYPES.DELETE_TODO: {
        const id = Number(payload?.id);
        todos = todos.filter(x => x.id !== id);
        broadcast({ type: TODO_MESSAGE_TYPES.TODO_DELETED, payload: { id } });
        break;
      }

      case TODO_MESSAGE_TYPES.DELETE_ALL_TODO: {
        todos.length = 0;

        broadcast({
          type: TODO_MESSAGE_TYPES.DELETE_ALL_TODO,
          payload: {}   // 不需要額外資料
        });
        break;
      }

      case TODO_MESSAGE_TYPES.LOCK_TODO: {
        const id = Number(payload?.id);
        const user = payload?.user || 'anonymous';
        const t = todos.find(x => x.id === id);
        if (!t) return;
        if (!t.lockedBy) {
          t.lockedBy = user;
          t.lockedAt = Date.now();
          broadcast({ type: TODO_MESSAGE_TYPES.TODO_LOCKED, payload: { id, user } });
        }
        break;
      }
      case TODO_MESSAGE_TYPES.UNLOCK_TODO: {
        const id = Number(payload?.id);
        const t = todos.find(x => x.id === id);
        if (!t) return;
        t.lockedBy = null;
        t.lockedAt = null;
        broadcast({ type: TODO_MESSAGE_TYPES.TODO_UNLOCKED, payload: { id } });
        break;
      }

      // ===================== Chat =====================
      // === 新增：設定使用者名稱 ===
      case CHAT_MESSAGE_TYPES.SET_USERNAME: {
        const name = String(payload?.username || '').trim();
        if (name) socket.username = name;
        console.log(`[WS] ${socket.username} set name`);
        break;
      }

      case CHAT_MESSAGE_TYPES.NEW_USER: {
        // 通知其他人有人加入（排除自己）
        broadcast({
          type: CHAT_MESSAGE_TYPES.NEW_USER,
          payload: { username: socket.username }   // 加上 username
        }, socket);
        break;
      }

      case CHAT_MESSAGE_TYPES.NEW_MESSAGE: {
        const message = String(payload?.message || '').trim();
        if (!message) return;
        // 廣播給其他人（不包含自己）
        broadcast({
          type: CHAT_MESSAGE_TYPES.NEW_MESSAGE,
          payload: { message, username: socket.username }   // 加上 username
        }, socket);
        break;
      }


      default:
        break;
    }
  });

  socket.on('close', () => console.log('[WS] client disconnected'));
  socket.on('error', (err) => { console.error('WS error:', err.message); });
});

// 每 30 秒 ping 一次，清理失聯 clients
const interval = setInterval(() => {
  wsServer.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(); // 觸發對方回 pong
  });
}, 30000);

wsServer.on('close', () => clearInterval(interval));


// ---- 啟動 ----
const port = PORT || process.env.PORT || 8081;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});