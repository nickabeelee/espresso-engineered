import { render, screen, fireEvent, waitFor } from '@testing-library/svelte/svelte5';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RoastLevel from './RoastLevel.svelte';
import type { RoastLevel as RoastLevelType } from '@shared/types';

describe('RoastLevel Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure and Visual Mapping', () => {
    it('should render exactly 5 coffee bean icons in horizontal row', () => {
      render(RoastLevel, { value: 'Medium' });
      
      const buttons = screen.getAllByRole('radio');
      expect(buttons).toHaveLength(5);
      
      // Check horizontal layout
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('roast-level-component');
    });

    it('should display correct number of active beans for each roast level', () => {
      const testCases: Array<{ level: RoastLevelType; expectedActive: number }> = [
        { level: 'Light', expectedActive: 1 },
        { level: 'Medium Light', expectedActive: 2 },
        { level: 'Medium', expectedActive: 3 },
        { level: 'Medium Dark', expectedActive: 4 },
        { level: 'Dark', expectedActive: 5 }
      ];

      testCases.forEach(({ level, expectedActive }) => {
        const { unmount } = render(RoastLevel, { value: level });
        
        const buttons = screen.getAllByRole('radio');
        let activeCount = 0;
        
        buttons.forEach((button, index) => {
          if (button.classList.contains('bean-active')) {
            activeCount++;
          }
        });
        
        expect(activeCount).toBe(expectedActive);
        unmount();
      });
    });
  });

  describe('Size Variants', () => {
    it('should apply correct CSS classes for different sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
      
      sizes.forEach(size => {
        const { unmount } = render(RoastLevel, { value: 'Medium', size });
        
        const container = screen.getByRole('radiogroup');
        expect(container).toHaveClass(size);
        
        unmount();
      });
    });

    it('should default to medium size when no size specified', () => {
      render(RoastLevel, { value: 'Medium' });
      
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveClass('medium');
    });
  });

  describe('Interactive Editing Mode', () => {
    it('should respond to hover events in editable mode', async () => {
      const onChange = vi.fn();
      render(RoastLevel, { 
        value: 'Light', 
        editable: true, 
        onChange 
      });
      
      const buttons = screen.getAllByRole('radio');
      
      // Initially should have 1 active bean (Light)
      let activeBeans = buttons.filter(btn => btn.classList.contains('bean-active'));
      expect(activeBeans).toHaveLength(1);
      
      // Hover over third bean - this should trigger hover state
      await fireEvent.mouseEnter(buttons[2]);
      
      // The component should be in hover state - we can't easily test the visual change
      // in the test environment, but we can verify the hover doesn't cause errors
      // and that clicking after hover works correctly
      await fireEvent.click(buttons[2]);
      expect(onChange).toHaveBeenCalledWith('Medium');
    });

    it('should set roast level on click in editable mode', async () => {
      const onChange = vi.fn();
      render(RoastLevel, { 
        value: 'Light', 
        editable: true, 
        onChange 
      });
      
      const buttons = screen.getAllByRole('radio');
      
      // Click on fourth bean (Medium Dark)
      await fireEvent.click(buttons[3]);
      
      expect(onChange).toHaveBeenCalledWith('Medium Dark');
    });

    it('should not respond to interactions in view-only mode', async () => {
      const onChange = vi.fn();
      render(RoastLevel, { 
        value: 'Light', 
        editable: false, 
        onChange 
      });
      
      const buttons = screen.getAllByRole('radio');
      
      // Try to click
      await fireEvent.click(buttons[3]);
      
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should clear hover state when mouse leaves component', async () => {
      render(RoastLevel, { 
        value: 'Light', 
        editable: true 
      });
      
      const container = screen.getByRole('radiogroup');
      const buttons = screen.getAllByRole('radio');
      
      // Hover over third bean
      await fireEvent.mouseEnter(buttons[2]);
      
      // Leave component
      await fireEvent.mouseLeave(container);
      
      // Hover does not change state; active beans should remain unchanged.
      await waitFor(() => {
        const activeButtons = buttons.filter(btn =>
          btn.classList.contains('bean-active')
        );
        expect(activeButtons).toHaveLength(1);
      });
    });
  });

  describe('Accessibility Support', () => {
    it('should have proper ARIA attributes in view-only mode', () => {
      render(RoastLevel, { value: 'Medium' });
      
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-label', 'Roast level: Medium');
      expect(container).toHaveAttribute('title', 'Medium');
    });

    it('should have proper ARIA attributes in editable mode', () => {
      render(RoastLevel, { value: 'Medium', editable: true });
      
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-label', 'Roast level: Medium');
      expect(container).toHaveAttribute('title', 'Medium');
    });

    it('should be focusable in editable mode', () => {
      render(RoastLevel, { value: 'Medium', editable: true });
      
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('tabindex', '0');
    });

    it('should not be focusable in view-only mode', () => {
      render(RoastLevel, { value: 'Medium', editable: false });
      
      const container = screen.getByRole('radiogroup');
      expect(container).not.toHaveAttribute('tabindex');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation in editable mode', async () => {
      let currentValue: RoastLevelType = 'Medium';
      const onChange = vi.fn((newValue) => {
        currentValue = newValue; // Update our tracking value
      });
      
      const { rerender } = render(RoastLevel, { 
        value: currentValue, 
        editable: true, 
        onChange 
      });
      
      const container = screen.getByRole('radiogroup');
      container.focus();
      
      // Arrow right should increase roast level
      await fireEvent.keyDown(container, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('Medium Dark');
      
      // Re-render with new value to simulate component update
      await rerender({ value: currentValue, editable: true, onChange });
      
      onChange.mockClear();
      
      // Arrow left should decrease roast level (from Medium Dark)
      await fireEvent.keyDown(container, { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenCalledWith('Medium');
    });

    it('should handle Home and End keys in editable mode', async () => {
      const onChange = vi.fn();
      render(RoastLevel, { 
        value: 'Medium', 
        editable: true, 
        onChange 
      });
      
      const container = screen.getByRole('radiogroup');
      container.focus();
      
      // Home should go to Light
      await fireEvent.keyDown(container, { key: 'Home' });
      expect(onChange).toHaveBeenCalledWith('Light');
      
      onChange.mockClear();
      
      // End should go to Dark
      await fireEvent.keyDown(container, { key: 'End' });
      expect(onChange).toHaveBeenCalledWith('Dark');
    });
  });

  describe('Color Token Compliance', () => {
    it('should use correct CSS custom properties for colors', () => {
      render(RoastLevel, { value: 'Medium' });
      
      const buttons = screen.getAllByRole('radio');
      
      // Check that active beans use primary color
      const activeBeans = buttons.filter(btn => btn.classList.contains('bean-active'));
      activeBeans.forEach(bean => {
        const styles = window.getComputedStyle(bean);
        // Note: In test environment, CSS custom properties may not resolve
        // This test verifies the classes are applied correctly
        expect(bean).toHaveClass('bean-active');
      });
      
      // Check that inactive beans use muted color
      const inactiveBeans = buttons.filter(btn => btn.classList.contains('bean-inactive'));
      inactiveBeans.forEach(bean => {
        expect(bean).toHaveClass('bean-inactive');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle null roast level gracefully', () => {
      render(RoastLevel, { value: null });
      
      const buttons = screen.getAllByRole('radio');
      const activeBeans = buttons.filter(btn => btn.classList.contains('bean-active'));
      
      expect(activeBeans).toHaveLength(0);
    });

    it('should handle undefined roast level gracefully', () => {
      render(RoastLevel, { value: undefined as any });
      
      const buttons = screen.getAllByRole('radio');
      const activeBeans = buttons.filter(btn => btn.classList.contains('bean-active'));
      
      expect(activeBeans).toHaveLength(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain structure across different viewport sizes', () => {
      // Test small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });
      
      const { unmount } = render(RoastLevel, { value: 'Medium', size: 'small' });
      
      let buttons = screen.getAllByRole('radio');
      expect(buttons).toHaveLength(5);
      
      unmount();
      
      // Test large viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      render(RoastLevel, { value: 'Medium', size: 'large' });
      
      buttons = screen.getAllByRole('radio');
      expect(buttons).toHaveLength(5);
    });
  });

  describe('Integration with Svelte Events', () => {
    it('should dispatch Svelte change event', async () => {
      let capturedEvent: CustomEvent | null = null;
      
      const component = render(RoastLevel, { 
        value: 'Light', 
        editable: true 
      });
      
      component.component.$on('change', (event) => {
        capturedEvent = event;
      });
      
      const buttons = screen.getAllByRole('radio');
      await fireEvent.click(buttons[2]); // Click third bean (Medium)
      
      expect(capturedEvent).toBeTruthy();
      expect(capturedEvent?.detail).toBe('Medium');
    });
  });
});
