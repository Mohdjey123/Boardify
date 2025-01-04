// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCI58svoaY1iUfN51mKBkPS8VhT7wUbzaY",
  authDomain: "pinterest-clone-ea280.firebaseapp.com",
  projectId: "pinterest-clone-ea280",
  storageBucket: "pinterest-clone-ea280.firebasestorage.app",
  messagingSenderId: "952294822908",
  appId: "1:952294822908:web:f555e197e672cd18be1879"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);