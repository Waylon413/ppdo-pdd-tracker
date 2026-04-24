import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

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

export { database };
