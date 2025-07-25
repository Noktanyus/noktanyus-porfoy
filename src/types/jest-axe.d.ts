declare module 'jest-axe' {
  export function axe(element: Element | Document): Promise<any>;
  export function toHaveNoViolations(): any;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

export {};