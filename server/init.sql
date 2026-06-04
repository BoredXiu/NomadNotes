-- NomadNotes 数据库初始化脚本
-- 请先创建数据库: CREATE DATABASE nomadnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nomadnotes;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    avatarUrl VARCHAR(500) NULL,
    bio VARCHAR(500) NULL,
    address VARCHAR(200) NULL,
    gender ENUM('male', 'female', 'other') NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 旅程表
CREATE TABLE IF NOT EXISTS trips (
    id CHAR(36) PRIMARY KEY NOT NULL,
    userId CHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    coverImage VARCHAR(500) NULL,
    isEnded TINYINT(1) NOT NULL DEFAULT 0,
    isPublic TINYINT(1) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 账单表
CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(36) PRIMARY KEY NOT NULL,
    tripId CHAR(36) NOT NULL,
    category VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    note TEXT NULL,
    receiptImages JSON NULL,
    expenseDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 游记表
CREATE TABLE IF NOT EXISTS notes (
    id CHAR(36) PRIMARY KEY NOT NULL,
    tripId CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    images JSON NULL,
    noteDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 索引
CREATE INDEX idx_trips_userId ON trips (userId);

CREATE INDEX idx_expenses_tripId ON expenses (tripId);

CREATE INDEX idx_notes_tripId ON notes (tripId);

CREATE INDEX idx_expenses_category ON expenses (tripId, category);

CREATE INDEX idx_expenses_date ON expenses (tripId, expenseDate);

CREATE INDEX idx_notes_noteDate ON notes (tripId, noteDate);