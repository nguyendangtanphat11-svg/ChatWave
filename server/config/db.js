const mysql = require("mysql2/promise"); // Sử dụng promise-wrapper

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // Số lượng kết nối tối đa trong pool
    queueLimit: 0
});

// Kiểm tra kết nối ban đầu
pool.getConnection()
    .then(connection => {
        console.log("✅ Kết nối MySQL thành công qua pool!");
        connection.release(); // Trả kết nối về pool
    })
    .catch(err => {
        console.error("❌ Kết nối MySQL thất bại:", err.message);
    });

module.exports = pool;