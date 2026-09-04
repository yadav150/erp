// firebase.js
// Central Firebase configuration for the ERP
// New Firebase SDK + new Admin UID
// No old Firebase configuration is used.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


// ======================================================
// FIREBASE CONFIGURATION
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyCbD7nHFYAKJHVe9eV_JL1A0qHQw",
  authDomain: "modelerp-c7ff7.firebaseapp.com",
  databaseURL: "https://modelerp-c7ff7-default-rtdb.firebaseio.com",
  projectId: "modelerp-c7ff7",
  storageBucket: "modelerp-c7ff7.firebasestorage.app",
  messagingSenderId: "808804437563",
  appId: "1:808804437563:web:37083674d5b6acdbe8161e",
  measurementId: "G-KT82WYLM0J"
};


// ======================================================
// ADMIN USER
// ======================================================

const ADMIN_USER_UID = "089prHaZ5shgPvvaMsl1dgMe6Yx1";


// ======================================================
// INITIALIZE FIREBASE SAFELY
// ======================================================

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);


// ======================================================
// ADMIN LOGIN
// ======================================================

async function loginAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = credential.user;

  if (!user || user.uid !== ADMIN_USER_UID) {
    await signOut(auth);

    const error = new Error("Unauthorized admin account.");
    error.code = "auth/unauthorized-admin";

    throw error;
  }

  return user;
}


// ======================================================
// GET CURRENT ADMIN USER
// ======================================================

function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      if (user.uid !== ADMIN_USER_UID) {
        signOut(auth);
        resolve(null);
        return;
      }

      resolve(user);
    }, reject);
  });
}


// ======================================================
// LOGOUT
// ======================================================

async function logoutAdmin() {
  await signOut(auth);
}


// ======================================================
// PASSWORD RESET
// ======================================================

async function sendPasswordReset(email) {
  return await sendPasswordResetEmail(auth, email);
}


// ======================================================
// GET ALL DATA
// ======================================================

async function getAllData(collection) {
  const snapshot = await get(ref(db, collection));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();

  return Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  }));
}


// ======================================================
// GET ONE RECORD
// ======================================================

async function getOneData(collection, id) {
  const snapshot = await get(
    ref(db, `${collection}/${id}`)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id,
    ...snapshot.val()
  };
}


// ======================================================
// CREATE RECORD
// ======================================================

async function createData(collection, data) {
  const collectionRef = ref(db, collection);
  const newRef = push(collectionRef);

  await set(newRef, {
    ...data,
    createdAt: Date.now()
  });

  return {
    id: newRef.key,
    ...data
  };
}


// ======================================================
// UPDATE RECORD
// ======================================================

async function updateData(collection, id, data) {
  const recordRef = ref(db, `${collection}/${id}`);

  await update(recordRef, {
    ...data,
    updatedAt: Date.now()
  });

  return {
    id,
    ...data
  };
}


// ======================================================
// DELETE RECORD
// ======================================================

async function deleteData(collection, id) {
  await remove(
    ref(db, `${collection}/${id}`)
  );

  return true;
}


// ======================================================
// EXPORTS
// ======================================================

export {
  app,
  db,
  auth,
  ADMIN_USER_UID,

  loginAdmin,
  getCurrentUser,
  logoutAdmin,
  sendPasswordReset,

  getAllData,
  getOneData,
  createData,
  updateData,
  deleteData
};
