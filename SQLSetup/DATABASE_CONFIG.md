# Hướng dẫn cấu hình Database

## 📍 Vị trí file cấu hình Database

**File cấu hình chính:** `src/config/database.js`

Đây là nơi bạn có thể thay đổi:
- Prefix của localStorage (`aptis_`)
- Version của database (`2.0.1`)
- Database mode (LocalStorage / SQL Server / API)
- Connection string cho SQL Server
- API endpoints cho Backend API
- Tên các bảng (tables)

## 🔧 Cấu hình hiện tại

### LocalStorage (Đang sử dụng)
```javascript
// File: src/config/database.js
export const LOCALSTORAGE_CONFIG = {
  prefix: 'aptis_',      // Tiền tố cho keys trong localStorage
  version: '2.0.1',      // Version của database
};
```

**Đường dẫn lưu trữ:** Browser's localStorage
- Key format: `aptis_<table_name>`
- Ví dụ: `aptis_users`, `aptis_sets`, `aptis_questions`

### SQL Server (Đã implement - sử dụng qua Backend API)
```javascript
// File: src/config/database.js
export const SQL_CONFIG = {
  connectionString: 'Server=localhost;Database=LuanVan;User Id=sa;Password=system!@#;...',
  // hoặc
  host: 'localhost',
  port: 1433,
  database: 'LuanVan',
  user: 'sa',
  password: 'system!@#'
};

// File: src/config/database.js
export const API_CONFIG = {
  baseUrl: 'http://localhost:5000/api',  // Backend API server
  endpoints: {
    users: '/users',
    sets: '/sets',
    questions: '/questions',
    // ...
  }
};

// Chuyển đổi mode:
export const CURRENT_DB_MODE = DB_MODE.API;  // Dùng SQL Server
// hoặc
export const CURRENT_DB_MODE = DB_MODE.LOCALSTORAGE;  // Dùng localStorage
```

## 📝 Các bảng (Tables) trong Database

Tất cả tên bảng được định nghĩa trong:
```javascript
// File: src/config/database.js
export const TABLE_NAMES = {
  users: 'users',
  sets: 'sets',
  setQuestions: 'set_questions',
  questions: 'questions',
  submissions: 'submissions',
  manualGrading: 'manual_grading',
  testResults: 'test_results',
  userProgress: 'user_progress',
  tips: 'tips',
  media: 'media',
  rubrics: 'rubrics',
  notifications: 'notifications',
  bookmarks: 'bookmarks',
  auditLogs: 'audit_logs',
  classes: 'classes',
  settingsSystem: 'settings_system',
  settingsUser: 'settings_user',
  meta: 'meta'
};
```

## 🎯 Cách sử dụng

### 1. Chọn Database Mode

#### Sử dụng SQL Server (Backend API):
```javascript
// File: src/config/database.js
export const CURRENT_DB_MODE = DB_MODE.API;

// Cần chạy Backend server:
// cd server
// npm install
// npm start
```

#### Sử dụng LocalStorage:
```javascript
// File: src/config/database.js
export const CURRENT_DB_MODE = DB_MODE.LOCALSTORAGE;
```

### 2. Setup SQL Server

**Bước 1:** Cài đặt Backend dependencies
```bash
cd server
npm install
```

**Bước 2:** Tạo database và tables
- Mở SQL Server Management Studio
- Tạo database `LuanVan` (nếu chưa có)
- Chạy file `public/aptis_schema.sql` để tạo tables

**Bước 3:** Chạy Backend server
```bash
npm run server
# hoặc
npm run server:dev
```

**Bước 4:** Test connection
- Mở: `http://localhost:5000/api/health`
- Nếu thành công sẽ thấy database info

**Chi tiết:** Xem file `SQL_SETUP.md`

### 3. Thay đổi Prefix localStorage
Nếu bạn muốn đổi prefix từ `aptis_` sang tên khác:
```javascript
// File: src/config/database.js
export const LOCALSTORAGE_CONFIG = {
  prefix: 'your_new_prefix_',  // Thay đổi ở đây
  version: '2.0.1',
};
```

### 4. Thay đổi Version
```javascript
// File: src/config/database.js
export const LOCALSTORAGE_CONFIG = {
  prefix: 'aptis_',
  version: '2.0.2',  // Tăng version khi có migration
};
```

### 5. Cấu hình SQL Connection
```javascript
// File: src/config/database.js
export const SQL_CONFIG = {
  host: 'localhost',           // Thay đổi nếu cần
  port: 1433,
  database: 'LuanVan',         // Tên database
  user: 'sa',                  // SQL Server user
  password: 'system!@#'        // SQL Server password
};

export const API_CONFIG = {
  baseUrl: 'http://localhost:5000/api',  // Backend API URL
};
```

### 6. Xem dữ liệu

#### LocalStorage:
Mở Browser DevTools (F12) → Application/Storage tab → Local Storage
- Bạn sẽ thấy các keys: `aptis_users`, `aptis_sets`, `aptis_questions`, etc.

#### SQL Server:
- Sử dụng SQL Server Management Studio
- Hoặc query qua Backend API: `GET http://localhost:5000/api/users`

### 7. Export/Import Database

**LocalStorage:**
- Sử dụng Database Manager trong Admin panel
- Export/Import dữ liệu ra file JSON

**SQL Server:**
- Export: Sử dụng SQL Server Management Studio → Tasks → Export Data
- Import: Chạy SQL script hoặc dùng Import Wizard

## 📂 Cấu trúc File

```
project/
├── src/
│   ├── config/
│   │   └── database.js          ← FILE CẤU HÌNH CHÍNH (sửa ở đây)
│   ├── utils/
│   │   ├── database.js          ← Main database class (hỗ trợ cả 2 modes)
│   │   └── sqlAdapter.js        ← SQL adapter (gọi Backend API)
│   └── components/
│       └── DatabaseManager.jsx  ← UI để quản lý database
├── server/
│   ├── index.js                 ← Backend API Server + SQL connection
│   ├── package.json             ← Backend dependencies
│   └── .env.example             ← Environment variables template
└── public/
    └── aptis_schema.sql         ← SQL schema file
```

## ⚠️ Lưu ý

1. **Không sửa `src/utils/database.js`** trừ khi thực sự cần thiết
2. **Tất cả cấu hình nên ở `src/config/database.js`**
3. **Backup dữ liệu trước khi thay đổi prefix** (vì sẽ tạo database mới)
4. **Backend server phải chạy** khi sử dụng SQL mode (`DB_MODE.API`)
5. **Database phải tồn tại** và có đầy đủ tables khi dùng SQL
6. **Kiểm tra browser console** nếu có lỗi khi thay đổi cấu hình
7. **CORS đã được enable** trên Backend để frontend có thể gọi API

## 🔍 Debug Database

### LocalStorage Mode:
```javascript
import db from './utils/database';

// Xem thông tin database
console.log(db.getDatabaseInfo());

// Xem tất cả dữ liệu
console.log(db.exportData());

// Kiểm tra localStorage
console.log(localStorage);
```

### SQL Mode (API):
```javascript
import db from './utils/database';
import sqlAdapter from './utils/sqlAdapter';

// Test connection
const health = await sqlAdapter.testConnection();
console.log('Database health:', health);

// Get users (async)
const users = await db.getUsers();
console.log('Users:', users);

// Check current mode
console.log('Current DB Mode:', db.mode);
console.log('Is SQL mode:', db.isSQL);
```

### Backend API Testing:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Get users
curl http://localhost:5000/api/users

# Get sets
curl http://localhost:5000/api/sets
```

## 🔄 Chuyển đổi giữa LocalStorage và SQL

### Chuyển sang SQL Server:
1. Đảm bảo Backend server đang chạy (`npm run server`)
2. Sửa `src/config/database.js`:
   ```javascript
   export const CURRENT_DB_MODE = DB_MODE.API;
   ```
3. Reload frontend

### Quay lại LocalStorage:
1. Sửa `src/config/database.js`:
   ```javascript
   export const CURRENT_DB_MODE = DB_MODE.LOCALSTORAGE;
   ```
2. Reload frontend

## 🐛 Troubleshooting

### Lỗi "Cannot connect to SQL Server"
- Kiểm tra SQL Server có đang chạy không
- Kiểm tra connection string trong `src/config/database.js`
- Kiểm tra firewall có block port 1433 không

### Lỗi "Network request failed"
- Đảm bảo Backend server đang chạy (`http://localhost:5000`)
- Kiểm tra CORS settings
- Kiểm tra API base URL trong `src/config/database.js`

### Lỗi "Table does not exist"
- Chạy file `public/aptis_schema.sql` để tạo tables
- Kiểm tra database name có đúng không

## 📚 Tài liệu tham khảo

- **File SQL Schema:** `public/aptis_schema.sql`
- **Database Documentation:** `DATABASE.md`
- **SQL Setup Guide:** `SQL_SETUP.md`
- **Configuration File:** `src/config/database.js`
- **Backend API Server:** `server/index.js`
- **SQL Adapter:** `src/utils/sqlAdapter.js`

