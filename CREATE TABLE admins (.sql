
CREATE DATABASE mashtal_db;
USE mashtal_db;

-- خشتەی ئەدمین
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- تێکردنی ئەدمینی سەرەتایی (Password: admin123)
INSERT INTO admins (username, password) VALUES ('admin', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFX9.pX7yY51Z/xY/WzJ.p0vY60z5p7.');

-- خشتەی کاڵاکان
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('دەرامان', 'خاکەناز و مزەخە', 'مادەی خۆراکی', 'بەشی تر') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_in_store INT DEFAULT 0, -- بڕ لە کۆگا
    stock_out_store INT DEFAULT 0, -- بڕی دەرەوەی کۆگا
    expired_qty INT DEFAULT 0, -- بڕی بەسەرچوو
    sold_qty INT DEFAULT 0, -- بڕی فرۆشراو
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
