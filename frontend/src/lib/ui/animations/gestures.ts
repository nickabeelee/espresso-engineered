import { gsap } from 'gsap';
import type { AnimationConfig } from './index';

/**
 * Gesture-based animations for interactive elements
 */
export const gestures = {
  /**
   * Swipe gesture animation for horizontal navigation
   */
  swipeHorizontal: (
    container: Element, 
    direction: 'left' | 'right', 
    config: Partial<AnimationConfig> = {}
  ) => {
    const distance = direction === 'left' ? -100 : 100;
    
    return gsap.timeline()
      .to(container, {
        x: distance,
        duration: config.duration || 0.3,
        ease: config.ease || 'power2.out'
      })
      .to(container, {
        x: 0,
        duration: (config.duration || 0.3) * 0.7,
        ease: 'elastic.out(1, 0.5)'
      });
  },

  /**
   * Pull-to-refresh gesture animation
   */
  pullToRefresh: (element: Element, progress: number, config: Partial<AnimationConfig> = {}) => {
    const maxRotation = 180;
    const rotation = progress * maxRotation;
    
    return gsap.set(element, {
      rotation: rotation,
      scale: Math.min(1, 0.8 + (progress * 0.2))
    });
  },

  /**
   * Long press animation feedback
   */
  longPress: (element: Element, isPressed: boolean, config: Partial<AnimationConfig> = {}) => {
    if (isPressed) {
      return gsap.to(element, {
        scale: 0.95,
        duration: config.duration || 0.1,
        ease: config.ease || 'power2.out'
      });
    } else {
      return gsap.to(element, {
        scale: 1,
        duration: config.duration || 0.2,
        ease: 'elastic.out(1, 0.3)'
      });
    }
  },

  /**
   * Drag and drop visual feedback
   */
  dragFeedback: (element: Element, isDragging: boolean, config: Partial<AnimationConfig> = {}) => {
    if (isDragging) {
      return gsap.to(element, {
        scale: 1.05,
        rotation: 2,
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        duration: config.duration || 0.2,
        ease: config.ease || 'power2.out'
      });
    } else {
      return gsap.to(element, {
        scale: 1,
        rotation: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        duration: config.duration || 0.3,
        ease: 'elastic.out(1, 0.5)'
      });
    }
  }
};

/**
 * Touch interaction utilities
 */
export const touchUtils = {
  /**
   * Create a ripple effect on touch
   */
  createRipple: (element: Element, x: number, y: number, config: Partial<AnimationConfig> = {}) => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      pointer-events: none;
      transform: scale(0);
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      margin-left: -10px;
      margin-top: -10px;
    `;
    
    element.appendChild(ripple);
    
    const timeline = gsap.timeline({
      onComplete: () => ripple.remove()
    });
    
    timeline
      .to(ripple, {
        scale: 4,
        opacity: 1,
        duration: config.duration || 0.3,
        ease: config.ease || 'power2.out'
      })
      .to(ripple, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      });
    
    return timeline;
  },

  /**
   * Elastic bounce for button presses
   */
  elasticPress: (element: Element, config: Partial<AnimationConfig> = {}) => {
    return gsap.timeline()
      .to(element, {
        scale: 0.9,
        duration: 0.1,
        ease: 'power2.in'
      })
      .to(element, {
        scale: 1,
        duration: config.duration || 0.4,
        ease: 'elastic.out(1, 0.3)'
      });
  }
};