# Sto. Niño Student Access System

Isang comprehensive na school management portal na dine-design para sa Sto. Niño Elementary School. Ang system na ito ay nagpo-provide ng unified platform para sa mga students, teachers, at administrators upang ma-manage ang academic records, attendance, at communications.

## Mga Features

### 🎓 Para sa mga Estudyante (Students)
*   **Digital Student ID:** View your official ID na may dynamically generated QR code para sa verification. **Supports ID Download and Printing.**
*   **QR Login:** Use your digital or printed ID to log in quickly via the "Scan ID" feature.
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

### Mabilisang Simula (Quick Start)

Patakbuhin ang install script para i-install ang lahat ng dependencies, pagkatapos ay i-run ang start script (ang database ay awtomatikong masi-seed sa unang pagtakbo):

1.  **I-install ang lahat:**
    ```bash
    chmod +x install-all.sh run-all.sh
    ./install-all.sh
    ```
2.  **Patakbuhin ang system:**
    ```bash
    ./run-all.sh
    ```

*Alternatibong paraan (Single Command):*
```bash
chmod +x run-all.sh && ./run-all.sh --clean
```

*   **Main Portal (Frontend):** http://localhost:3000
*   **Excel/SF9 Card evolution (Frontend):** http://localhost:3002

## Mga Roles
*   **Student:** Access sa personal academic records.
*   **Teacher:** Nagma-manage ng classes at grades.
*   **Admin:** Full system control (Pinagsamang Registrar & Admin roles).
*   **Transferee:** Mag-apply para sa enrollment.

## License
[MIT](LICENSE)