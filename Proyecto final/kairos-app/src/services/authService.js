import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const login = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'usuarios', cred.user.uid));
  if (userDoc.exists()) {
    return { uid: cred.user.uid, ...userDoc.data() };
  }
  return { uid: cred.user.uid, email: cred.user.email, rol: 'direccion', nombre: email.split('@')[0] };
};

export const logout = async () => {
  await signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const createUserWithRole = async (email, password, nombre, rol) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'usuarios', cred.user.uid), { email, nombre, rol });
  return cred.user.uid;
};

export const deleteUserDoc = async (uid) => {
  await deleteDoc(doc(db, 'usuarios', uid));
};
