# Sto. Niño Student Access System

Isang comprehensive na school management portal na dine-design para sa Sto. Niño Elementary School. Ang system na ito ay nagpo-provide ng unified platform para sa mga students, teachers, at administrators upang ma-manage ang academic records, attendance, at communications.

## Mga Features

### 🎓 Para sa mga Estudyante (Students)
*   **Digital Student ID:** View your official ID na may dynamically generated QR code para sa verification.
*   **Grades (SF9):** I-check ang iyong report card at academic performance.
*   **Attendance:** I-monitor ang iyong daily attendance records.
*   **Clearance:** I-track ang iyong clearance status para sa school year.
*   **Profile Management:** I-update ang iyong personal information at profile picture.

### 👩‍🏫 Para sa mga Guro at Faculty
*   **Class Registry (SF1):** I-manage ang student masterlists at enrollment.
*   **Grading System:** Mag-input at mag-manage ng student grades.
*   **Attendance Sheet:** Mag-record ng daily attendance para sa mga klase.
*   **Student Submissions:** I-review at gradohan ang mga assignments ng students.
*   **Email Broadcast:** Mag-send ng official announcements at alerts sa mga parents/guardians via email.

### 🛡️ Para sa mga Administrators
*   **User Management:** Mag-create, approve, at mag-manage ng user accounts at roles.
*   **Database Forge:** Direct access upang i-view at i-manage ang database tables.
*   **Facilities:** I-manage ang school facilities at ang kanilang status.
*   **System Logs:** I-monitor ang system activity at email broadcast logs.
*   **Full Access:** Ang mga Administrators ay may access sa lahat ng features ng Teacher at Faculty.

## Tech Stack
*   **Frontend:** React (Vite), Tailwind CSS, Lucide Icons
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite
*   **Email:** Nodemailer (Gmail Service)

## Paano Simulan (Getting Started)

### Prerequisites
*   Node.js (v18 o mas mataas)
*   npm

### Installation

1.  I-clone ang repository.
2.  I-install ang dependencies:
    ```bash
    npm install
    ```
3.  Mag-set up ng environment variables sa isang `.env` file (optional para sa email):
    ```env
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-app-password
    ```

### Pagpapatakbo ng Application (Running the App)

I-start pareho ang backend at frontend servers:

```bash
./run-all.sh
```

*   **Frontend:** http://localhost:3000
*   **Backend:** http://localhost:3001

## Mga Roles
*   **Student:** Access sa personal academic records.
*   **Teacher:** Nagma-manage ng classes at grades.
*   **Admin:** Full system control (Pinagsamang Registrar & Admin roles).
*   **Transferee:** Mag-apply para sa enrollment.

## License
[MIT](LICENSE)