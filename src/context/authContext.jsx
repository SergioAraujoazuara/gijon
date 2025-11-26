import React, { createContext, useContext, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase_config';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Importa las funciones necesarias de Firestore

// Funciones de contexto para obtener el user
export const authContext = createContext();

export const useAuth = () => {
    const context = useContext(authContext);
    if (!context) throw new Error('There is no authProvider');
    return context;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // Estado para guardar el rol del usuario
    const [loading, setLoading] = useState(true);

    const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);

    const logout = () => signOut(auth);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

    // Función para obtener el rol del usuario desde Firestore
    const fetchUserRole = async (uid) => {
        const db = getFirestore();
        const userRef = doc(db, 'usuarios', uid); // Asegúrate de que la colección y el documento existen
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            setRole(docSnap.data().role); // Suponiendo que el campo que contiene el rol se llama 'role'
        } else {
            console.error("No such document for role!");
            setRole(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchUserRole(currentUser.uid).then(() => {
                    setLoading(false); // Finaliza la carga después de obtener el rol
                });
            } else {
                setUser(null);
                setRole(null); // Asegúrate de limpiar el rol si el usuario se desloguea
                setLoading(false); // Finaliza la carga cuando no hay usuario
            }
        });

        return () => unsubscribe(); // Asegúrate de limpiar el listener de auth cuando el componente se desmonte
    }, []);

    return (
        <authContext.Provider value={{ signup, login, user, role, logout, loading }}>
            {children}
        </authContext.Provider>
    );
}
