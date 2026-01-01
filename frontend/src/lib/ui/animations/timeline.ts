import { gsap } from 'gsap';
import type { AnimationConfig } from './index';

/**
 * Complex animation timeline utilities for coordinated sequences
 */
export const timeline = {
  /**
   * Create a master timeline for page load animations
   */
  createPageLoadSequence: (elements: {
    greeting?: Element;
    inventory?: Element;
    weekSection?: Element;
    analysis?: Element;
  }, config: Partial<AnimationConfig> = {}) => {
    const tl = gsap.timeline();
    
    // Set initial states
    Object.values(elements).forEach(el => {
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    });
    
    // Animate in sequence with overlapping
    if (elements.greeting) {
      tl.to(elements.greeting, {
        opacity: 1,
        y: 0,
        duration: config.duration || 0.4,
        ease: config.ease || 'power2.out'
      });
    }
    
    if (elements.inventory) {
      tl.to(elements.inventory, {
        opacity: 1,
        y: 0,
        duration: config.duration || 0.4,
        ease: config.ease || 'power2.out'
      }, '-=0.2'); // Start 0.2s before previous ends
    }
    
    if (elements.weekSection) {
      tl.to(elements.weekSection, {
        opacity: 1,
        y: 0,
        duration: config.duration || 0.4,
        ease: config.ease || 'power2.out'
      }, '-=0.2');
    }
    
    if (elements.analysis) {
      tl.to(elements.analysis, {
        opacity: 1,
        y: 0,
        duration: config.duration || 0.4,
        ease: config.ease || 'power2.out'
      }, '-=0.2');
    }
    
    return tl;
  },

  /**
   * Create a coordinated loading state animation
   */
  createLoadingSequence: (skeletons: Element[], config: Partial<AnimationConfig> = {}) => {
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to(skeletons, {
      opacity: 0.3,
      duration: config.duration || 0.8,
      ease: config.ease || 'power2.inOut',
      stagger: config.stagger || 0.1
    })
    .to(skeletons, {
      opacity: 0.7,
      duration: config.duration || 0.8,
      ease: config.ease || 'power2.inOut',
      stagger: config.stagger || 0.1
    });
    
    return tl;
  },

  /**
   * Create a data refresh animation sequence
   */
  createRefreshSequence: (containers: Element[], config: Partial<AnimationConfig> = {}) => {
    const tl = gsap.timeline();
    
    // Fade out current content
    tl.to(containers, {
      opacity: 0.3,
      scale: 0.98,
      duration: (config.duration || 0.6) / 3,
      ease: config.ease || 'power2.inOut',
      stagger: config.stagger || 0.05
    })
    // Brief pause for data loading
    .set({}, {}, `+=${(config.duration || 0.6) / 3}`)
    // Fade in new content
    .to(containers, {
      opacity: 1,
      scale: 1,
      duration: (config.duration || 0.6) / 3,
      ease: 'back.out(1.7)',
      stagger: config.stagger || 0.05
    });
    
    return tl;
  },

  /**
   * Create a section transition animation (for navigation between sections)
   */
  createSectionTransition: (
    outSection: Element, 
    inSection: Element, 
    direction: 'horizontal' | 'vertical' = 'horizontal',
    config: Partial<AnimationConfig> = {}
  ) => {
    const tl = gsap.timeline();
    const distance = direction === 'horizontal' ? 100 : 50;
    
    // Set initial state for incoming section
    gsap.set(inSection, { 
      opacity: 0, 
      [direction === 'horizontal' ? 'x' : 'y']: distance 
    });
    
    // Animate out current section
    tl.to(outSection, {
      opacity: 0,
      [direction === 'horizontal' ? 'x' : 'y']: -distance,
      duration: config.duration || 0.3,
      ease: config.ease || 'power2.in'
    })
    // Animate in new section
    .to(inSection, {
      opacity: 1,
      [direction === 'horizontal' ? 'x' : 'y']: 0,
      duration: config.duration || 0.4,
      ease: 'power2.out'
    }, '-=0.1'); // Slight overlap
    
    return tl;
  }
};

/**
 * Animation state management utilities
 */
export const animationState = {
  /**
   * Pause all animations on an element
   */
  pauseAll: (element: Element) => {
    gsap.getTweensOf(element).forEach(tween => tween.pause());
  },

  /**
   * Resume all animations on an element
   */
  resumeAll: (element: Element) => {
    gsap.getTweensOf(element).forEach(tween => tween.resume());
  },

  /**
   * Kill all animations on an element
   */
  killAll: (element: Element) => {
    gsap.killTweensOf(element);
  },

  /**
   * Check if element has active animations
   */
  hasActiveAnimations: (element: Element): boolean => {
    return gsap.getTweensOf(element).length > 0;
  }
};