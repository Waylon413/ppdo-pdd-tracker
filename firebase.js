import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAiH06gCSNmQ4_k3qLhwzlachdgRmmpcQs",
  authDomain: "ppdo-pdd-tracker.firebaseapp.com",
  databaseURL: "https://ppdo-pdd-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ppdo-pdd-tracker",
  storageBucket: "ppdo-pdd-tracker.firebasestorage.app",
  messagingSenderId: "671124008549",
  appId: "1:671124008549:web:9a84d083258ee16f9ea08c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Helper functions for Firebase operations
export const dbGet = async (key) => {
  try {
    const snapshot = await get(ref(database, key));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Firebase get error:", error);
    return null;
  }
};

export const dbSet = async (key, value) => {
  try {
    await set(ref(database, key), value);
  } catch (error) {
    console.error("Firebase set error:", error);
  }
};

export const dbListen = (key, callback) => {
  const dbRef = ref(database, key);
  return onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

export const dbRemove = async (key) => {
  try {
    await remove(ref(database, key));
  } catch (error) {
    console.error("Firebase remove error:", error);
  }
};

export { database };
