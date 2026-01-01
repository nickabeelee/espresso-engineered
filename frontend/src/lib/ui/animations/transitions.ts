import { gsap } from 'gsap';
import type { AnimationConfig } from './index';

/**
 * Page and component transition animations
 */
export const transitions = {
  /**
   * Smooth page transition for navigation
   */
  pageTransition: (outElement: Element, inElement: Element, config: Partial<AnimationConfig> = {}) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(outElement, {
        opacity: 0,
        y: -20,
        duration: config.duration || 0.2,
        ease: config.ease || 'power2.in'
      })
      .set(inElement, { opacity: 0, y: 20 })
      .to(inElement, {
        opacity: 1,
        y: 0,
        duration: config.duration || 0.3,
        ease: config.ease || 'power2.out'
      });

    return timeline;
  },

  /**
   * Modal/overlay entrance and exit
   */
  modalTransition: (element: Element, isEntering: boolean, config: Partial<AnimationConfig> = {}) => {
    if (isEntering) {
      return gsap.fromTo(element,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: config.duration || 0.25,
          ease: config.ease || 'back.out(1.7)'
        }
      );
    } else {
      return gsap.to(element, {
        opacity: 0,
        scale: 0.9,
        duration: config.duration || 0.2,
        ease: config.ease || 'power2.in'
      });
    }
  },

  /**
   * Crossfade between two elements (useful for data updates)
   */
  crossfade: (outElement: Element, inElement: Element, config: Partial<AnimationConfig> = {}) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(outElement, {
        opacity: 0,
        duration: (config.duration || 0.4) / 2,
        ease: config.ease || 'power2.inOut'
      })
      .set(inElement, { opacity: 0 })
      .to(inElement, {
        opacity: 1,
        duration: (config.duration || 0.4) / 2,
        ease: config.ease || 'power2.inOut'
      });

    return timeline;
  },

  /**
   * Staggered list item animations
   */
  staggeredList: (items: Element[], isEntering: boolean, config: Partial<AnimationConfig> = {}) => {
    if (isEntering) {
      return gsap.fromTo(items,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: config.duration || 0.3,
          ease: config.ease || 'power2.out',
          stagger: config.stagger || 0.05
        }
      );
    } else {
      return gsap.to(items, {
        opacity: 0,
        x: 20,
        duration: config.duration || 0.2,
        ease: config.ease || 'power2.in',
        stagger: config.stagger || 0.03
      });
    }
  }
};

/**
 * Chart-specific transitions for D3 integration
 */
export const chartTransitions = {
  /**
   * Data point entrance animation for scatter plots
   */
  dataPointEntrance: (points: Element[], config: Partial<AnimationConfig> = {}) => {
    return gsap.fromTo(points,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 0.8,
        duration: config.duration || 0.2,
        ease: config.ease || 'back.out(1.7)',
        stagger: config.stagger || 0.02
      }
    );
  },

  /**
   * Axis animation for chart updates
   */
  axisTransition: (axis: Element, config: Partial<AnimationConfig> = {}) => {
    return gsap.fromTo(axis,
      { opacity: 0 },
      {
        opacity: 1,
        duration: config.duration || 0.3,
        ease: config.ease || 'power2.out'
      }
    );
  },

  /**
   * Filter transition for chart data updates
   */
  filterTransition: (chartContainer: Element, config: Partial<AnimationConfig> = {}) => {
    const timeline = gsap.timeline();
    
    timeline
      .to(chartContainer, {
        opacity: 0.3,
        duration: (config.duration || 0.4) / 2,
        ease: config.ease || 'power2.inOut'
      })
      .to(chartContainer, {
        opacity: 1,
        duration: (config.duration || 0.4) / 2,
        ease: config.ease || 'power2.inOut'
      });

    return timeline;
  }
};