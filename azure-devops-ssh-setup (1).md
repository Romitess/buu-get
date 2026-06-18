# วิธีเชื่อมต่อ Azure DevOps ของมหาวิทยาลัยบูรพา ด้วย SSH

> คู่มือนี้จะช่วยแก้ปัญหา `Authentication failed` เมื่อพยายาม Clone repository จาก Azure DevOps ของ BUU

---

## สิ่งที่ต้องมีก่อน

- [Git for Windows](https://git-scm.com/download/win) (ติดตั้งแล้ว)
- [VS Code](https://code.visualstudio.com/) (ติดตั้งแล้ว)
- บัญชี Azure DevOps ของมหาวิทยาลัยบูรพา (`xxxxxxx@go.buu.ac.th`)
- สิทธิ์เข้าถึง repository ที่ต้องการ clone (ถ้าไม่มีให้ติดต่อ admin ก่อน)

---

## ขั้นที่ 1: ลง Extension ใน VS Code

1. เปิด VS Code
2. กด `Ctrl+Shift+X` เพื่อเปิด Extensions
3. ค้นหา `Azure Repos`
4. ลง **Azure Repos** โดย Microsoft
5. กด **Reload** หรือรีสตาร์ท VS Code

---

## ขั้นที่ 2: สร้าง SSH Key (RSA)

> ⚠️ Azure DevOps ของ BUU รองรับเฉพาะ **RSA key เท่านั้น** ไม่รองรับ ed25519 หรือ ecdsa

1. เปิด **PowerShell** หรือ **Terminal** ใน VS Code (`Ctrl+\``)
2. รันคำสั่งต่อไปนี้ (เปลี่ยน `xxxxxxx` เป็นรหัสนิสิตของคุณ):

```powershell
ssh-keygen -t rsa -b 4096 -C "xxxxxxx@go.buu.ac.th" -f "$env:USERPROFILE\.ssh\id_rsa_buu"
```

3. กด `Enter` เพื่อข้าม passphrase (หรือใส่ถ้าต้องการความปลอดภัยเพิ่ม)
4. จะได้ไฟล์ 2 ไฟล์:
   - `id_rsa_buu` — Private key (ห้ามแชร์ให้ใคร)
   - `id_rsa_buu.pub` — Public key (เอาไปลงทะเบียน)

---

## ขั้นที่ 3: ตั้งค่า SSH Config

1. เปิดไฟล์ `C:\Users\<ชื่อผู้ใช้>\.ssh\config` ด้วย Notepad หรือ VS Code
   - ถ้าไฟล์ยังไม่มี ให้สร้างใหม่
2. เพิ่มข้อความต่อไปนี้ลงในไฟล์:

```
Host azure-devops-sv.buu.ac.th
  HostName azure-devops-sv.buu.ac.th
  User git
  IdentityFile ~/.ssh/id_rsa_buu
  IdentitiesOnly yes
  Port 22
```

3. บันทึกไฟล์

---

## ขั้นที่ 4: ลงทะเบียน SSH Public Key ใน Azure DevOps

1. เปิดเว็บเบราว์เซอร์แล้วเข้า `http://azure-devops-sv.buu.ac.th`
2. ล็อกอินด้วยบัญชี BUU ของคุณ
3. คลิก **รูปโปรไฟล์** ด้านบนขวามือ
4. เลือก **Security**
5. เลือก **SSH public keys** จากเมนูด้านซ้าย
6. กด **+ Add**
7. ตั้งชื่อ key เช่น `my-laptop` หรือ `windows-pc`
8. วาง Public key โดยดูค่าได้จากการรันคำสั่งนี้ใน PowerShell:

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_rsa_buu.pub"
```

9. คัดลอกทั้งบรรทัด (เริ่มด้วย `ssh-rsa AAAA...` จนถึง email)
10. วางลงในช่อง **Key Data** แล้วกด **Save**

> ✅ Key ที่ถูกต้องจะต้องขึ้นต้นด้วย `ssh-rsa` เท่านั้น

---

## ขั้นที่ 5: ทดสอบการเชื่อมต่อ

เปิด terminal แล้วรัน:

```cmd
ssh -T git@azure-devops-sv.buu.ac.th
```

**ผลลัพธ์ที่ถูกต้อง:**

```
remote: Shell access is not supported.
```

> แม้จะขึ้น error นี้ แต่หมายความว่า **SSH เชื่อมต่อสำเร็จแล้ว** นี่คือพฤติกรรมปกติของ Azure DevOps

**ถ้าได้:**

```
remote: Public key authentication failed.
```

> แปลว่า Public key ยังไม่ได้ลงทะเบียน หรือลงทะเบียนผิด key ให้กลับไปทำขั้นที่ 4 ใหม่

---

## ขั้นที่ 6: Clone Repository

```cmd
git clone ssh://azure-devops-sv.buu.ac.th:22/DefaultCollection/<ProjectName>/_git/<RepoName>
```

ตัวอย่าง:

```cmd
git clone ssh://azure-devops-sv.buu.ac.th:22/DefaultCollection/buu-get-front/_git/buu-get-front "d:\buu-get\buu-get-front"
```

---

## ปัญหาที่พบบ่อย

| ข้อความ Error                       | สาเหตุ                          | วิธีแก้                         |
| ----------------------------------- | ------------------------------- | ------------------------------- |
| `Authentication failed` (HTTP)      | ไม่มี credential / PAT หมดอายุ  | ใช้ SSH แทน HTTP                |
| `Public key authentication failed`  | ยังไม่ได้ลงทะเบียน key          | ทำขั้นที่ 4                     |
| `Invalid key: Key must be RSA type` | ใช้ ed25519 หรือ key ประเภทอื่น | สร้าง RSA key ใหม่ (ขั้นที่ 2)  |
| `Permission denied (publickey)`     | ใช้ key ผิดไฟล์                 | ตรวจสอบ SSH config (ขั้นที่ 3)  |
| `Connection refused`                | Port ผิด                        | ใช้ Port 22 และ `ssh://` ใน URL |

---

## ใช้ GitHub Copilot Agent ช่วยทำอัตโนมัติ

> ขั้นตอนบางส่วนสามารถให้ **GitHub Copilot Agent** ทำให้ได้เลย โดยพิมพ์ prompt ใน VS Code Chat (`Ctrl+Alt+I`)

### ✅ ขั้นที่ทำได้ผ่าน Copilot Agent

| ขั้นตอน | Prompt ที่ใช้ |
|---|---|
| ตรวจสอบว่ามี SSH key อยู่แล้วหรือยัง | `ตรวจสอบว่ามี SSH key อยู่ใน .ssh folder หรือยัง` |
| สร้าง RSA SSH key สำหรับ BUU | `สร้าง RSA SSH key ขนาด 4096 bit สำหรับ xxxxxxx@go.buu.ac.th บันทึกชื่อ id_rsa_buu` |
| ตั้งค่า SSH config | `เพิ่ม SSH config สำหรับ azure-devops-sv.buu.ac.th ให้ใช้ key id_rsa_buu port 22` |
| แสดง Public key เพื่อคัดลอก | `แสดง public key ของไฟล์ id_rsa_buu.pub` |
| ทดสอบการเชื่อมต่อ | `ทดสอบ SSH connection ไปที่ azure-devops-sv.buu.ac.th` |
| Clone repository | `clone repo buu-get-front จาก azure-devops-sv.buu.ac.th ไปที่ d:\buu-get\buu-get-front` |

### ❌ ขั้นที่ต้องทำเองเท่านั้น (ต้องใช้เว็บหรือ UI)

- **ขั้นที่ 1** — ลง Extension ใน VS Code (ต้องทำผ่าน Extensions panel)
- **ขั้นที่ 4** — ลงทะเบียน SSH Public Key บนเว็บ Azure DevOps (ต้องล็อกอินเว็บเอง)

### ตัวอย่าง Prompt เต็มรูปแบบ (ทำทีเดียวได้เลย)

คัดลอก prompt นี้วางใน Copilot Agent ได้เลย:

```
ฉันต้องการเชื่อมต่อ SSH กับ Azure DevOps ที่ azure-devops-sv.buu.ac.th
1. ตรวจสอบว่ามี SSH key อยู่ใน .ssh หรือยัง
2. ถ้าไม่มี ให้สร้าง RSA key 4096 bit ชื่อ id_rsa_buu สำหรับ xxxxxxx@go.buu.ac.th
3. เพิ่ม SSH config ให้ azure-devops-sv.buu.ac.th ใช้ key id_rsa_buu port 22
4. แสดง public key เพื่อให้ฉันนำไปลงทะเบียน
```

> 💡 เปลี่ยน `xxxxxxx` เป็นรหัสนิสิตของคุณก่อนใช้งาน

---

## หมายเหตุ

- SSH key ที่สร้างขึ้นมีอายุไม่หมด แต่ควรลงทะเบียน key ใหม่ถ้าเปลี่ยนเครื่อง
- ถ้าใช้หลายเครื่อง ให้สร้าง key ใหม่ในแต่ละเครื่อง แล้วลงทะเบียนทุก key ใน Azure DevOps
- Private key (`id_rsa_buu`) ห้ามแชร์ให้ใคร หรือ upload ขึ้น GitHub/GitLab เด็ดขาด
