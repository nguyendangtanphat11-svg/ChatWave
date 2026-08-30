const mysql = require("mysql2/promise");

const isAiven =
    process.env.DB_HOST &&
    process.env.DB_HOST.includes("aivencloud.com");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Aiven yêu cầu kết nối SSL
    ...(isAiven && {
        ssl: {
            rejectUnauthorized: false
        }
    })
});

// Kiểm tra kết nối ban đầu
pool.getConnection()
    .then((connection) => {
        console.log("✅ Kết nối MySQL thành công qua pool!");

        console.log(
            `📦 Database: ${process.env.DB_NAME} | Host: ${process.env.DB_HOST}`
        );

        connection.release();
    })
    .catch((err) => {
        console.error("❌ Kết nối MySQL thất bại:");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
    });

module.exports = pool;