export type AnimationType = 
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-up'
  | 'flip-down';

export interface ScrollAnimationOptions {
  threshold?: number;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  once?: boolean;
}