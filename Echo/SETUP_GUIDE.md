# Setup Guide para sa Sto. Niño Student Access System

Ang guide na ito ay nagbibigay ng step-by-step instructions para i-set up at patakbuhin ang Sto. Niño Portal project mula sa fresh clone o fork.

## Mga Kinakailangan (Prerequisites)

- **Node.js**: Siguraduhing naka-install ang Node.js (v18 o mas mataas) at `npm`.
- **Git**: Para i-clone ang repository.

## 1. Installation

Buksan ang iyong terminal sa project root directory at i-run ang sumusunod na command para i-install ang lahat ng dependencies (frontend at backend):

```bash
npm install
```

I-iinstall nito ang mga sumusunod:
- React/Vite dependencies (Frontend)
- Express/SQLite dependencies (Backend)
- `xlsx`, `file-saver` (para sa Admin Exports)
- `nodemailer`, `multer` (para sa Email at File Uploads)

## 2. Database Initialization

Gumagamit ang system ng local SQLite database (`db.sqlite`). Kailangan mo itong i-seed ng initial data (tables, admin user, etc.) bago patakbuhin ang app.

I-run ang seed script:

```bash
node backend/seed.js
```

Dapat may makita kang output na nag-iindicate na na-create na ang tables at na-seed na ang users.

## 3. Pagpapatakbo ng Application (Running the App)

Para i-start pareho ang Backend (API) at Frontend (React) servers nang sabay, gamitin ang provided shell script:

```bash
chmod +x run-all.sh  # Siguraduhing executable ang script (kailangan lang gawin once)
./run-all.sh
```

- **Frontend:** I-access sa `http://localhost:3000` (o 3001/3002 kung busy ang ports).
- **Backend API:** Tumatakbo sa `http://localhost:3001`.

## 4. Default Credentials

Ang seed script ay nagki-create ng mga sumusunod na default accounts para sa testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `123` |
| **Teacher** | `teacher@gmail.com` | `123` |
| **Student** | `student@gmail.com` | `123` |

## Troubleshooting

- **"Address already in use":** Kung mag-fail ang script dahil taken na ang ports 3000/3001, patayin (kill) ang existing node processes o i-restart ang iyong terminal.
- **Database Errors:** Kung may makita kang DB errors, subukang i-delete ang `db.sqlite` at i-run ulit ang `node backend/seed.js` para mag-reset.
- **File Uploads:** Ang mga uploaded files ay naka-store sa `uploads/` directory. Siguraduhing nag-eexist ang folder na ito at writable (automatiko itong ginagawa ng server).

## Deployment Note

Ito ay development setup. Para sa production:
- Gumamit ng robust database (PostgreSQL/MySQL).
- I-set up ang environment variables (`.env`) para sa Email credentials (`EMAIL_USER`, `EMAIL_PASS`).
- I-build ang frontend (`npm run build`) at i-serve ang static files gamit ang Nginx o ang Express backend.