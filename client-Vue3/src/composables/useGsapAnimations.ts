// GSAP Animation Composables for Vue3
// 提供页面过渡、组件加载、列表动画等常用动画效果

import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import gsap from "gsap";

/**
 * 页面入场动画 - 从下往上淡入
 * @param delay 延迟时间（秒）
 */
export function usePageEnter(delay: number = 0) {
  const targetRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    nextTick(() => {
      if (!targetRef.value) return;
      gsap.fromTo(
        targetRef.value,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay,
          ease: "power2.out",
        }
      );
    });
  });

  return targetRef;
}

/**
 * 列表项交错入场动画
 * @param stagger 每个元素之间的延迟（秒）
 * @param delay 整体延迟（秒）
 */
export function useStaggerList(stagger: number = 0.08, delay: number = 0) {
  const containerRef = ref<HTMLElement | null>(null);

  const animate = () => {
    nextTick(() => {
      if (!containerRef.value) return;
      const items = containerRef.value.children;
      if (items.length === 0) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger,
          delay,
          ease: "power2.out",
        }
      );
    });
  };

  onMounted(() => {
    animate();
  });

  return { containerRef, animate };
}

/**
 * 卡片悬浮动画指令
 */
export function useCardHover() {
  const targetRef = ref<HTMLElement | null>(null);
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    if (!targetRef.value) return;
    const el = targetRef.value;

    const handleEnter = () => {
      gsap.to(el, {
        y: -4,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(el, {
        y: 0,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        duration: 0.3,
        ease: "power2.out",
      });
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    cleanup = () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  });

  onUnmounted(() => {
    cleanup?.();
  });

  return targetRef;
}

/**
 * 按钮点击动画
 */
export function useButtonClick() {
  const targetRef = ref<HTMLElement | null>(null);

  const playClick = () => {
    if (!targetRef.value) return;
    gsap
      .timeline()
      .to(targetRef.value, { scale: 0.92, duration: 0.1, ease: "power2.in" })
      .to(targetRef.value, {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1, 0.4)",
      });
  };

  return { targetRef, playClick };
}

/**
 * 数字滚动动画（用于统计数字）
 */
export function useCountUp(endValue: number, duration: number = 1.5) {
  const displayRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    nextTick(() => {
      if (!displayRef.value) return;
      const el = displayRef.value;
      const obj = { value: 0 };

      gsap.to(obj, {
        value: endValue,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.value).toString();
        },
      });
    });
  });

  return displayRef;
}

/**
 * 简单淡入动画
 */
export function useFadeIn(delay: number = 0) {
  const targetRef = ref<HTMLElement | null>(null);

  onMounted(() => {
    nextTick(() => {
      if (!targetRef.value) return;
      gsap.fromTo(
        targetRef.value,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay, ease: "power2.out" }
      );
    });
  });

  return targetRef;
}

/**
 * 模态框入场动画
 */
export function useModalEnter() {
  const overlayRef = ref<HTMLElement | null>(null);
  const contentRef = ref<HTMLElement | null>(null);

  const animateIn = () => {
    nextTick(() => {
      const tl = gsap.timeline();
      if (overlayRef.value) {
        tl.fromTo(overlayRef.value, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }
      if (contentRef.value) {
        tl.fromTo(
          contentRef.value,
          { opacity: 0, scale: 0.9, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" },
          "-=0.15"
        );
      }
    });
  };

  return { overlayRef, contentRef, animateIn };
}