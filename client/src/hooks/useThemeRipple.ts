import { useRef, useCallback } from "react";
import gsap from "gsap";

// 涟漪动画配置
const RIPPLE_DURATION = 0.4; // 动画总时长（秒），符合 300-500ms 要求
const RIPPLE_EASE = "power2.inOut";

/**
 * 主题切换涟漪动画 Hook
 * 点击主题切换按钮时，从点击位置扩散圆形涟漪完成主题转换
 * 包含 prefers-reduced-motion 无障碍适配
 * @param toggleTheme 主题切换回调函数
 */
export function useThemeRipple(toggleTheme: () => void) {
    // 是否正在执行动画（防止重复触发）
    const isAnimating = useRef(false);

    /**
     * 执行涟漪主题切换动画
     * @param event 鼠标点击事件，用于获取涟漪起始位置
     */
    const triggerRipple = useCallback(
        (event: React.MouseEvent) => {
            // 防止动画进行中重复触发
            if (isAnimating.current) return;

            // 无障碍：检测用户是否偏好减少动画
            const mediaQuery = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            );
            if (mediaQuery.matches) {
                // 低性能设备或用户偏好：直接切换主题，无动画
                toggleTheme();
                return;
            }

            isAnimating.current = true;

            // 计算涟漪半径：需要覆盖整个视口，使用视口对角线长度
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const rippleRadius = Math.sqrt(
                viewportWidth ** 2 + viewportHeight ** 2,
            );

            // 点击坐标（相对视口）
            const clickX = event.clientX;
            const clickY = event.clientY;

            // 创建涟漪元素
            const ripple = document.createElement("div");
            ripple.className = "theme-ripple";
            ripple.style.cssText = `
                position: fixed;
                top: ${clickY}px;
                left: ${clickX}px;
                width: ${rippleRadius * 2}px;
                height: ${rippleRadius * 2}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(102,126,234,0.3) 0%, rgba(102,126,234,0.15) 50%, rgba(20,20,20,0.8) 100%);
                transform: translate(-50%, -50%) scale(0);
                transform-origin: center center;
                pointer-events: none;
                z-index: 9999;
                will-change: transform, opacity;
            `;
            document.body.appendChild(ripple);

            // GSAP 动画：从点击位置缩放展开
            const rippleTween = gsap.to(ripple, {
                scale: 1,
                duration: RIPPLE_DURATION,
                ease: RIPPLE_EASE,
                onComplete: () => {
                    // 动画完成后移除涟漪元素
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                },
            });

            // 在动画中点（40%）切换主题，同时开始淡出
            gsap.to(ripple, {
                delay: RIPPLE_DURATION * 0.4,
                duration: RIPPLE_DURATION * 0.6,
                opacity: 0,
                ease: "power2.in",
                onStart: () => {
                    toggleTheme();
                },
                onComplete: () => {
                    isAnimating.current = false;
                },
            });

            // 安全兜底：超时强制清理（防止 GSAP 回调未触发）
            setTimeout(() => {
                if (ripple.parentNode) {
                    rippleTween.kill();
                    ripple.parentNode.removeChild(ripple);
                }
                isAnimating.current = false;
            }, RIPPLE_DURATION * 1000 + 300);
        },
        [toggleTheme],
    );

    return { triggerRipple, isAnimating };
}