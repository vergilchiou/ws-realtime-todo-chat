(function (global) {
  const TODO_MESSAGE_TYPES = {
    INIT: 'INIT',
    ADD_TODO: 'ADD_TODO',
    TODO_ADDED: 'TODO_ADDED',
    TOGGLE_TODO: 'TOGGLE_TODO',
    // 用於「用戶請求更新」
    UPDATE_TODO: 'UPDATE_TODO',
    // 用於「伺服器廣播已更新」
    TODO_UPDATED: 'TODO_UPDATED', // text edit
    DELETE_TODO: 'DELETE_TODO',
    TODO_DELETED: 'TODO_DELETED',
    DELETE_ALL_TODO: 'DELETE_ALL_TODO',
    // 🔒 鎖定相關
    LOCK_TODO: 'LOCK_TODO',
    UNLOCK_TODO: 'UNLOCK_TODO',
    TODO_LOCKED: 'TODO_LOCKED',
    TODO_UNLOCKED: 'TODO_UNLOCKED',
  };


  const CHAT_MESSAGE_TYPES = {
    NEW_USER: 'NEW_USER',
    NEW_MESSAGE: 'NEW_MESSAGE',
    SET_USERNAME: 'SET_USERNAME',
  };


  // const PORT = 8081;
  const PORT = (typeof module !== 'undefined' && module.exports)
    ? (process.env.PORT || 8081)
    : undefined;


  // Browser
  global.CHAT_CONSTANTS = { TODO_MESSAGE_TYPES, CHAT_MESSAGE_TYPES };
  // Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TODO_MESSAGE_TYPES, CHAT_MESSAGE_TYPES, PORT };
  }
})(typeof window !== 'undefined' ? window : global);