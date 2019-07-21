const mysql = require('mysql')

const conn = mysql.createConnection({
    user: 'fatanaminullah15',
    password: 'e72861e7',
    host: 'db4free.net',
    database: 'fatan_bookstore',
    port: '3306'
})

module.exports = conn