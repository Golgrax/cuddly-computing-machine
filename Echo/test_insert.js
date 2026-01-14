import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('db.sqlite');

const id = 'u-' + Date.now();
const name = 'Test Insert';
const email = 'testinsert@example.com';
const role = 'PENDING';
const password = '123';
const verificationToken = 'token';
const emailVerified = 0;

console.log(`Attempting to insert user: ${id}`);

db.run('INSERT INTO users (id, name, email, role, password, verificationToken, emailVerified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [id, name, email, role, password, verificationToken, emailVerified, 'active'], 
    function(err) {
        if (err) {
            console.error("Insert Error:", err);
        } else {
            console.log("Insert Success. Rows affected:", this.changes);
            
            // Query back immediately
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) console.error("Query Error:", err);
                console.log("Retrieved Row:", row);
            });
        }
});
