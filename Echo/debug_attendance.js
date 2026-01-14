import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('db.sqlite');

db.all('SELECT * FROM attendance', [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- ALL ATTENDANCE RECORDS ---');
        console.table(rows);
    }
});
