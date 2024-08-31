// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiO-nyiVD282k2bYoCQhXeSBZnmiaotD8",
  authDomain: "checkinapp-e923c.firebaseapp.com",
  projectId: "checkinapp-e923c",
  storageBucket: "checkinapp-e923c.appspot.com",
  messagingSenderId: "53631095428",
  appId: "1:53631095428:web:3378795b2972f6d409e8d1",
  measurementId: "G-YD7V607PBY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);