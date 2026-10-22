// Firebase ships getReactNativePersistence only in its React Native build.
// Metro loads that build on the phone, but TypeScript reads the web types,
// so this tells TypeScript the function exists.
import type { Persistence } from 'firebase/auth';

declare module '@firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
