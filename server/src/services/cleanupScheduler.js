import { cleanupTmpDir } from '../services/uploadService.js';

const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

let intervalId = null;

function startCleanupScheduler() {
  console.log(`[清理调度器] 已启动，每 ${CLEANUP_INTERVAL_MS / 60000} 分钟执行一次临时文件清理`);

  cleanupTmpDir();

  intervalId = setInterval(() => {
    try {
      cleanupTmpDir();
    } catch (error) {
      console.error('[清理调度器] 执行失败:', error.message);
    }
  }, CLEANUP_INTERVAL_MS);
}

function stopCleanupScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[清理调度器] 已停止');
  }
}

export { startCleanupScheduler, stopCleanupScheduler };