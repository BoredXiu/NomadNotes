-- ============================================================
-- NomadNotes 数据库初始化脚本
-- 版本: 2.0
-- 描述: 创建所有核心表结构、索引及初始数据
-- 特性: 可重复执行 (IF NOT EXISTS / INSERT IGNORE)
-- 执行: mysql -u root -p < init.sql
-- ============================================================

-- 创建数据库 (如已存在则跳过)
CREATE DATABASE IF NOT EXISTS nomadnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nomadnotes;

-- ============================================================
-- 1. 用户表 (users)
-- 存储所有用户信息，包含管理员与普通用户
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    avatarUrl VARCHAR(500) NULL,
    bio VARCHAR(500) NULL,
    address VARCHAR(200) NULL,
    gender ENUM('male', 'female', 'other') NULL,
    -- 用户角色: admin=管理员, user=普通用户
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    -- 账号禁用标记: 0=正常, 1=已禁用 (禁用后无法登录且公开内容不展示)
    isDisabled TINYINT(1) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_users_username (username),
    UNIQUE INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 2. 旅程表 (trips)
-- 存储用户创建的旅程记录
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
    id CHAR(36) NOT NULL PRIMARY KEY,
    userId CHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    coverImage VARCHAR(500) NULL,
    -- 旅程结束标记: 0=进行中, 1=已结束
    isEnded TINYINT(1) NOT NULL DEFAULT 0,
    -- 公开状态: 0=私密, 1=公开 (设为公开需通过审核流程)
    isPublic TINYINT(1) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trips_userId (userId),
    INDEX idx_trips_isPublic (isPublic),
    INDEX idx_trips_createdAt (createdAt)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 3. 账单表 (expenses)
-- 存储旅程消费记录
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id CHAR(36) NOT NULL PRIMARY KEY,
    tripId CHAR(36) NOT NULL,
    -- 消费类别: 餐饮/交通/住宿/购物/门票/其他
    category VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    note TEXT NULL,
    -- 小票图片路径数组 (JSON 格式)
    receiptImages JSON NULL,
    expenseDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expenses_tripId (tripId),
    INDEX idx_expenses_category (tripId, category),
    INDEX idx_expenses_date (tripId, expenseDate)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 4. 游记表 (notes)
-- 存储旅程游记内容及关联图片
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
    id CHAR(36) NOT NULL PRIMARY KEY,
    tripId CHAR(36) NOT NULL,
    content TEXT NOT NULL,
    -- 游记图片路径数组 (JSON 格式)
    images JSON NULL,
    noteDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notes_tripId (tripId),
    INDEX idx_notes_noteDate (tripId, noteDate)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 5. 审核日志表 (audit_logs)
-- 记录旅程公开申请的审核流程
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    tripId CHAR(36) NOT NULL,
    userId CHAR(36) NOT NULL,
    -- 审核状态: pending=待审核, approved=已通过, rejected=已驳回
    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',
    -- 审核人 ID (管理员), 审核前为 NULL
    reviewedBy CHAR(36) NULL,
    -- 审核人姓名 (冗余存储, 便于直接展示)
    reviewedByName VARCHAR(50) NULL,
    -- 审核时间
    reviewedAt DATETIME NULL,
    -- 审核意见 (驳回理由或备注)
    reason VARCHAR(500) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_tripId (tripId),
    INDEX idx_audit_userId (userId),
    -- 唯一索引：同一旅程同一状态只能有一条记录，防止并发重复提交
    UNIQUE INDEX idx_audit_trip_status (tripId, status),
    INDEX idx_audit_status (status),
    INDEX idx_audit_reviewer (reviewedBy)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 6. 管理员操作日志表 (admin_operation_logs)
-- 记录所有管理员敏感操作的审计追踪
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    -- 操作人 ID (管理员)
    adminId CHAR(36) NOT NULL,
    -- 操作人用户名 (冗余存储, 便于直接展示)
    adminName VARCHAR(50) NOT NULL,
    -- 操作类型:
    --   user_disable    - 禁用用户
    --   user_enable     - 启用用户
    --   trip_takedown   - 下架旅程
    --   trip_restore    - 恢复旅程
    --   trip_delete     - 删除旅程
    --   audit_approve   - 审核通过
    --   audit_reject    - 审核驳回
    operationType VARCHAR(30) NOT NULL,
    -- 操作描述
    description VARCHAR(500) NOT NULL,
    -- 目标类型: user / trip / note / expense
    targetType VARCHAR(20) NULL,
    -- 目标资源 ID
    targetId CHAR(36) NULL,
    -- 目标名称/标识 (冗余存储)
    targetName VARCHAR(200) NULL,
    -- 操作前状态快照 (JSON 字符串)
    beforeSnapshot TEXT NULL,
    -- 操作后状态快照 (JSON 字符串)
    afterSnapshot TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_oplog_admin (adminId),
    INDEX idx_oplog_type (operationType),
    INDEX idx_oplog_target (targetType, targetId),
    INDEX idx_oplog_createdAt (createdAt)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 8. 通知表 (notifications)
-- 用于向用户发送审核结果等系统通知
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL PRIMARY KEY,
    userId CHAR(36) NOT NULL COMMENT '接收通知的用户 ID, 逻辑关联 users 表',
    type VARCHAR(30) NOT NULL COMMENT '通知类型: audit_approved, audit_rejected',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT NULL COMMENT '通知详情内容',
    tripId CHAR(36) NULL COMMENT '关联旅程 ID, 逻辑关联 trips 表',
    isRead TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读: 0 未读, 1 已读',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notify_user (userId),
    INDEX idx_notify_read (userId, isRead),
    INDEX idx_notify_createdAt (createdAt)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 9. 系统配置表 (system_configs)
-- 存储系统级键值配置参数
-- ============================================================
CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 配置键 (唯一标识)
    configKey VARCHAR(100) NOT NULL,
    -- 配置值
    configValue TEXT NOT NULL,
    -- 配置说明
    description VARCHAR(500) NULL,
    -- 最后修改时间
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_config_key (configKey)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 8. 初始数据: 管理员账号
-- 密码: Admin@123456 (bcrypt 加盐, saltRounds=10)
-- 该 hash 由 bcryptjs 预计算生成, 不可逆向还原
-- ============================================================
INSERT IGNORE INTO
    users (
        id,
        username,
        email,
        passwordHash,
        role,
        isDisabled,
        createdAt
    )
VALUES (
        UUID(),
        'admin',
        'admin@nomadnotes.com',
        '$2a$10$2Ea1G5sHpHNpmzNP..i2huDhkg7jpQNVbXvTlIV.R1VYs38MZrrRS',
        'admin',
        0,
        NOW()
    );

-- ============================================================
-- 9. 初始数据: 系统默认配置
-- ============================================================

-- 站点名称
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'site_name',
        '游迹 NomadNotes',
        '站点名称，显示在页面标题和导航栏'
    );

-- 站点描述
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'site_description',
        '极简旅行记录与游记分享平台',
        '站点描述，用于 SEO 和关于页面'
    );

-- 默认分页大小
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'default_page_size',
        '10',
        '列表页默认分页大小'
    );

-- 最大上传文件大小 (单位: MB)
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'max_upload_size_mb',
        '10',
        '单文件上传大小上限 (MB)'
    );

-- 允许的图片格式
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'allowed_image_types',
        'jpg,jpeg,png,gif,webp,svg',
        '允许上传的图片文件扩展名 (逗号分隔)'
    );

-- 用户注册开关: enabled=开放注册, disabled=关闭注册
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'registration_enabled',
        'enabled',
        '用户注册功能开关 (enabled / disabled)'
    );

-- 游记最大字数限制
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'note_max_chars',
        '10000',
        '单篇游记内容最大字符数'
    );

-- 账单消费分类列表 (JSON 数组)
INSERT IGNORE INTO
    system_configs (
        configKey,
        configValue,
        description
    )
VALUES (
        'expense_categories',
        '["餐饮","交通","住宿","购物","门票","其他"]',
        '账单消费分类列表 (JSON 数组格式)'
    );

-- ============================================================
-- 10. 角色权限定义 (role_permissions)
-- 存储系统角色及其权限分配
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- 角色标识: admin / user
    roleName VARCHAR(50) NOT NULL,
    -- 权限标识 (如 trip.create, trip.delete, admin.users.manage)
    permission VARCHAR(100) NOT NULL,
    -- 权限描述
    description VARCHAR(200) NULL,
    UNIQUE INDEX idx_role_permission (roleName, permission)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 管理员权限
INSERT IGNORE INTO
    role_permissions (
        roleName,
        permission,
        description
    )
VALUES (
        'admin',
        'admin.access',
        '访问管理后台'
    ),
    (
        'admin',
        'admin.users.list',
        '查看用户列表'
    ),
    (
        'admin',
        'admin.users.toggle',
        '启用/禁用用户账号'
    ),
    (
        'admin',
        'admin.trips.list',
        '查看所有旅程列表'
    ),
    (
        'admin',
        'admin.trips.takedown',
        '下架/恢复旅程'
    ),
    (
        'admin',
        'admin.trips.delete',
        '强制删除旅程'
    ),
    (
        'admin',
        'admin.audit.list',
        '查看审核列表'
    ),
    (
        'admin',
        'admin.audit.review',
        '审批/驳回公开申请'
    ),
    (
        'admin',
        'admin.logs.view',
        '查看操作日志'
    ),
    (
        'admin',
        'admin.config.manage',
        '管理系统配置'
    ),
    (
        'admin',
        'trip.create',
        '创建旅程'
    ),
    (
        'admin',
        'trip.update',
        '编辑旅程'
    ),
    (
        'admin',
        'trip.delete',
        '删除旅程'
    ),
    (
        'admin',
        'expense.create',
        '创建账单'
    ),
    (
        'admin',
        'expense.delete',
        '删除账单'
    ),
    (
        'admin',
        'note.create',
        '创建游记'
    ),
    (
        'admin',
        'note.delete',
        '删除游记'
    );

-- 普通用户权限
INSERT IGNORE INTO
    role_permissions (
        roleName,
        permission,
        description
    )
VALUES ('user', 'trip.create', '创建旅程'),
    ('user', 'trip.update', '编辑旅程'),
    ('user', 'trip.delete', '删除旅程'),
    (
        'user',
        'expense.create',
        '创建账单'
    ),
    (
        'user',
        'expense.delete',
        '删除账单'
    ),
    ('user', 'note.create', '创建游记'),
    ('user', 'note.delete', '删除游记');

-- ============================================================
-- 完成
-- ============================================================
SELECT 'NomadNotes 数据库初始化完成' AS message;

-- 输出已创建的表清单
SELECT TABLE_NAME, TABLE_COMMENT
FROM information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'nomadnotes'
ORDER BY TABLE_NAME;