import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDGWc5rkfBrOxT8oAhsQCAN_5O-3zMwby0",
  authDomain: "pixiepath-free.firebaseapp.com",
  projectId: "pixiepath-free",
  storageBucket: "pixiepath-free.firebasestorage.app",
  messagingSenderId: "359069336347",
  appId: "1:359069336347:web:0d07f3da2d494a298609be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
