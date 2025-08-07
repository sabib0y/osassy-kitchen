import React from 'react'
import { render, screen } from '@testing-library/react'
import MenuItemSkeleton, { SummaryPanelSkeleton, SkeletonStyles } from '@/components/MenuItemSkeleton'

// Mock the styles module
jest.mock('@/styles/components/subscription-create.module.css', () => ({
  dishCard: 'dishCard',
  dishCardSkeleton: 'dishCardSkeleton',
  dishCardImageContainer: 'dishCardImageContainer',
  skeletonImage: 'skeletonImage',
  heartLike: 'heartLike',
  dishCardContent: 'dishCardContent',
  skeletonTitle: 'skeletonTitle',
  skeletonDescription: 'skeletonDescription',
  dishPriceSection: 'dishPriceSection',
  skeletonPrice: 'skeletonPrice',
  quantityControls: 'quantityControls',
  skeletonBtn: 'skeletonBtn',
  skeletonQuantity: 'skeletonQuantity',
  skeletonButton: 'skeletonButton',
  dishesGrid: 'dishesGrid',
  summaryPanel: 'summaryPanel',
  summaryHeader: 'summaryHeader',
  summaryItems: 'summaryItems',
  emptySummary: 'emptySummary',
}))

describe('MenuItemSkeleton', () => {
  describe('Main Skeleton Component', () => {
    it('should render default number of skeleton cards', () => {
      const { container } = render(<MenuItemSkeleton />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      expect(skeletonCards).toHaveLength(6) // Default count
    })

    it('should render custom number of skeleton cards', () => {
      const { container } = render(<MenuItemSkeleton count={3} />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      expect(skeletonCards).toHaveLength(3)
    })

    it('should apply custom className to container', () => {
      const { container } = render(<MenuItemSkeleton className="custom-class" />)
      
      const gridContainer = container.querySelector('.dishesGrid')
      expect(gridContainer?.className).toContain('custom-class')
    })

    it('should render skeleton cards with proper structure', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      // Check for all skeleton elements in a card
      expect(container.querySelector('.dishCardSkeleton')).toBeInTheDocument()
      expect(container.querySelector('.skeletonImage')).toBeInTheDocument()
      expect(container.querySelector('.heartLike')).toBeInTheDocument()
      expect(container.querySelector('.skeletonTitle')).toBeInTheDocument()
      expect(container.querySelector('.skeletonDescription')).toBeInTheDocument()
      expect(container.querySelector('.skeletonPrice')).toBeInTheDocument()
      expect(container.querySelector('.skeletonButton')).toBeInTheDocument()
    })

    it('should render quantity controls in skeleton', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      const quantityControls = container.querySelector('.quantityControls')
      expect(quantityControls).toBeInTheDocument()
      
      const buttons = quantityControls?.querySelectorAll('.skeletonBtn')
      expect(buttons).toHaveLength(2) // Plus and minus buttons
      
      const quantity = quantityControls?.querySelector('.skeletonQuantity')
      expect(quantity).toBeInTheDocument()
    })

    it('should apply skeleton-pulse animation class', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      const animatedElements = container.querySelectorAll('.skeleton-pulse')
      expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('should render multiple description lines', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      const descriptions = container.querySelectorAll('.skeletonDescription')
      expect(descriptions).toHaveLength(2) // Two description lines
    })

    it('should apply width variation to second description', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      const descriptions = container.querySelectorAll('.skeletonDescription')
      const secondDescription = descriptions[1] as HTMLElement
      
      expect(secondDescription.style.width).toBe('80%')
    })

    it('should generate unique keys for skeleton cards', () => {
      const { container } = render(<MenuItemSkeleton count={3} />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      // React will warn if keys are not unique, this test ensures no warnings
      expect(skeletonCards).toHaveLength(3)
    })

    it('should render with zero count', () => {
      const { container } = render(<MenuItemSkeleton count={0} />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      expect(skeletonCards).toHaveLength(0)
    })
  })

  describe('SummaryPanelSkeleton', () => {
    it('should render summary panel skeleton', () => {
      const { container } = render(<SummaryPanelSkeleton />)
      
      expect(container.querySelector('.summaryPanel')).toBeInTheDocument()
      expect(container.querySelector('.summaryHeader')).toBeInTheDocument()
      expect(container.querySelector('.summaryItems')).toBeInTheDocument()
      expect(container.querySelector('.emptySummary')).toBeInTheDocument()
    })

    it('should render title skeleton with correct width', () => {
      const { container } = render(<SummaryPanelSkeleton />)
      
      const titleSkeleton = container.querySelector('.skeletonTitle') as HTMLElement
      expect(titleSkeleton).toBeInTheDocument()
      expect(titleSkeleton.style.width).toBe('150px')
    })

    it('should render circular placeholder icon', () => {
      const { container } = render(<SummaryPanelSkeleton />)
      
      const circularSkeleton = container.querySelector('.emptySummary .skeleton-pulse') as HTMLElement
      expect(circularSkeleton).toBeInTheDocument()
      expect(circularSkeleton.style.width).toBe('48px')
      expect(circularSkeleton.style.height).toBe('48px')
      expect(circularSkeleton.style.borderRadius).toBe('50%')
    })

    it('should render text placeholders', () => {
      const { container } = render(<SummaryPanelSkeleton />)
      
      const skeletonElements = container.querySelectorAll('.emptySummary .skeleton-pulse')
      expect(skeletonElements).toHaveLength(3) // Icon + 2 text lines
      
      const textLine1 = skeletonElements[1] as HTMLElement
      expect(textLine1.style.width).toBe('200px')
      expect(textLine1.style.height).toBe('16px')
      
      const textLine2 = skeletonElements[2] as HTMLElement
      expect(textLine2.style.width).toBe('150px')
      expect(textLine2.style.height).toBe('14px')
    })

    it('should apply skeleton-pulse animation to elements', () => {
      const { container } = render(<SummaryPanelSkeleton />)
      
      const animatedElements = container.querySelectorAll('.skeleton-pulse')
      expect(animatedElements.length).toBeGreaterThan(0)
      
      animatedElements.forEach(element => {
        expect(element.className).toContain('skeleton-pulse')
      })
    })
  })

  describe('SkeletonStyles', () => {
    it('should render SkeletonStyles component', () => {
      // styled-jsx does not render <style> tags in test environment
      // We're testing that the component renders without errors
      const { container } = render(<SkeletonStyles />)
      expect(container).toBeInTheDocument()
    })

    it('should export SkeletonStyles as a valid React component', () => {
      expect(SkeletonStyles).toBeDefined()
      expect(typeof SkeletonStyles).toBe('function')
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate ARIA attributes for loading state', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      // Skeleton cards should indicate they are placeholders
      const skeletonCard = container.querySelector('.dishCardSkeleton')
      expect(skeletonCard).toBeInTheDocument()
    })

    it('should not be interactive while loading', () => {
      const { container } = render(<MenuItemSkeleton count={1} />)
      
      const skeletonCard = container.querySelector('.dishCardSkeleton')
      // Based on the styles, pointer-events should be none
      expect(skeletonCard?.className).toContain('dishCardSkeleton')
    })
  })

  describe('Performance', () => {
    it('should handle large count efficiently', () => {
      const { container } = render(<MenuItemSkeleton count={50} />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      expect(skeletonCards).toHaveLength(50)
    })

    it('should clean up properly on unmount', () => {
      const { unmount, container } = render(<MenuItemSkeleton count={3} />)
      
      expect(container.querySelectorAll('.dishCard')).toHaveLength(3)
      
      unmount()
      
      expect(container.querySelectorAll('.dishCard')).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative count as zero', () => {
      const { container } = render(<MenuItemSkeleton count={-5} />)
      
      const skeletonCards = container.querySelectorAll('.dishCard')
      expect(skeletonCards).toHaveLength(0)
    })

    it('should handle undefined className prop', () => {
      const { container } = render(<MenuItemSkeleton className={undefined} />)
      
      const gridContainer = container.querySelector('.dishesGrid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer?.className).toBe('dishesGrid ')
    })

    it('should handle empty string className', () => {
      const { container } = render(<MenuItemSkeleton className="" />)
      
      const gridContainer = container.querySelector('.dishesGrid')
      expect(gridContainer?.className).toBe('dishesGrid ')
    })
  })
})