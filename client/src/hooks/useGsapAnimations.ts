// GSAP Animation Hooks for React
// 提供页面过渡、组件加载、列表动画等常用动画效果

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * 页面入场动画 - 从下往上淡入
 * @param delay 延迟时间（秒）
 */
export function usePageEnter(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay,
        ease: "power2.out",
      }
    );
  }, [delay]);

  return ref;
}

/**
 * 列表项交错入场动画
 * @param stagger 每个元素之间的延迟（秒）
 * @param delay 整体延迟（秒）
 */
export function useStaggerList(stagger: number = 0.08, delay: number = 0) {
  const containerRef = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.children;
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
  }, [stagger, delay]);

  useEffect(() => {
    animate();
  }, [animate]);

  return { containerRef, animate };
}

/**
 * 卡片悬浮动画
 */
export function useCardHover() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

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

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return ref;
}

/**
 * 按钮点击动画
 */
export function useButtonClick() {
  const ref = useRef<HTMLButtonElement>(null);

  const playClick = useCallback(() => {
    if (!ref.current) return;
    gsap.timeline()
      .to(ref.current, { scale: 0.92, duration: 0.1, ease: "power2.in" })
      .to(ref.current, { scale: 1, duration: 0.2, ease: "elastic.out(1, 0.4)" });
  }, []);

  return { ref, playClick };
}

/**
 * 数字滚动动画（用于统计数字）
 */
export function useCountUp(endValue: number, duration: number = 1.5, startOnMount: boolean = true) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !startOnMount) return;
    const el = ref.current;
    const obj = { value: 0 };

    gsap.to(obj, {
      value: endValue,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = Math.round(obj.value).toString();
      },
    });
  }, [endValue, duration, startOnMount]);

  return ref;
}

/**
 * Fade in 入场动画
 */
export function useFadeIn(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay, ease: "power2.out" }
    );
  }, [delay]);

  return ref;
}

/**
 * 模态框入场动画
 */
export function useModalEnter() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const animateIn = useCallback(() => {
    const tl = gsap.timeline();
    if (overlayRef.current) {
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" });
    }
    if (contentRef.current) {
      tl.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.4)" },
        "-=0.15"
      );
    }
  }, []);

  return { overlayRef, contentRef, animateIn };
}