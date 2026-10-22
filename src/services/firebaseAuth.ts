import { getApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
// The React Native build of Firebase Auth exports this; `firebase/auth`'s
// types don't list it, so it's imported from the underlying package.
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../firebase/config'; // makes sure the Firebase app is initialised first

// ─────────────────────────────────────────────────────────────
// One shared Auth instance for the whole app.
//
// initializeAuth + AsyncStorage persistence keeps the user signed in
// after the app is closed (getAuth alone forgets them on React Native).
// On a hot reload Auth already exists, so we fall back to getAuth.
// ─────────────────────────────────────────────────────────────

const createAuth = (): Auth => {
  const app = getApp();
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
};

export const auth = createAuth();
