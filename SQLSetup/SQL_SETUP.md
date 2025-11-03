# Hướng dẫn Setup SQL Server cho APTIS KEYS

## 📋 Tổng quan

Project hiện hỗ trợ 2 modes database:
1. **LocalStorage** - Lưu trữ trên browser (mặc định)
2. **SQL Server** - Kết nối qua Backend API

## 🚀 Các bước Setup SQL Server

### Bước 1: Cài đặt Dependencies

Vào thư mục `server` và cài đặt packages:

```bash
cd server
npm install
```

Packages cần thiết:
- `express` - Web server
- `mssql` - SQL Server driver
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variables

### Bước 2: Tạo Database và Tables

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối với SQL Server
3. Tạo database mới (nếu chưa có):
   ```sql
   CREATE DATABASE LuanVan;
   ```
4. Chạy file SQL schema để tạo tables:
   - File: `public/aptis_schema.sql`
   - Hoặc copy nội dung và chạy trong SSMS

### Bước 3: Cấu hình Connection

File cấu hình: `src/config/database.js`

Cấu hình SQL đã được setup sẵn:
```javascript
export const SQL_CONFIG = {
  host: 'localhost',
  port: 1433,
  database: 'LuanVan',
  user: 'sa',
  password: 'system!@#'
};
```

Nếu cần thay đổi, sửa trong file `src/config/database.js`

### Bước 4: Bật SQL Mode

File: `src/config/database.js`

Thay đổi mode từ LocalStorage sang API:
```javascript
// Từ
export const CURRENT_DB_MODE = DB_MODE.LOCALSTORAGE;

// Thành
export const CURRENT_DB_MODE = DB_MODE.API;
```

### Bước 5: Chạy Backend Server

```bash
cd server
npm start
```

Hoặc chạy với watch mode (tự động restart khi có thay đổi):
```bash
npm run dev
```

Server sẽ chạy trên: `http://localhost:5000`

### Bước 6: Test Connection

Mở browser và vào:
```
http://localhost:5000/api/health
```

Nếu kết nối thành công, bạn sẽ thấy:
```json
{
  "status": "ok",
  "database": "LuanVan",
  "version": "SQL Server version..."
}
```

## 📁 Cấu trúc Files

```
project/
├── server/              # Backend API Server
│   ├── index.js         # Express server + SQL connection
│   ├── package.json     # Backend dependencies
│   └── .env.example     # Environment variables template
├── src/
│   ├── config/
│   │   └── database.js # Database configuration
│   └── utils/
│       ├── database.js  # Main database class (support cả 2 modes)
│       └── sqlAdapter.js # SQL adapter (gọi API)
└── public/
    └── aptis_schema.sql # SQL schema file
```

## 🔧 API Endpoints

Backend cung cấp các endpoints sau:

### Users
- `GET /api/users` - Lấy tất cả users
- `GET /api/users/:id` - Lấy user theo ID
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Sets
- `GET /api/sets` - Lấy tất cả sets
- `GET /api/sets/:id` - Lấy set theo ID
- `POST /api/sets` - Tạo set mới
- `PUT /api/sets/:id` - Cập nhật set
- `DELETE /api/sets/:id` - Xóa set

### Questions
- `GET /api/questions` - Lấy tất cả questions
- `GET /api/questions/:id` - Lấy question theo ID
- `POST /api/questions` - Tạo question mới
- `PUT /api/questions/:id` - Cập nhật question
- `DELETE /api/questions/:id` - Xóa question

### Tips
- `GET /api/tips` - Lấy tất cả tips
- `POST /api/tips` - Tạo tip mới
- `PUT /api/tips/:id` - Cập nhật tip
- `DELETE /api/tips/:id` - Xóa tip

### Media
- `GET /api/media` - Lấy tất cả media
- `POST /api/media` - Upload media
- `DELETE /api/media/:id` - Xóa media

### Set Questions
- `GET /api/sets/:setId/questions` - Lấy questions trong set
- `POST /api/sets/:setId/questions` - Thêm question vào set
- `DELETE /api/set-questions/:id` - Xóa question khỏi set

## 🔄 Chuyển đổi giữa LocalStorage và SQL

### Để dùng SQL Server:
1. Đảm bảo Backend server đang chạy
2. Sửa `src/config/database.js`:
   ```javascript
   export const CURRENT_DB_MODE = DB_MODE.API;
   ```
3. Reload frontend

### Để quay lại LocalStorage:
1. Sửa `src/config/database.js`:
   ```javascript
   export const CURRENT_DB_MODE = DB_MODE.LOCALSTORAGE;
   ```
2. Reload frontend

## ⚠️ Lưu ý

1. **Backend phải chạy** khi dùng SQL mode
2. **Database phải tồn tại** và có đầy đủ tables
3. **Connection string** phải đúng trong `src/config/database.js`
4. **CORS** đã được enable trên backend để frontend có thể gọi API
5. Tất cả operations từ `database.js` tự động switch giữa localStorage và SQL

## 🐛 Troubleshooting

### Lỗi "Cannot connect to SQL Server"
- Kiểm tra SQL Server có đang chạy không
- Kiểm tra connection string trong `src/config/database.js`
- Kiểm tra firewall có block port 1433 không

### Lỗi "Network request failed"
- Đảm bảo backend server đang chạy (`http://localhost:5000`)
- Kiểm tra CORS settings
- Kiểm tra API base URL trong `src/config/database.js`

### Lỗi "Table does not exist"
- Chạy lại file `public/aptis_schema.sql` để tạo tables
- Kiểm tra database name có đúng không

## 📝 Notes

- Frontend code (`database.js`) đã được update để support async operations
- Tất cả components vẫn dùng `db` như bình thường, không cần thay đổi
- SQL adapter tự động convert data format giữa frontend và backend

