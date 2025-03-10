// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAE7SJVhS-FLBueWNAQxYA6Gi838YN55wU",
  authDomain: "gustebook-aba1d.firebaseapp.com",
  projectId: "gustebook-aba1d",
  storageBucket: "gustebook-aba1d.firebasestorage.app",
  messagingSenderId: "282519660063",
  appId: "1:282519660063:web:d0ebdb62917160d4f6d72a",
  measurementId: "G-15H56JYDZ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
