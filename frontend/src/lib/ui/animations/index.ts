import { gsap } from 'gsap';

/**
 * Animation configuration interface for consistent animation parameters
 */
export interface AnimationConfig {
  duration: number;
  ease: string;
  stagger?: number;
}

/**
 * Default animation configurations following UI execution standard
 */
export const defaultConfigs = {
  horizontalScroll: {
    duration: 0.3,
    ease: 'power2.out',
    stagger: 0.05
  },
  cardStack: {
    duration: 0.15,
    ease: 'power1.inOut'
  },
  fadeInUp: {
    duration: 0.2,
    ease: 'back.out(1.7)',
    stagger: 0.02
  }
} as const;

/**
 * Core animation functions using GSAP
 */
export const animations = {
  /**
   * Horizontal scrolling animation for card lists
   */
  horizontalScroll: (elements: Element[], config: AnimationConfig = defaultConfigs.horizontalScroll) => {
    return gsap.timeline()
      .fromTo(elements, 
        { x: 50, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: config.duration,
          ease: config.ease,
          stagger: config.stagger || 0
        }
      );
  },

  /**
   * Card stacking animation for layered brew cards
   */
  cardStack: (cards: Element[], config: AnimationConfig = defaultConfigs.cardStack) => {
    return gsap.timeline()
      .set(cards, { zIndex: (i) => cards.length - i })
      .fromTo(cards,
        { scale: 0.95, y: 10 },
        {
          scale: 1,
          y: 0,
          duration: config.duration,
          ease: config.ease,
          stagger: config.stagger || 0
        }
      );
  },

  /**
   * Fade in up animation for general element entrance
   */
  fadeInUp: (element: Element | Element[], config: AnimationConfig = defaultConfigs.fadeInUp) => {
    return gsap.timeline()
      .fromTo(element,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: config.duration,
          ease: config.ease,
          stagger: config.stagger || 0
        }
      );
  }
};

/**
 * Animation utilities for common patterns
 */
export const animationUtils = {
  /**
   * Create a momentum-based horizontal scroll effect
   */
  createMomentumScroll: (container: Element, items: Element[]) => {
    let isScrolling = false;
    let scrollVelocity = 0;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        gsap.to(items, {
          x: (i) => -container.scrollLeft + (i * 10),
          duration: 0.1,
          ease: 'none',
          onComplete: () => { isScrolling = false; }
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  },

  /**
   * Create hover lift effect for interactive cards
   */
  createHoverLift: (element: Element) => {
    const handleMouseEnter = () => {
      gsap.to(element, {
        y: -2,
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }
};

// Export all animation modules
export * from './transitions';
export * from './gestures';
export * from './timeline';

// Re-export gsap for direct access when needed
export { gsap };