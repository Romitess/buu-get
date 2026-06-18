# 🖼️ Image Management System

เอกสารนี้อธิบายวิธีการใช้ Image Management System ที่ clean สำหรับทั้ง frontend

---

## 📋 Architecture Overview

```
Frontend (Vue Component)
         ↓
useImageUpload / useImageUrl (Composables)
         ↓
image.service.ts (Business Logic)
         ↓
platform-gateway (/api)
         ↓
Backend Storage
```

**Flow:**

- **Upload**: File → ImageUpload Component → image.service.ts → platform-gateway → return path → save to database
- **Display**: path from database → ImageDisplay Component → image.service.ts → getImageUrl() → platform-gateway → display image

---

## 🚀 ใช้งาน

### 1️⃣ Upload Rูป (ใช้ ImageUpload Component)

```vue
<template>
  <div>
    <!-- Upload และเก็บ imagePath -->
    <ImageUpload
      v-model="userProfile.profileImagePath"
      folder="profile"
      alt="User profile picture"
    />

    <!-- Submit form -->
    <q-btn label="Save" @click="submitProfile" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImageUpload from 'src/components/base/image-upload.vue';
import { userService } from 'src/services/user.service';

const userProfile = ref({
  name: '',
  profileImagePath: null, // ← imagePath เก็บไว้ใน DB
});

const submitProfile = async () => {
  // imagePath ถูก populate จาก ImageUpload component แล้ว
  await userService.updateProfile({
    name: userProfile.value.name,
    profileImagePath: userProfile.value.profileImagePath, // ← path จาก upload
  });
};
</script>
```

### 2️⃣ Display Rูป (ใช้ ImageDisplay Component)

```vue
<template>
  <div>
    <!-- Display รูปจาก database path -->
    <ImageDisplay
      :image-path="user.profileImagePath"
      alt="User profile"
      width="200px"
      height="200px"
      border-radius="50%"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImageDisplay from 'src/components/base/image-display.vue';

const user = ref({
  profileImagePath: '/uploads/profile/user-123.jpg', // ← imagePath จาก DB
});
</script>
```

### 3️⃣ Manual Upload (ใช้ Composable)

ถ้าต้องการ upload โดยไม่ใช้ component:

```typescript
import { useImageUpload } from 'src/composables/use-image-upload';

const { isUploading, uploadError, handleImageUpload } = useImageUpload({
  onSuccess: (imagePath: string) => {
    // imagePath ได้จาก platform-gateway
    console.log('Image uploaded:', imagePath);
    // ส่ง imagePath ไปบันทึก database ผ่าน backend service
  },
  onError: (error: Error) => {
    console.error('Upload failed:', error.message);
  },
});

// Upload รูป
const file = fileInputElement.files[0];
const uploadedPath = await handleImageUpload(file, 'profile');
// uploadedPath = '/uploads/profile/...' ← นี่คือ imagePath ที่ต้องเก็บ
```

### 4️⃣ Manual Display (ใช้ Service Function)

```typescript
import { getImageUrl } from 'src/services/image.service';

// imagePath ที่เก็บใน database
const imagePath = '/uploads/profile/user-123.jpg';

// สร้าง URL สำหรับแสดง
const displayUrl = getImageUrl(imagePath);
// displayUrl = '/api/uploads/profile/user-123.jpg' ← URL ใช้ใน <img :src>
```

---

## 📁 Files & Structure

```
src/
├── types/
│   └── image.ts                      # Type definitions
├── constants/
│   └── api.ts                        # API endpoints & constants
├── services/
│   └── image.service.ts              # Upload/Download logic
├── composables/
│   ├── use-image-upload.ts           # Upload composable
│   └── use-image-url.ts              # Display URL composable
└── components/base/
    ├── image-upload.vue              # Upload component
    └── image-display.vue             # Display component
```

---

## 🔧 Configuration

### Platform Gateway Endpoints

ตั้งค่าใน `src/constants/api.ts`:

```typescript
export const PLATFORM_GATEWAY = {
  BASE_PATH: '/api', // Base path
  UPLOAD_IMAGE: '/api/images/upload', // Upload endpoint
  GET_IMAGE: '/api/images', // Download endpoint
} as const;
```

### Image Configuration

```typescript
export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;
```

---

## 📋 Database Schema (Backend)

เมื่อบันทึกข้อมูลลง database ให้เก็บ **imagePath** ไม่ใช่ base64 หรือ full URL:

```sql
-- Example: User Profile Table
CREATE TABLE user_profiles (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255),
  profile_image_path VARCHAR(500),  -- ← เก็บ path เช่น '/uploads/profile/user-123.jpg'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## ✅ Best Practices

### DO ✅

```typescript
// ✅ เก็บ imagePath ใน database
await userService.updateProfile({
  profileImagePath: '/uploads/profile/user-123.jpg',  // path จาก upload
});

// ✅ ใช้ ImageUpload component สำหรับ upload
<ImageUpload v-model="user.profileImagePath" folder="profile" />

// ✅ ใช้ ImageDisplay component สำหรับ display
<ImageDisplay :image-path="user.profileImagePath" />

// ✅ ใช้ constants สำหรับ API paths
import { PLATFORM_GATEWAY } from 'src/constants/api';
```

### DON'T ❌

```typescript
// ❌ ห้าม hardcode platform-gateway path
const url = `/api/uploads/profile/${imagePath}`; // WRONG!

// ❌ ห้าม เก็บ base64 หรือ full URL ใน database
await userService.updateProfile({
  profileImagePath: 'data:image/png;base64,iVBORw0KG...', // WRONG!
});

// ❌ ห้าม ใช้ public folder
const imagePath = '/public/uploads/profile.jpg'; // WRONG!

// ❌ ห้าม hardcode endpoints
const response = await api.post('/api/images/upload', formData); // WRONG!
// ✅ ใช้ constants แทน
const response = await api.post(PLATFORM_GATEWAY.UPLOAD_IMAGE, formData);
```

---

## 🔄 Data Flow Example

### Upload Example

```
User selects image
         ↓
ImageUpload component
         ↓
useImageUpload() composable
         ↓
image.service.ts → uploadImage(file, folder)
         ↓
FormData → POST to platform-gateway
         ↓
platform-gateway returns: { path: '/uploads/profile/user-123.jpg' }
         ↓
ImageUpload component emits: update:modelValue = '/uploads/profile/user-123.jpg'
         ↓
Component updates: user.profileImagePath = '/uploads/profile/user-123.jpg'
         ↓
User submits form
         ↓
Backend saves: user_profiles.profile_image_path = '/uploads/profile/user-123.jpg'
```

### Display Example

```
User opens profile page
         ↓
Fetch user data from backend
         ↓
user.profileImagePath = '/uploads/profile/user-123.jpg' (from DB)
         ↓
ImageDisplay component receives: imagePath = '/uploads/profile/user-123.jpg'
         ↓
useImageUrl() composable
         ↓
image.service.ts → getImageUrl(imagePath)
         ↓
Returns: '/api/uploads/profile/user-123.jpg'
         ↓
<img :src="/api/uploads/profile/user-123.jpg" />
         ↓
Browser requests to platform-gateway
         ↓
platform-gateway returns image file
         ↓
Image displayed to user
```

---

## 🎨 Component Props

### ImageUpload Component

| Prop    | Type   | Default          | Description                         |
| ------- | ------ | ---------------- | ----------------------------------- |
| v-model | string | null             | imagePath ที่เก็บใน database        |
| folder  | string | undefined        | folder destination (e.g. 'profile') |
| alt     | string | 'Uploaded image' | alt text สำหรับรูป                  |

**Events:**

- `@update:modelValue` - emit เมื่อ imagePath เปลี่ยน

### ImageDisplay Component

| Prop         | Type   | Default | Description                  |
| ------------ | ------ | ------- | ---------------------------- |
| imagePath    | string | null    | imagePath ที่เก็บใน database |
| alt          | string | 'Image' | alt text สำหรับรูป           |
| width        | string | '100%'  | width ของรูป                 |
| height       | string | 'auto'  | height ของรูป                |
| objectFit    | string | 'cover' | CSS object-fit property      |
| borderRadius | string | '8px'   | border-radius                |

---

## 🐛 Troubleshooting

### Upload ล้มเหลว

```typescript
// Check error message
const { uploadError, handleImageUpload } = useImageUpload();
uploadError.value; // Show error to user
```

### รูปไม่แสดง

```typescript
// ตรวจสอบ imagePath
console.log(user.profileImagePath); // ต้องมีค่า path

// ตรวจสอบ URL
const { displayUrl } = useImageUrl(user.profileImagePath);
console.log(displayUrl.value); // ต้องเป็น '/api/...'
```

### CORS Issues

ตรวจสอบ platform-gateway ว่ารองรับ CORS headers

---

## 📚 References

- [Image Types](../types/image.ts)
- [API Constants](../constants/api.ts)
- [Image Service](../services/image.service.ts)
- [Upload Composable](../composables/use-image-upload.ts)
- [URL Composable](../composables/use-image-url.ts)
