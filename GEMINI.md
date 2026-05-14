# 🛠 Project Standardization & Development Guidelines

เอกสารฉบับนี้กำหนดมาตรฐานการพัฒนาสำหรับโปรเจกต์ (Quasar + NestJS + MySQL) เพื่อให้ทีมพัฒนาทำงานไปในทิศทางเดียวกัน มีคุณภาพโค้ดที่ดี และง่ายต่อการขยับขยาย (Scalability)

---

## 1. 📂 Project Structure

### 🟢 Backend (NestJS)

เราใช้โครงสร้างแบบ **Modular Architecture** แยกความรับผิดชอบตามฟีเจอร์ (Feature-based)

```text
src/

├── common/ # Logic ที่ใช้ร่วมกัน (Decorators, Filters, Guards, Interceptors)

├── config/ # Configuration & Environment Variables

├── database/ # Database related (Migrations, Seeds, Providers)

├── modules/ # Feature Modules (หัวใจหลักของ Business Logic)

│ ├── auth/ # Authentication Module (Login, Register, JWT)

│ ├── users/ # User Management Module

│ │ ├── dto/ # Data Transfer Objects (Request Validation)

│ │ ├── entities/ # Database Entities (MySQL Schemas)

│ │ ├── users.controller.ts

│ │ ├── users.service.ts

│ │ └── users.module.ts

│ └── [feature-name]/ # โครงสร้างเดียวกันสำหรับฟีเจอร์ใหม่

├── main.ts # Entry Point ของแอปพลิเคชัน

└── app.module.ts # Root Module สำหรับรวบรวมทุกโมดูล

```

### 🔵 Frontend (Quasar Framework - Vue 3)

เราใช้ Composition API (`<script setup>`) และระบบจัดการ State ด้วย **Pinia**

```text

src/

├── assets/ # Static assets (Images, Fonts)

├── boot/ # Client-side initialization (Axios, I18n, Plugins)

├── components/ # Reusable UI Components

│ ├── base/ # Global Components (Buttons, Inputs)

│ └── [feature]/ # Components เฉพาะของแต่ละ Feature

├── composables/ # Shared Logic / Hooks (Composition API)

├── css/ # Global styles (Sass/SCSS)

├── layouts/ # Layout templates

├── pages/ # Routing Pages (Views)

├── router/ # Route definitions

├── stores/ # State Management (Pinia)

├── types/ # TypeScript Interfaces & Types

└── utils/ # Helper Functions

```

---

## 2. 🔤 Naming Conventions (มาตรฐานการตั้งชื่อ)

| Target                | Convention       | Example                             |
| --------------------- | ---------------- | ----------------------------------- |
| Folders               | kebab-case       | user-profile/, auth-service/        |
| Files                 | kebab-case       | user-controller.ts, main-layout.vue |
| Classes / Interfaces  | PascalCase       | UserService, UserInterface          |
| Variables / Functions | camelCase        | getUserById, isLoading              |
| Database Tables       | UPPER_SNAKE_CASE | USER_PROFILES , ORDERS              |

---

## 3. 💾 Database Standards (MySQL)

- **ORM:** บังคับใช้ Migration เท่านั้นในการเปลี่ยนแปลงโครงสร้าง Database ห้ามแก้ไขผ่าน UI (เช่น phpMyAdmin/DBeaver) โดยตรง

- **Common Columns:** ทุก Table ควรมี `id`, `created_at`, `updated_at` และ `deleted_at` (สำหรับ Soft Delete)

---

## 4. 📝 Coding Standards & Quality

### 4.1 TypeScript

- **ห้ามใช้ `any` ทุกกรณี** — กำหนด Type หรือ Interface ให้ชัดเจนเสมอ
- **ใช้ `interface` สำหรับ Object Shape** และ `type` สำหรับ Union / Intersection
- **ห้าม Implicit Return Type** ในฟังก์ชันที่มี Logic ซับซ้อน — ระบุ Return Type ให้ชัดเจน

typescript

```typescript
// ❌ ห้ามทำ
const getUser = async (id) => { ... }

// ✅ ถูกต้อง
const getUser = async (id: number): Promise<UserResponseDto> => { ... }
```

---

### 4.2 Backend — NestJS Layer Responsibilities

แต่ละ Layer มีหน้าที่ที่แน่นอน ห้ามปนกัน:

| Layer          | หน้าที่                                                  | ห้าม                                               |
| -------------- | -------------------------------------------------------- | -------------------------------------------------- |
| **Controller** | รับ Request, Validate Input, เรียก Service, ส่ง Response | เขียน Business Logic                               |
| **Service**    | Business Logic ทั้งหมด, เรียก Repository/ORM             | เรียก Controller อื่น, เข้าถึง HTTP Request โดยตรง |
| **Entity**     | กำหนด Schema ของ Database                                | ใส่ Business Logic                                 |
| **DTO**        | กำหนดรูปแบบ Input/Output และ Validation                  | ใส่ Logic หรือ Method                              |

**ตัวอย่างที่ถูกต้อง:**

typescript

```typescript
// ✅ Controller — รับ request แล้วส่งต่อ Service
@Post()
async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
  return this.usersService.create(dto);
}

// ✅ Service — Business Logic อยู่ที่นี่เท่านั้น
async create(dto: CreateUserDto): Promise<UserResponseDto> {
  const existingUser = await this.usersRepository.findOne({ where: { email: dto.email } });
  if (existingUser) throw new ConflictException('Email already in use');
  const user = this.usersRepository.create(dto);
  return this.usersRepository.save(user);
}
```

---

### 4.3 Frontend — เมื่อใดควรสร้าง Store หรือเรียก Service โดยตรง

> **หลักการ:** สร้าง Pinia Store เฉพาะเมื่อ **State นั้นจำเป็นต้องถูกแชร์หรือคงอยู่ข้ามหลาย Component** เท่านั้น หากข้อมูลถูกใช้ใน Component เดียวหรือ Page เดียว ให้เรียก Service โดยตรงใน Composable หรือ Page แทน

#### Decision Framework: Store vs Service โดยตรง

ใช้ Flowchart ด้านล่างในการตัดสินใจ:

```
ข้อมูล/State ที่ต้องจัดการ
        │
        ▼
┌───────────────────────────────────────┐
│ ข้อมูลนี้ถูกใช้ใน Component/Page      │
│ มากกว่า 1 จุด ที่ไม่ใช่ Parent-Child? │
└───────────────────────────────────────┘
        │
   ใช่  │                    ไม่ใช่
        ▼                        ▼
┌──────────────┐        ┌─────────────────────────┐
│ State นี้    │        │  เรียก Service โดยตรง   │
│ ต้อง persist │        │  ใน Composable หรือ Page │
│ ข้าม route? │        └─────────────────────────┘
└──────────────┘
        │
   ใช่  │                    ไม่ใช่
        ▼                        ▼
┌──────────────┐        ┌──────────────────────────┐
│ สร้าง Store  │        │ ใช้ Composable ที่มี      │
│ (Pinia)      │        │ local ref/reactive ก็พอ   │
└──────────────┘        └──────────────────────────┘
```

#### เกณฑ์ตัดสินใจ (ฉบับรวดเร็ว)

| เงื่อนไข                                     | แนะนำ              |
| -------------------------------------------- | ------------------ |
| ข้อมูล User ที่ Login อยู่ (ใช้ทั้งแอป)      | ✅ Store           |
| Cart / ตะกร้าสินค้า (ใช้หลาย Page)           | ✅ Store           |
| การตั้งค่า Theme / Locale (Global)           | ✅ Store           |
| List ข้อมูลที่ต้อง sync กันหลาย Component    | ✅ Store           |
| Fetch ข้อมูลเพื่อแสดงใน Page เดียว           | ❌ ไม่ต้องทำ Store |
| Form ที่ Submit แล้วจบ                       | ❌ ไม่ต้องทำ Store |
| Modal / Dialog ที่ manage state ภายใน        | ❌ ไม่ต้องทำ Store |
| Dropdown options ที่ใช้เฉพาะ Component เดียว | ❌ ไม่ต้องทำ Store |

#### ตัวอย่าง: ❌ ไม่ควรสร้าง Store (ใช้ Composable แทน)

typescript

```typescript
// composables/use-product-list.ts
// ข้อมูลนี้ใช้แค่ใน ProductListPage — ไม่จำเป็นต้อง Store
export function useProductList() {
  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchProducts = async () => {
    isLoading.value = true;
    try {
      products.value = await productService.getAll();
    } catch (e) {
      error.value = 'Failed to load products';
    } finally {
      isLoading.value = false;
    }
  };

  return { products, isLoading, error, fetchProducts };
}
```

vue

```vue
<!-- pages/product-list-page.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useProductList } from 'src/composables/use-product-list';

const { products, isLoading, fetchProducts } = useProductList();
onMounted(fetchProducts);
</script>
```

#### ตัวอย่าง: ✅ ควรสร้าง Store (State ที่ใช้ทั่วทั้งแอป)

typescript

```typescript
// stores/auth.store.ts
// ข้อมูล User ถูกใช้หลาย Component เช่น Navbar, Guard, Profile Page
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null);
  const isAuthenticated = computed(() => !!currentUser.value);

  const login = async (credentials: LoginDto) => {
    const user = await authService.login(credentials);
    currentUser.value = user;
  };

  const logout = () => {
    currentUser.value = null;
  };

  return { currentUser, isAuthenticated, login, logout };
});
```

---

### 4.4 Frontend — Composable Guidelines

- แยก Logic ที่ใช้ซ้ำออกไปไว้ใน Composables เสมอ ห้ามเขียน Logic ซับซ้อนใน `<script setup>` โดยตรง
- Composable ควรตั้งชื่อขึ้นต้นด้วย `use` เสมอ เช่น `useAuth`, `useProductList`
- Composable หนึ่งตัวควรมีหน้าที่เดียว (Single Responsibility)
- Composable ที่เรียก API ควรจัดการ `isLoading` และ `error` state ด้วยเสมอ

typescript

```typescript
// ✅ โครงสร้าง Composable มาตรฐาน
export function useFeatureName() {
  // 1. State
  const data = ref<Type | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 2. Computed
  const hasData = computed(() => !!data.value);

  // 3. Methods
  const fetchData = async () => { ... };

  // 4. Expose เฉพาะสิ่งที่ต้องการให้ Component ใช้
  return { data, isLoading, error, hasData, fetchData };
}
```

---

### 4.5 Frontend — Styling Guidelines

- **ห้ามทำ Style inline (Inline Styles):** ห้ามใช้ `style="..."` ใน template ให้ใช้ CSS Classes หรือ Utility Classes ของ Quasar แทน
- **ใช้ Quasar Variables ก่อนเสมอ:** พยายามใช้ CSS Variables หรือ Utility Classes ของ Quasar (เช่น `text-primary`, `bg-secondary`, `q-pa-md`) ก่อนที่จะเขียน Custom CSS ของตัวเอง

---

### 4.6 Linting & Formatting

- ใช้ **ESLint** และ **Prettier** ตามที่โปรเจกต์กำหนด
- **ก่อน Commit ทุกครั้ง** ต้องรัน `npm run lint` เพื่อตรวจสอบความถูกต้อง
- ห้าม Commit โค้ดที่มี Lint Error เด็ดขาด

---

## 5. 🌿 Git Workflow

### 5.1 Conventional Commits

เราใช้รูปแบบการ Commit เพื่อให้ง่ายต่อการทำ Changelog:

| Prefix             | การใช้งาน                               | ตัวอย่าง                                                |
| ------------------ | --------------------------------------- | ------------------------------------------------------- |
| `feat(scope):`     | เพิ่มฟีเจอร์ใหม่                        | `feat(users): add create user endpoint`                 |
| `fix(scope):`      | แก้ Bug                                 | `fix(auth): fix token expiration issue`                 |
| `refactor(scope):` | ปรับปรุงโค้ดโดยไม่เปลี่ยนความสามารถเดิม | `refactor(orders): extract order validation to service` |
| `docs(scope):`     | งานเอกสาร                               | `docs(readme): update setup instructions`               |

---

### 5.2 Pre-commit Hook Setup (Husky + lint-staged)

เราใช้ **Husky** จัดการ Git Hooks และ **lint-staged** เพื่อรัน lint เฉพาะไฟล์ที่ถูก `git add` ไว้เท่านั้น (ไม่รันทั้งโปรเจกต์) ทำให้ commit เร็วและมั่นใจว่าโค้ดที่ push ขึ้นไปผ่าน lint เสมอ

> ต้องทำขั้นตอนนี้ทั้ง **Backend** และ **Frontend** repo แยกกัน

#### ขั้นตอนที่ 1 — ติดตั้ง Package

bash

```bash
npm install --save-dev husky lint-staged
npx husky init
```

คำสั่ง `husky init` จะสร้างโฟลเดอร์ `.husky/` และไฟล์ `.husky/pre-commit` ให้อัตโนมัติ

#### ขั้นตอนที่ 2 — เพิ่ม `prepare` script ใน `package.json`

เพื่อให้ทุกคนในทีม `clone` repo แล้วรัน `npm install` ปุ๊บ Husky ติดตั้งอัตโนมัติทันที:

json

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

#### ขั้นตอนที่ 3 — Config `lint-staged` ใน `package.json`

**🟢 Backend (NestJS):**

json

```json
{
  "lint-staged": {
    "src/**/*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

**🔵 Frontend (Quasar):**

json

```json
{
  "lint-staged": {
    "src/**/*.{ts,vue}": ["eslint --fix", "prettier --write"]
  }
}
```

#### ขั้นตอนที่ 4 — แก้ไขไฟล์ `.husky/pre-commit`

bash

```bash
npx lint-staged
```

#### ขั้นตอนที่ 5 — ติดตั้ง commitlint สำหรับ Validate Commit Message

เพื่อบังคับให้ทุก Commit ตรงตาม Conventional Commits format ใน 5.1:

bash

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

สร้างไฟล์ `commitlint.config.js` ที่ root ของโปรเจกต์:

js

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

สร้าง hook `.husky/commit-msg`:

bash

```bash
npx --no -- commitlint --edit $1
```

#### ผลลัพธ์เมื่อรัน `git commit`

```
git commit -m "feat(users): add create user endpoint"
        │
        ▼
[commit-msg hook] commitlint ตรวจ format ของ commit message
        │
   ✅ ผ่าน
        │
        ▼
[pre-commit hook] lint-staged ตรวจเฉพาะไฟล์ที่ git add ไว้
        │
   ✅ ผ่าน                      ❌ ไม่ผ่าน
        │                              │
        ▼                              ▼
  Commit สำเร็จ         Commit ถูกยกเลิก — แก้ Error ก่อน
```

---

## 6. 🔌 API Documentation

ระบบ Backend จะ Generate **Swagger UI** อัตโนมัติ

สามารถเข้าใช้งานได้ที่: `{BASE_URL}/api/docs` ในโหมด **Development เท่านั้น**
