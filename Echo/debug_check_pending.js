import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('db.sqlite');

db.all('SELECT id, name, email, role, status, emailVerified FROM users', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- ALL USERS IN DB ---');
        console.table(rows);
    }
});
