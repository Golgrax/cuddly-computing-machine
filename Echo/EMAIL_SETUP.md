# Email API Setup Guide

Gumagamit ang system na ito ng **Nodemailer** para mag-send ng official emails (broadcasts, notifications). Pwede kang gumamit ng kahit anong SMTP service, pero naka-focus ang guide na ito sa paggamit ng libreng **Gmail** account, na siyang pinakamadaling zero-cost option.

## Option 1: Gmail (Libre at Madali)

Para makapag-send ng emails mula sa iyong Gmail account (e.g., `school.admin@gmail.com`), hindi mo pwedeng gamitin ang iyong regular na password. Kailangan mong mag-generate ng **App Password**.

### Step 1: I-enable ang 2-Factor Authentication (2FA)
1.  Pumunta sa iyong [Google Account Security Settings](https://myaccount.google.com/security).
2.  Sa ilalim ng "How you sign in to Google", piliin ang **2-Step Verification**.
3.  Sundin ang prompts para i-enable ito (kung hindi pa naka-enable).

### Step 2: Mag-generate ng App Password
1.  Bumalik sa [Google Account Security Settings](https://myaccount.google.com/security).
2.  I-search ang **"App passwords"** sa top search bar (o hanapin sa ilalim ng 2-Step Verification).
3.  Mag-create ng bagong app name, halimbawa: "Sto Nino Portal".
4.  Magge-generate ang Google ng 16-character password (e.g., `abcd efgh ijkl mnop`). **Kopyahin (Copy) ito.**

### Step 3: I-configure ang Environment Variables
1.  Buksan ang `.env` file sa root ng iyong project (gumawa ng bago kung wala pa).
2.  Ilagay ang iyong email at ang App Password:

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

*Note: Tanggalin ang spaces sa password kung gusto mo, pero usually hina-handle naman ito ng Nodemailer.*

### Step 4: I-restart ang Server
I-restart ang backend server para mag-take effect ang changes.

```bash
./run-all.sh
```

---

## Option 2: Brevo (dating Sendinblue) - Free Tier

Kung gusto mo ng mas professional na setup na may higher limits (300 emails/day nang libre):

1.  Mag-sign up sa [Brevo.com](https://www.brevo.com/).
2.  Pumunta sa **SMTP & API** settings.
3.  Mag-generate ng bagong SMTP Key.
4.  I-update ang iyong backend configuration (baka kailangan mong palitan ang `server.js` host/port settings sa `smtp-relay.brevo.com` port `587`).

Para sa default configuration ng system na ito, **Gmail (Option 1)** ang recommended dahil pre-configured na ang `server.js` para sa `gmail` service shorthand.