import React, { useState, useEffect } from 'react';
import { getAuth, sendPasswordResetEmail, confirmPasswordReset } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';

const RecoverPassword = () => {
    const navigate = useNavigate();
    const { oobCode } = useParams();  // Para el código del enlace
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isReset, setIsReset] = useState(false); // Determina si estamos restableciendo o enviando el correo
    const [isSuccess, setIsSuccess] = useState(false); // Determina si la contraseña fue restablecida con éxito
    const [isEmailSent, setIsEmailSent] = useState(false); // Para verificar si el correo fue enviado

    // Enviar el correo de restablecimiento
    const handleSendResetEmail = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        console.log('Enviando correo de restablecimiento...', email); // Depuración
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('Correo enviado correctamente'); // Depuración
            setMessage('Revisa tu correo para restablecer la contraseña.');
            setIsEmailSent(true); // Marcar que el correo fue enviado
        } catch (error) {
            console.error('Error al enviar el correo:', error); // Depuración
            setMessage('Error al enviar el correo.');
        }
    };

    // Restablecer la contraseña con el código recibido en el enlace
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        console.log('Restableciendo contraseña con código:', oobCode); // Depuración
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            console.log('Contraseña restablecida correctamente'); // Depuración
            setMessage('Contraseña restablecida. Ahora puedes iniciar sesión.');
            setIsSuccess(true); // Mostrar mensaje de éxito
        } catch (error) {
            console.error('Error al restablecer la contraseña:', error); // Depuración
            setMessage('Error al restablecer la contraseña.');
        }
    };

    // Mostrar mensaje de éxito si se pasa el oobCode
    useEffect(() => {
        if (oobCode) {
            setMessage('Enlace de restablecimiento válido. Por favor, ingrese la nueva contraseña.');
        }
    }, [oobCode]);

    return (
        <div className='px-10 pt-5 text-gray-500 text-sm'>
            <h2 className='mb-2'>Recuperar Contraseña</h2>

            {isSuccess ? (
                // Mensaje de éxito
                <div>
                    <p>Tu contraseña ha sido restablecida con éxito. Puedes iniciar sesión ahora.</p>
                    <button onClick={() => navigate('/login')} className='underline text-amber-700'>
                        Ir a Iniciar sesión
                    </button>
                </div>
            ) : (
                <>
                    {isEmailSent ? (
                        // Solo se muestra un mensaje de éxito, sin formulario, después de enviar el correo
                        <div>
                            <p>{message}</p>
                        </div>
                    ) : oobCode ? (
                        // Solo se muestra el formulario para cambiar la contraseña si el oobCode está presente en la URL
                        <form className='' onSubmit={handleChangePassword}>
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button type="submit">Cambiar Contraseña</button>
                        </form>
                    ) : (
                        // Formulario para ingresar el correo de restablecimiento
                        <form className='' onSubmit={handleSendResetEmail}>
                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-gray-500"
                            />
                            <button type="submit" className='mt-2 underline text-amber-700'>Enviar enlace</button>
                        </form>
                    )}
                </>
            )}

            {message && !isSuccess && !isEmailSent && <p>{message}</p>}
        </div>
    );
};

export default RecoverPassword;
