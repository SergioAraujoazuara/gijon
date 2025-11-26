import React from 'react'
import emailjs from 'emailjs-com';
  /**
     * Sends an email notification using EmailJS service
     * 
     * This function is triggered when the user clicks the "Send" button. 
     * It sends an email to the specified recipient with a notification that 
     * a PDF report has been generated and is available for review in the app.
     * 
     * The email is sent using the EmailJS service with configuration variables 
     * stored in environment variables.
     */
function SendMail() {
    const sendEmail = () => {
        emailjs.send(
          import.meta.env.VITE_SENDEMAIL_SERVICE_ID,     
          import.meta.env.VITE_SENDEMAIL_TEMPLATE_ID,    
          {
            from_name: 'TPF ingenieria | App inspección',
            to_name: 'Nombre de usuario',
            to_email: 'tpfingenieriaspain@gmail.com',   
            message: 'Se ha generado un informe pdf, ya puedes consultarlo en la app',
          },
          import.meta.env.VITE_SENDEMAIL_PUBLIC_KEY     
        )
        .then((result) => {
          console.log('Correo enviado con éxito', result.status, result.text);
        })
        .catch((error) => {
          console.error('Error al enviar el correo', error);
        });
      };


    return (
        <div>
            <p>SendMail</p>
            <button className='bg-amber-400 p-4' onClick={sendEmail}>Envar</button>
        </div>
    )
}

export default SendMail
