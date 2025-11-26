import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase_config";

/**
 * Custom Hook: useUsuario
 * 
 * The `useUsuario` hook retrieves the details of an authenticated user from Firestore using their user ID.
 * It manages the loading and error states, and returns the user data once the data is successfully fetched from Firestore.
 * 
 * **Features**:
 * - Fetches the user's data from Firestore based on the user ID.
 * - Handles the loading state while waiting for the user data to load.
 * - Provides error handling in case something goes wrong while fetching the data.
 * 
 * **State Variables**:
 * - `usuario`: The user data fetched from Firestore. It is `null` if no user is found.
 * - `loading`: A boolean that indicates whether the data is being loaded.
 * - `error`: A string containing the error message, if an error occurs during the data fetch.
 * 
 * **Methods**:
 * - `fetchUsuario`: A function that fetches the user's details from Firestore. It is triggered when the `userId` changes or when the hook is initially mounted.
 * 
 * **Parameters**:
 * - `userId`: The ID of the authenticated user whose details need to be fetched from Firestore.
 * 
 * **Return**:
 * - The hook returns an object containing the `usuario` (user data), `loading` (state of data loading), and `error` (error message, if any).
 * 
 * **Example**:
 * ```javascript
 * const { usuario, loading, error } = useUsuario(userId);
 * 
 * if (loading) {
 *   return <div>Loading...</div>;
 * }
 * 
 * if (error) {
 *   return <div>Error: {error}</div>;
 * }
 * 
 * return <div>User Info: {JSON.stringify(usuario)}</div>;
 * ```
 */

const useUsuario = (userId) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUsuario(null);
      setLoading(false);
      return;
    }

    const fetchUsuario = async () => {
      try {
        const userDocRef = doc(db, "usuarios", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUsuario(userDoc.data());
        } else {
          setUsuario(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [userId]);

  return { usuario, loading, error };
};

export default useUsuario;
