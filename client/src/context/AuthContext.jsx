import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    // This connects our global listener to Firebase authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    if (!auth) return Promise.reject(new Error("Firebase is not configured. Add credentials to .env file to enable authentication."));
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    if (!auth) return Promise.reject(new Error("Firebase is not configured. Add credentials to .env file to enable authentication."));
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    if (!auth) return Promise.reject(new Error("Firebase is not configured. Add credentials to .env file to enable authentication."));
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    if (!auth) return Promise.resolve();
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
