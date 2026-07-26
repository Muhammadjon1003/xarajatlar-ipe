import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration for Expenses Tracker
const firebaseConfig = {
  storageBucket: 'expenses-tracker-77a8b.firebasestorage.app',
};

// Initialize Firebase App & Storage
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
