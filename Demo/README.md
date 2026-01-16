# Sto. Niño Student Access System - Demo Prototype

Ito ay isang **static at self-contained prototype** ng Sto. Niño Student Access System. Gumagamit ito ng mock API service at local storage, kaya hindi mo na kailangan ng backend database para mapatakbo ito.

## 🚀 Paano I-run
Pwede mong i-serve ang directory na ito gamit ang kahit anong static web server.

### Option 1: Python (Pinakamadali)
I-run ito sa project root:
```bash
python3 -m http.server --directory Demo 8080
```
Tapos buksan ang: `http://localhost:8080`

### Option 2: Node.js
```bash
npx serve Demo
```

---

## 🔑 Demo Login Credentials
Lahat ng accounts sa baba ay gumagamit ng **master password: `123`**

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@gmail.com` | `123` |
| **Teacher** | `teacher@gmail.com` | `123` |
| **Student** | `student@gmail.com` | `123` |
| **Applicant** | `applicant@gmail.com` | `123` |

### ✨ Special Features
- **Instant Signup:** Pwede kang gumawa ng bagong account sa "Create profile" link. Ang mga bagong account ay **auto-verified** at pwede nang i-login agad.
- **Master Password:** Ang password na `123` ay gagana sa **kahit anong** existing account dito sa demo.
- **Persistent Data:** Lahat ng changes na gagawin mo (pag-add ng assignments, grades, etc.) ay mase-save sa LocalStorage ng browser mo.

---
*Note: Demo prototype lang ito. Hindi naka-sync ang data nito sa actual production database.*
