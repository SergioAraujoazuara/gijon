// emailService.js
import emailjs from 'emailjs-com';

export const sendEmail = (nombreProyecto, ppi, obra, tramo, userName, email) => {
    return emailjs.send(
        'service_a6rjwno',     // Coloca aquí tu Service ID
        'template_d5fcnpx',    // Coloca aquí tu Template ID
        {
            from_name: 'TPF ingenieria | App inspección',
            to_name: userName,
            to_email: 'sergio.araujo@tpfingenieria.com',
            proyecto: nombreProyecto,
            ppi: ppi,
            obra: obra,
            tramo: tramo
        },
        'ALQvMI2C295uJ8HRz'      // Coloca aquí tu Public Key
    )
    .then((result) => {
        console.log('Correo enviado con éxito', result.status, result.text);
    })
    .catch((error) => {
        console.error('Error al enviar el correo', error);
    });
};
