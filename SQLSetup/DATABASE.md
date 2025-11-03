# APTIS KEYS Database Documentation

## Tổng quan

APTIS KEYS sử dụng localStorage làm database chính để lưu trữ dữ liệu cho hệ thống học tiếng Anh APTIS. Database được thiết kế để hỗ trợ nghiệp vụ "luyện APTIS: học theo bộ đề – câu hỏi – mock test, nộp/lưu tiến độ, chấm điểm, mẹo học, media".

## Cấu trúc Database

### 1. Thông tin Database
- **Prefix**: `aptis_`
- **Version**: `2.0.1` (Updated for APTIS Learning System with Enhanced Features)
- **Storage**: localStorage (có thể nâng cấp lên IndexedDB)
- **Encoding**: JSON
- **Target**: Học tiếng Anh APTIS với đầy đủ 4 kỹ năng

### 2. Các Bảng (Tables)

#### 2.1. Users Table (`aptis_users`)
Lưu trữ thông tin người dùng với bảo mật nâng cao

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| email | String | Email đăng nhập |
| passwordHash | String | Mật khẩu đã hash |
| passwordSalt | String | Salt cho password |
| name | String | Tên hiển thị |
| role | String | Vai trò (admin/teacher/student) |
| avatarUrl | String | URL avatar hoặc null |
| emailVerified | Boolean | Email đã xác thực |
| failedLoginCount | Number | Số lần đăng nhập sai |
| lockedUntil | String | Khóa đến khi nào |
| resetToken | String | Token reset password |
| resetTokenExp | String | Token hết hạn khi nào |
| createdAt | String | Ngày tạo (ISO) |
| lastLogin | String | Lần đăng nhập cuối |
| isActive | Boolean | Trạng thái hoạt động |

**Sample Data:**
```json
{
  "id": 1,
  "email": "admin@aptis.com",
  "passwordHash": "sha256_hash_here",
  "passwordSalt": "random_salt",
  "name": "Administrator",
  "role": "admin",
  "avatarUrl": null,
  "emailVerified": true,
  "failedLoginCount": 0,
  "lockedUntil": null,
  "resetToken": null,
  "resetTokenExp": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": null,
  "isActive": true
}
```

#### 2.2. Sets Table (`aptis_sets`)
Lưu trữ các bộ đề thi APTIS với hỗ trợ Mock Test

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| name | String | Tên bộ đề |
| type | String | Loại (SkillPractice/MockTest) |
| skills | Array | Danh sách kỹ năng (Reading/Listening/Speaking/Writing/GrammarVocabulary) |
| status | String | Trạng thái (published/draft) |
| difficulty | String | Độ khó (easy/medium/hard) |
| timeLimit | Number | Thời gian giới hạn (phút) |
| targetLevel | String | Mức độ mục tiêu (A2/B1/B2/C1/C2) |
| visibility | String | Hiển thị (public/private) |
| authorId | Number | ID người tạo |
| createdAt | String | Ngày tạo |
| updatedAt | String | Ngày cập nhật |

**Sample Data:**
```json
{
  "id": 10,
  "name": "Mock Test B1 - 01",
  "type": "MockTest",
  "skills": ["Reading", "Listening", "Speaking", "Writing", "GrammarVocabulary"],
  "status": "published",
  "difficulty": "medium",
  "timeLimit": 60,
  "targetLevel": "B1",
  "visibility": "public",
  "authorId": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 2.3. Set Questions Table (`aptis_set_questions`)
Bảng nối giữa Sets và Questions với thông tin chi tiết

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| setId | Number | ID bộ đề |
| questionId | Number | ID câu hỏi |
| order | Number | Thứ tự trong bộ đề |
| weight | Number | Trọng số điểm |
| section | String | Phần thi (Reading/Listening/Speaking/Writing) |
| shuffle | Boolean | Có xáo trộn không |

**Sample Data:**
```json
{
  "id": 1001,
  "setId": 10,
  "questionId": 501,
  "order": 1,
  "weight": 1,
  "section": "Reading",
  "shuffle": true
}
```

#### 2.4. Questions Table (`aptis_questions`)
Lưu trữ câu hỏi trong ngân hàng câu hỏi APTIS với cấu trúc chuẩn

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| title | String | Tiêu đề câu hỏi |
| skill | String | Kỹ năng (Reading/Listening/Speaking/Writing/GrammarVocabulary) |
| type | String | Loại câu hỏi (mcq_single/mcq_multi/fill_blank/ordering/drag_drop/writing_prompt/speaking_prompt) |
| context | String | Đoạn văn/transcript/hình ảnh cho Reading/Listening |
| stem | String | Nội dung câu hỏi |
| options | Array | Các lựa chọn với cấu trúc chuẩn |
| explain | String | Giải thích đáp án |
| mediaIds | Array | ID các file media liên quan |
| score | Number | Điểm số |
| tags | Array | Tags phân loại |
| difficulty | String | Độ khó |
| createdAt | String | Ngày tạo |
| updatedAt | String | Ngày cập nhật |

**Sample Data:**
```json
{
  "id": 501,
  "title": "Reading Passage 1 - Q1",
  "skill": "Reading",
  "type": "mcq_single",
  "context": "Read the following passage about climate change...",
  "stem": "Which statement is true?",
  "options": [
    {"id": "A", "text": "Option A", "isCorrect": true, "explain": "A is correct because..."},
    {"id": "B", "text": "Option B", "isCorrect": false, "explain": "B is incorrect because..."},
    {"id": "C", "text": "Option C", "isCorrect": false, "explain": "C is incorrect because..."}
  ],
  "explain": "A is correct because the passage clearly states...",
  "mediaIds": [77],
  "score": 1,
  "tags": ["comprehension"],
  "difficulty": "medium",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

#### 2.5. Submissions Table (`aptis_submissions`) - MỚI
Lưu trữ các lần thi/làm bài của học viên

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người dùng |
| setId | Number | ID bộ đề |
| status | String | Trạng thái (in_progress/submitted/graded) |
| seed | Number | Seed random cho xáo trộn |
| settingsSnapshot | Object | Cấu hình khi thi |
| startedAt | String | Thời gian bắt đầu |
| submittedAt | String | Thời gian nộp bài |
| timeSpent | Number | Thời gian làm (giây) |
| answers | Array | Các câu trả lời chi tiết |
| autoScore | Number | Điểm tự động |
| manualScore | Number | Điểm thủ công |
| totalScore | Number | Tổng điểm |
| attemptCount | Number | Số lần thi lại |

**Sample Data:**
```json
{
  "id": 9001,
  "userId": 3,
  "setId": 10,
  "status": "submitted",
  "seed": 12345,
  "settingsSnapshot": {"shuffle": true, "timeLimit": 60},
  "startedAt": "2025-01-20T08:00:00Z",
  "submittedAt": "2025-01-20T08:50:00Z",
  "timeSpent": 3000,
  "answers": [
    {"questionId": 501, "answerIds": ["A"], "isCorrect": true, "timeSpent": 35},
    {"questionId": 502, "answerIds": ["B"], "isCorrect": false, "timeSpent": 42}
  ],
  "autoScore": 15,
  "manualScore": 8,
  "totalScore": 23,
  "attemptCount": 2
}
```

#### 2.6. Manual Grading Table (`aptis_manual_grading`) - MỚI
Lưu trữ điểm thủ công cho Writing/Speaking

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| submissionId | Number | ID submission |
| questionId | Number | ID câu hỏi |
| rubricId | Number | ID rubric |
| scores | Object | Điểm theo từng tiêu chí |
| comment | String | Nhận xét |
| gradedBy | Number | ID người chấm |
| gradedAt | String | Thời gian chấm |

**Sample Data:**
```json
{
  "id": 7001,
  "submissionId": 9001,
  "questionId": 801,
  "rubricId": 100,
  "scores": {"grammar": 3, "vocabulary": 4, "coherence": 3, "pronunciation": 0},
  "comment": "Good structure; watch articles.",
  "gradedBy": 1,
  "gradedAt": "2025-01-20T09:00:00Z"
}
```

#### 2.7. Tips Table (`aptis_tips`)
Lưu trữ mẹo học và hướng dẫn APTIS

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| title | String | Tiêu đề mẹo |
| skill | String | Kỹ năng áp dụng |
| content | String | Nội dung mẹo |
| status | String | Trạng thái (published/draft) |
| priority | Number | Độ ưu tiên (1-5) |
| authorId | Number | ID tác giả |
| slug | String | URL slug |
| publishAt | String | Thời gian xuất bản |
| coverImageUrl | String | URL ảnh bìa |
| createdAt | String | Ngày tạo |
| updatedAt | String | Ngày cập nhật |

**Sample Data:**
```json
{
  "id": 11,
  "title": "Reading – Skimming/Scanning",
  "skill": "Reading",
  "content": "Here are effective strategies for reading comprehension...",
  "status": "published",
  "priority": 3,
  "authorId": 1,
  "slug": "reading-skimming",
  "publishAt": "2025-01-05T00:00:00Z",
  "coverImageUrl": null,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-02T00:00:00Z"
}
```

#### 2.8. Media Table (`aptis_media`)
Lưu trữ file media cho APTIS với metadata đầy đủ

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| name | String | Tên file |
| type | String | Loại file (audio/image/video) |
| mime | String | MIME type |
| size | Number | Kích thước file (bytes) |
| url | String | URL hoặc blob URL |
| checksum | String | Checksum để tránh trùng |
| duration | Number | Thời lượng (giây) |
| ownerId | Number | ID người sở hữu |
| usage | String | Mục đích sử dụng (question/option/prompt) |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "id": 77,
  "name": "listening_01.mp3",
  "type": "audio",
  "mime": "audio/mpeg",
  "size": 1024000,
  "url": "blob:...",
  "checksum": "sha1:...",
  "duration": 150,
  "ownerId": 1,
  "usage": "question",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### 2.9. Test Results Table (`aptis_test_results`) - NÂNG CẤP
Lưu trữ kết quả bài thi với breakdown theo kỹ năng

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người dùng |
| setId | Number | ID bộ đề |
| submissionId | Number | ID submission |
| score | Number | Tổng điểm |
| totalQuestions | Number | Tổng số câu |
| correctAnswers | Number | Số câu đúng |
| timeSpent | Number | Thời gian làm (giây) |
| sectionScores | Object | Điểm theo từng kỹ năng |
| completedAt | String | Thời gian hoàn thành |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "id": 9501,
  "userId": 3,
  "setId": 10,
  "submissionId": 9001,
  "score": 23,
  "totalQuestions": 40,
  "correctAnswers": 28,
  "timeSpent": 3000,
  "sectionScores": {"reading": 6, "listening": 5, "writing": 6, "speaking": 6, "gv": 0},
  "completedAt": "2025-01-20T08:50:00Z",
  "createdAt": "2025-01-20T08:50:01Z"
}
```

#### 2.10. User Progress Table (`aptis_user_progress`) - NÂNG CẤP
Lưu trữ tiến độ học với liên kết submission

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người dùng |
| setId | Number | ID bộ đề |
| questionId | Number | ID câu hỏi |
| submissionId | Number | ID submission |
| isCorrect | Boolean | Trả lời đúng |
| timeSpent | Number | Thời gian làm (giây) |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "id": 12001,
  "userId": 3,
  "setId": 10,
  "questionId": 501,
  "submissionId": 9001,
  "isCorrect": true,
  "timeSpent": 35,
  "createdAt": "2025-01-20T08:10:00Z"
}
```

#### 2.11. Notifications Table (`aptis_notifications`) - NÂNG CẤP
Lưu trữ thông báo với userId và readAt

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người dùng |
| type | String | Loại thông báo (success/error/info/warning) |
| title | String | Tiêu đề |
| message | String | Nội dung |
| readAt | String | Thời gian đọc (null nếu chưa đọc) |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "id": 3001,
  "userId": 3,
  "type": "success",
  "title": "Bài đã được chấm",
  "message": "Mock Test B1 - 01 đã có điểm.",
  "readAt": null,
  "createdAt": "2025-01-20T09:05:00Z"
}
```

#### 2.12. Rubrics Table (`aptis_rubrics`) - MỚI
Lưu trữ tiêu chí chấm điểm cho Writing/Speaking

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| title | String | Tên rubric |
| skill | String | Kỹ năng áp dụng (Writing/Speaking) |
| criteria | Array | Tiêu chí chấm điểm |
| createdAt | String | Ngày tạo |
| updatedAt | String | Ngày cập nhật |

**Sample Data:**
```json
{
  "id": 100,
  "title": "Writing B1 Rubric",
  "skill": "Writing",
  "criteria": [
    {
      "key": "grammar",
      "label": "Grammar & Accuracy",
      "max": 5,
      "weight": 0.3,
      "descLevels": [
        "5: Excellent grammar, very few errors",
        "4: Good grammar, minor errors",
        "3: Adequate grammar, some errors",
        "2: Poor grammar, many errors",
        "1: Very poor grammar, frequent errors"
      ]
    },
    {
      "key": "vocabulary",
      "label": "Vocabulary Range",
      "max": 5,
      "weight": 0.25,
      "descLevels": [
        "5: Wide range, appropriate use",
        "4: Good range, mostly appropriate",
        "3: Adequate range",
        "2: Limited range",
        "1: Very limited range"
      ]
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### 2.13. Audit Logs Table (`aptis_audit_logs`) - MỚI
Lưu trữ log thay đổi để debug và tracking

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người thực hiện |
| action | String | Hành động (create/update/delete) |
| target | String | Bảng đích (aptis_questions, aptis_sets, etc.) |
| targetId | Number | ID record bị thay đổi |
| payload | Object | Dữ liệu thay đổi |
| createdAt | String | Thời gian thực hiện |

**Sample Data:**
```json
{
  "id": 1,
  "userId": 1,
  "action": "update_question",
  "target": "aptis_questions",
  "targetId": 501,
  "payload": { "title": "Updated question title" },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### 2.14. Bookmarks Table (`aptis_bookmarks`) - MỚI
Lưu trữ câu hỏi và bộ đề yêu thích của học viên

| Field | Type | Description |
|-------|------|-------------|
| id | Number | ID duy nhất |
| userId | Number | ID người dùng |
| questionId | Number | ID câu hỏi (optional) |
| setId | Number | ID bộ đề (optional) |
| note | String | Ghi chú cá nhân |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "id": 1,
  "userId": 3,
  "questionId": 501,
  "setId": null,
  "note": "Review this later",
  "createdAt": "2025-01-20T08:10:00Z"
}
```

#### 2.15. Settings Tables - TÁCH RIÊNG
Hệ thống cài đặt được tách thành 2 bảng

**System Settings (`aptis_settings_system`):**
```json
{
  "timeDefault": 30,
  "shuffleDefault": true,
  "allowReviewDefault": true,
  "languageDefault": "vi",
  "themeDefault": "light"
}
```

**User Settings (`aptis_settings_user`):**
```json
{
  "userId": 3,
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "autoSave": true
}
```

#### 2.16. Meta Information Table (`aptis_meta`) - MỚI
Lưu trữ thông tin metadata của database

| Field | Type | Description |
|-------|------|-------------|
| version | String | Phiên bản database |
| migratedAt | String | Thời gian migrate cuối |
| totalKeys | Number | Tổng số keys trong localStorage |
| lastBackupAt | String | Thời gian backup cuối |
| createdAt | String | Ngày tạo |

**Sample Data:**
```json
{
  "version": "2.0.1",
  "migratedAt": "2025-01-20T10:00:00Z",
  "totalKeys": 12,
  "lastBackupAt": "2025-01-20T09:00:00Z",
  "createdAt": "2025-01-01T00:00:00Z"
}
```


## Quan hệ giữa các bảng

### 1. Users ↔ Sets
- Một user có thể làm nhiều sets
- Một set có thể được làm bởi nhiều users
- Qua bảng Submissions

### 2. Sets ↔ Questions (Many-to-Many)
- Qua bảng Set Questions với thông tin chi tiết
- Một set chứa nhiều questions với order, weight, section
- Một question có thể thuộc nhiều sets

### 3. Users ↔ Questions
- Qua bảng User Progress và Submissions
- Một user có thể làm nhiều questions
- Một question có thể được làm bởi nhiều users

### 4. Submissions ↔ Test Results
- Một submission tạo ra một test result
- Test Results chứa breakdown điểm theo kỹ năng

### 5. Submissions ↔ Manual Grading
- Một submission có thể có nhiều manual grading
- Cho Writing/Speaking questions

### 6. Users ↔ Notifications
- Một user có nhiều notifications
- Notifications có userId và readAt

### 7. Media ↔ Questions
- Một question có thể có nhiều media files
- Media có usage field để phân loại

### 8. Submissions ↔ Rubrics
- Một submission có thể có nhiều manual grading
- Manual grading liên kết với rubric

### 9. Users ↔ Bookmarks
- Một user có thể có nhiều bookmarks
- Bookmarks có thể là questions hoặc sets

### 10. Audit Logs ↔ All Tables
- Audit logs track tất cả thay đổi
- Liên kết với user thực hiện action

## API Functions

### Database Management
```javascript
import db from './utils/database';

// Lấy thông tin database
db.getDatabaseInfo();

// Export dữ liệu
db.exportData();

// Import dữ liệu
db.importData(data);

// Xóa toàn bộ database
db.clearDatabase();
```

### Users Operations
```javascript
// Lấy tất cả users
const users = db.getUsers();

// Lấy user theo ID
const user = db.getUserById(1);

// Lấy user theo email
const user = db.getUserByEmail('admin@aptis.com');

// Thêm user mới
const newUser = db.addUser({
  email: 'new@aptis.com',
  password: 'password123',
  name: 'New User',
  role: 'user'
});

// Cập nhật user
const updatedUser = db.updateUser(1, {
  name: 'Updated Name'
});

// Xóa user
db.deleteUser(1);
```

### Sets Operations
```javascript
// Lấy tất cả sets
const sets = db.getSets();

// Lấy set theo ID
const set = db.getSetById(1);

// Thêm set mới
const newSet = db.addSet({
  name: 'Mock Test B1 - 02',
  type: 'MockTest',
  skills: ['Reading', 'Listening', 'Speaking', 'Writing'],
  status: 'draft',
  difficulty: 'medium',
  timeLimit: 60,
  targetLevel: 'B1',
  visibility: 'public',
  authorId: 1
});

// Thêm câu hỏi vào set
db.addQuestionToSet({
  setId: 1,
  questionId: 501,
  order: 1,
  weight: 1,
  section: 'Reading',
  shuffle: true
});

// Lấy câu hỏi trong set
const setQuestions = db.getSetQuestions(1);

// Cập nhật set
const updatedSet = db.updateSet(1, {
  name: 'Updated Set Name'
});

// Xóa set
db.deleteSet(1);
```

### Submissions Operations (MỚI)
```javascript
// Tạo submission mới
const submission = db.createSubmission({
  userId: 3,
  setId: 10,
  settingsSnapshot: {shuffle: true, timeLimit: 60}
});

// Cập nhật câu trả lời
db.updateSubmissionAnswer(submissionId, {
  questionId: 501,
  answerIds: ['A'],
  timeSpent: 35
});

// Nộp bài
db.submitSubmission(submissionId);

// Lấy submissions của user
const userSubmissions = db.getUserSubmissions(userId);

// Lấy submission theo ID
const submission = db.getSubmissionById(submissionId);
```

### Manual Grading Operations (MỚI)
```javascript
// Tạo manual grading
const grading = db.addManualGrading({
  submissionId: 9001,
  questionId: 801,
  rubricId: 100,
  scores: {grammar: 3, vocabulary: 4},
  comment: 'Good work!',
  gradedBy: 1
});

// Lấy manual grading
const gradings = db.getManualGradings(submissionId);
```

### Rubrics Operations (MỚI)
```javascript
// Lấy tất cả rubrics
const rubrics = db.getRubrics();

// Lấy rubric theo skill
const writingRubrics = db.getRubricsBySkill('Writing');

// Thêm rubric mới
const newRubric = db.addRubric({
  title: 'Speaking B2 Rubric',
  skill: 'Speaking',
  criteria: [
    {
      key: 'fluency',
      label: 'Fluency',
      max: 5,
      weight: 0.3,
      descLevels: ['5: Very fluent', '4: Fluent', '3: Adequate', '2: Hesitant', '1: Very hesitant']
    }
  ]
});

// Cập nhật rubric
const updatedRubric = db.updateRubric(100, {
  title: 'Updated Rubric Title'
});
```

### Audit Logs Operations (MỚI)
```javascript
// Lấy audit logs
const logs = db.getAuditLogs();

// Lấy logs theo user
const userLogs = db.getAuditLogsByUser(userId);

// Lấy logs theo target
const questionLogs = db.getAuditLogsByTarget('aptis_questions');

// Thêm audit log
db.addAuditLog({
  userId: 1,
  action: 'create_question',
  target: 'aptis_questions',
  targetId: 501,
  payload: { title: 'New question' }
});
```

### Bookmarks Operations (MỚI)
```javascript
// Lấy bookmarks của user
const userBookmarks = db.getUserBookmarks(userId);

// Thêm bookmark
const bookmark = db.addBookmark({
  userId: 3,
  questionId: 501,
  note: 'Review this later'
});

// Xóa bookmark
db.deleteBookmark(bookmarkId);

// Lấy bookmarks theo type
const questionBookmarks = db.getBookmarksByType(userId, 'question');
const setBookmarks = db.getBookmarksByType(userId, 'set');
```

### Meta Operations (MỚI)
```javascript
// Lấy meta info
const meta = db.getMetaInfo();

// Cập nhật version
db.updateMetaInfo({
  version: '2.0.1',
  migratedAt: new Date().toISOString()
});

// Cập nhật backup time
db.updateLastBackupTime();
```

### Questions Operations
```javascript
// Lấy tất cả questions
const questions = db.getQuestions();

// Lấy question theo ID
const question = db.getQuestionById(1);

// Lấy questions theo skill
const readingQuestions = db.getQuestionsBySkill('Reading');

// Thêm question mới
const newQuestion = db.addQuestion({
  title: 'New Question',
  skill: 'Reading',
  type: 'mcq_single',
  stem: 'Question content...',
  options: [
    { id: "A", text: "Answer A", isCorrect: true, explain: "A is correct because..." },
    { id: "B", text: "Answer B", isCorrect: false, explain: "B is incorrect because..." },
    { id: "C", text: "Answer C", isCorrect: false, explain: "C is incorrect because..." }
  ],
  score: 1,
  tags: ['vocabulary'],
  difficulty: 'medium'
});

// Cập nhật question
const updatedQuestion = db.updateQuestion(1, {
  title: 'Updated Question Title'
});

// Xóa question
db.deleteQuestion(1);
```

### Tips Operations
```javascript
// Lấy tất cả tips
const tips = db.getTips();

// Lấy tip theo ID
const tip = db.getTipById(1);

// Thêm tip mới
const newTip = db.addTip({
  title: 'Reading Tips',
  skill: 'Reading',
  content: 'Here are some reading tips...',
  status: 'published',
  priority: 3
});

// Cập nhật tip
const updatedTip = db.updateTip(1, {
  title: 'Updated Tip Title'
});

// Xóa tip
db.deleteTip(1);
```

### Media Operations
```javascript
// Lấy tất cả media
const media = db.getMedia();

// Thêm media mới
const newMedia = db.addMedia({
  name: 'audio1.mp3',
  type: 'audio',
  size: 1024000,
  url: 'blob:...',
  duration: '2:30'
});

// Xóa media
db.deleteMedia(1);
```

### Settings Operations
```javascript
// Lấy settings
const settings = db.getSettings();

// Cập nhật settings
const updatedSettings = db.updateSettings({
  time: 45,
  shuffle: false,
  theme: 'dark'
});
```

### Notifications Operations
```javascript
// Lấy tất cả notifications
const notifications = db.getNotifications();

// Thêm notification mới
const newNotification = db.addNotification({
  type: 'success',
  title: 'Success',
  message: 'Operation completed successfully'
});

// Đánh dấu đã đọc
db.markNotificationAsRead(1);

// Xóa notification
db.deleteNotification(1);
```

### User Progress Operations
```javascript
// Lấy progress của user
const progress = db.getUserProgress(1);

// Thêm progress mới
const newProgress = db.addUserProgress({
  userId: 1,
  setId: 1,
  questionId: 1,
  isCorrect: true,
  timeSpent: 30,
  attempts: 1
});
```

### Test Results Operations
```javascript
// Lấy kết quả test của user
const results = db.getTestResults(1);

// Thêm kết quả test mới
const newResult = db.addTestResult({
  userId: 1,
  setId: 1,
  score: 85,
  totalQuestions: 20,
  correctAnswers: 17,
  timeSpent: 1800,
  completedAt: new Date().toISOString()
});
```

## Lưu ý quan trọng

### 1. Data Persistence
- Tất cả dữ liệu được lưu trong localStorage
- Dữ liệu sẽ mất khi user xóa browser data
- Nên implement backup/restore functionality

### 2. Security
- Mật khẩu được lưu dạng plain text (chỉ dành cho demo)
- Trong production nên hash password
- Không lưu sensitive data trong localStorage

### 3. Performance
- localStorage có giới hạn dung lượng (~5-10MB)
- Nên implement data compression cho large datasets
- Consider using IndexedDB cho large applications

### 4. Data Validation
- Luôn validate data trước khi lưu
- Implement data migration cho version updates
- Backup data trước khi thay đổi schema

## Migration & Versioning

### Database Version
- Current version: 1.0.0
- Tự động migrate khi có version mới
- Backup data trước khi migrate

### Schema Changes
- Thêm field mới: backward compatible
- Xóa field: cần migration script
- Thay đổi type: cần conversion logic

## Best Practices cho APTIS Learning System

### 1. **Security & Authentication**
- Luôn hash password với salt
- Implement rate limiting cho login
- Validate email format và password strength
- Session timeout cho security

### 2. **Data Integrity**
- Validate question options structure
- Validate question options có ít nhất 1 đúng
- Check media file integrity với checksum
- Backup trước khi migrate schema

### 3. **Performance cho APTIS**
- Lazy load media files (audio/video)
- Implement pagination cho large question sets
- Cache frequently accessed data
- Optimize localStorage usage

### 4. **User Experience**
- Auto-save progress trong submissions
- Real-time notifications cho grading
- Progress tracking với detailed analytics
- Offline support cho practice mode

### 5. **Grading System**
- Separate auto-scoring và manual grading
- Rubric-based scoring cho Writing/Speaking
- Detailed feedback cho learners
- Grade history và analytics

### 6. **Content Management**
- Version control cho questions
- Media optimization (compress audio/images)
- Content approval workflow
- Bulk operations cho large datasets

### 7. **Analytics & Reporting**
- Track learning progress theo skills
- Performance analytics
- Weakness identification
- Personalized recommendations

## Troubleshooting

### Common Issues
1. **localStorage quota exceeded**: Implement data cleanup
2. **Data corruption**: Use backup/restore
3. **Version conflicts**: Clear and reinitialize
4. **Performance issues**: Optimize queries, implement pagination

### Debug Tools
```javascript
// Check database info
console.log(db.getDatabaseInfo());

// Export data for inspection
console.log(db.exportData());

// Check localStorage usage
console.log(JSON.stringify(localStorage).length);
```

## APTIS-Specific Features

### 1. **Skill-Based Learning**
- Reading: Comprehension, vocabulary, grammar
- Listening: Audio comprehension, note-taking
- Speaking: Pronunciation, fluency, coherence
- Writing: Structure, grammar, vocabulary
- Grammar & Vocabulary: Mixed practice

### 2. **Level Progression**
- A2: Basic level
- B1: Intermediate level  
- B2: Upper-intermediate level
- C1: Advanced level
- C2: Proficiency level

### 3. **Question Types**
- **MCQ Single**: Multiple choice, single answer
- **MCQ Multi**: Multiple choice, multiple answers
- **Fill Blank**: Complete sentences
- **Ordering**: Arrange in correct order
- **Drag Drop**: Drag and drop interface
- **Writing Prompt**: Essay writing
- **Speaking Prompt**: Audio recording

### 4. **Assessment Features**
- **Auto-scoring**: For objective questions
- **Manual grading**: For Writing/Speaking
- **Rubric-based**: Detailed scoring criteria
- **Section scores**: Breakdown by skill
- **Time tracking**: Per question and overall

### 5. **Learning Analytics**
- **Progress tracking**: Per skill and overall
- **Weakness identification**: Areas to improve
- **Performance trends**: Over time
- **Personalized recommendations**: Based on performance

### 6. **Content Management**
- **Media support**: Audio, images, videos
- **Context passages**: For Reading/Listening
- **Transcripts**: For audio content
- **Explanations**: Detailed answer explanations

## Migration từ v1.0.0 sang v2.0.0

### 1. **Backup Current Data**
```javascript
const backup = db.exportData();
localStorage.setItem('aptis_backup_v1', JSON.stringify(backup));
```

### 2. **Schema Migration**
```javascript
// Migrate users
const oldUsers = db.get('users');
const newUsers = oldUsers.map(user => ({
  ...user,
  passwordHash: hashPassword(user.password),
  passwordSalt: generateSalt(),
  emailVerified: true,
  failedLoginCount: 0,
  lockedUntil: null,
  resetToken: null,
  resetTokenExp: null
}));
db.set('users', newUsers);

// Migrate sets
const oldSets = db.get('sets');
const newSets = oldSets.map(set => ({
  ...set,
  type: 'SkillPractice',
  skills: [set.skill],
  targetLevel: 'B1',
  visibility: 'public',
  authorId: 1
}));
db.set('sets', newSets);
```

### 3. **Create New Tables**
```javascript
// Initialize new tables
db.set('set_questions', []);
db.set('submissions', []);
db.set('manual_grading', []);
db.set('settings_system', {
  timeDefault: 30,
  shuffleDefault: true,
  allowReviewDefault: true,
  languageDefault: 'vi',
  themeDefault: 'light'
});
```

### 4. **Update Database Version**
```javascript
const dbInfo = db.get('db_info');
dbInfo.version = '2.0.0';
dbInfo.migratedAt = new Date().toISOString();
db.set('db_info', dbInfo);
```
