-- NomadNotes 数据库初始化脚本
-- 请先创建数据库: CREATE DATABASE nomadnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nomadnotes;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    bio VARCHAR(500) NULL,
    address VARCHAR(200) NULL,
    gender ENUM('male', 'female', 'other') NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 旅程表
CREATE TABLE IF NOT EXISTS trips (
    id CHAR(36) PRIMARY KEY NOT NULL,
    user_id CHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image VARCHAR(500) NULL,
    is_ended TINYINT(1) NOT NULL DEFAULT 0,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 账单表
CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(36) PRIMARY KEY NOT NULL,
    trip_id CHAR(36) NOT NULL,
    category VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    note TEXT NULL,
    receipt_image VARCHAR(500) NULL,
    expense_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 游记表
CREATE TABLE IF NOT EXISTS notes (
    id CHAR(36) PRIMARY KEY NOT NULL,
    trip_id CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    images JSON NULL,
    vector_images JSON NULL,
    note_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 索引
CREATE INDEX idx_trips_user_id ON trips (user_id);

CREATE INDEX idx_expenses_trip_id ON expenses (trip_id);

CREATE INDEX idx_notes_trip_id ON notes (trip_id);

CREATE INDEX idx_expenses_category ON expenses (trip_id, category);

CREATE INDEX idx_expenses_date ON expenses (trip_id, expense_date);

CREATE INDEX idx_notes_note_date ON notes (trip_id, note_date);