import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDHPbQL0Ii8BwJZJpyRzf7Eor9afmjeF6w",
  authDomain: "kairos-504d6.firebaseapp.com",
  projectId: "kairos-504d6",
  storageBucket: "kairos-504d6.appspot.com",
  messagingSenderId: "182105490059",
  appId: "1:182105490059:web:da052e5a0928a8038a110b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
