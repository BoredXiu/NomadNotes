/**
 * 多用户 localStorage 认证存储工具
 *
 * 设计目标:
 * - 使用 localStorage 替代 sessionStorage，支持持久化登录
 * - 多 key 管理机制，同一浏览器支持多用户同时登录，token 不互相覆盖
 * - nn_currentUserId 作为会话级当前用户记忆，模拟 sessionStorage 的标签页隔离效果
 *
 * Key 命名规范:
 *   nn_currentUserId        - 当前会话激活的用户 ID（会话级记忆）
 *   nn_userList             - JSON 数组，所有已登录用户的 ID 列表
 *   nn_accessToken_{uid}    - 用户的 access token
 *   nn_refreshToken_{uid}   - 用户的 refresh token
 *   nn_user_{uid}           - 用户基本信息 JSON
 */

const PREFIX = "nn_";

// ---- 全局 Key 常量 ----
const CURRENT_USER_KEY = `${PREFIX}currentUserId`;
const USER_LIST_KEY = `${PREFIX}userList`;

// ---- 用户级 Key 工厂 ----
const accessTokenKey = (uid: string): string => `${PREFIX}accessToken_${uid}`;
const refreshTokenKey = (uid: string): string => `${PREFIX}refreshToken_${uid}`;
const userKey = (uid: string): string => `${PREFIX}user_${uid}`;

// ==================== 当前用户管理 ====================

/** 获取当前会话激活的用户 ID */
export function getCurrentUserId(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
}

/** 设置当前会话激活的用户 ID */
export function setCurrentUserId(uid: string): void {
    localStorage.setItem(CURRENT_USER_KEY, uid);
}

/** 清除当前会话激活的用户 ID */
export function clearCurrentUserId(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
}

// ==================== 用户列表管理 ====================

/** 获取所有已登录用户的 ID 列表 */
export function getUserList(): string[] {
    try {
        const raw = localStorage.getItem(USER_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** 将用户添加到已登录列表（去重） */
export function addToUserList(uid: string): void {
    const list = getUserList();
    if (!list.includes(uid)) {
        list.push(uid);
        localStorage.setItem(USER_LIST_KEY, JSON.stringify(list));
    }
}

/** 从已登录列表移除用户 */
export function removeFromUserList(uid: string): void {
    const list = getUserList().filter((id) => id !== uid);
    localStorage.setItem(USER_LIST_KEY, JSON.stringify(list));
}

// ==================== Token 读写 ====================

/** 获取指定用户（或当前用户）的 access token */
export function getAccessToken(uid?: string): string | null {
    const targetId = uid || getCurrentUserId();
    if (!targetId) return null;
    return localStorage.getItem(accessTokenKey(targetId));
}

/** 设置指定用户的 access token */
export function setAccessToken(uid: string, token: string): void {
    localStorage.setItem(accessTokenKey(uid), token);
}

/** 获取指定用户（或当前用户）的 refresh token */
export function getRefreshToken(uid?: string): string | null {
    const targetId = uid || getCurrentUserId();
    if (!targetId) return null;
    return localStorage.getItem(refreshTokenKey(targetId));
}

/** 设置指定用户的 refresh token */
export function setRefreshToken(uid: string, token: string): void {
    localStorage.setItem(refreshTokenKey(uid), token);
}

// ==================== 用户信息读写 ====================

/** 获取指定用户（或当前用户）的基本信息 */
export function getStoredUser(uid?: string): Record<string, unknown> | null {
    const targetId = uid || getCurrentUserId();
    if (!targetId) return null;
    try {
        const raw = localStorage.getItem(userKey(targetId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** 设置指定用户的基本信息 */
export function setStoredUser(uid: string, user: Record<string, unknown>): void {
    localStorage.setItem(userKey(uid), JSON.stringify(user));
}

// ==================== 综合操作 ====================

/**
 * 保存用户完整认证信息
 * 同时更新用户列表和当前活跃用户
 */
export function saveAuth(
    user: Record<string, unknown>,
    accessToken: string,
    refreshToken: string,
): void {
    const uid = user.id as string;
    setAccessToken(uid, accessToken);
    setRefreshToken(uid, refreshToken);
    setStoredUser(uid, user);
    addToUserList(uid);
    setCurrentUserId(uid);
}

/**
 * 移除指定用户（或当前用户）的认证信息
 * 同时清理用户列表和当前活跃用户引用
 */
export function removeAuth(uid?: string): void {
    const targetId = uid || getCurrentUserId();
    if (!targetId) return;

    localStorage.removeItem(accessTokenKey(targetId));
    localStorage.removeItem(refreshTokenKey(targetId));
    localStorage.removeItem(userKey(targetId));
    removeFromUserList(targetId);

    // 如果被移除的是当前用户，清除当前用户引用
    if (getCurrentUserId() === targetId) {
        clearCurrentUserId();
    }
}

/**
 * 切换到指定用户
 * 更新会话级当前用户 ID，后续所有 get 操作将使用该用户的 token
 */
export function switchToUser(uid: string): void {
    // 验证该用户是否存在于列表中
    const list = getUserList();
    if (list.includes(uid)) {
        setCurrentUserId(uid);
    }
}

/**
 * 一键登出：清除当前用户所有认证数据，且不保留任何活跃用户引用
 * 用于完整退出登录操作
 */
export function logoutCurrentUser(): void {
    const uid = getCurrentUserId();
    if (uid) {
        removeAuth(uid);
    }
    clearCurrentUserId();
}