import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, getDocs, query, collection, where, doc, updateDoc, increment } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import { BsClipboardCheck } from "react-icons/bs";
import { IoCloseCircle } from "react-icons/io5";
import { IoWarningOutline } from "react-icons/io5";
import { PiWarningCircleLight } from "react-icons/pi";
import { IoMdAddCircle } from "react-icons/io";
import FormularioInspeccion from '../../Components/FormularioInspeccion'

function TablaPpi() {
    const generatePDF = async () => {

        //! Configuracion del pdf ///////////////////////////////////////////////////////////////////////////////////

        // Variables globales
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // Tamaño de la página para A4 en puntos
        const imageOk = 'https://cdn-icons-png.freepik.com/256/7778/7778643.png?semt=ais_hybrid'
        const imageNotOk = 'https://cdn-icons-png.flaticon.com/512/1304/1304038.png'
        const greenColor = rgb(0, 0.5, 0);  // Verde oscuro
        const redColor = rgb(1, 0, 0);      // Rojo

        // Añadir contenido al PDF
        const { width, height } = page.getSize();

        // Cargar las fuentes regular y en negrita
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Funcion configuracion texto
        const addText = (text, x, y, fontSize, font, color = rgb(0, 0, 0)) => { // Color negro por defecto
            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font: font,
                color: color,
            });
        };

        // Función para agregar una línea horizontal
        const addHorizontalLine = (x1, y, x2, lineWidth) => {
            page.drawLine({
                start: { x: x1, y },
                end: { x: x2, y },
                thickness: lineWidth,
                color: rgb(0, 0, 0), // Color negro
            });
        };

        // Función para agregar imágenes al PDF
        const embedImage = async (imagePath, x, y, width, height) => {
            const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);
            page.drawImage(image, {
                x,
                y,
                width,
                height,
            });
        };

        //! Diseño pdf ////////////////////////////////////////////////////////////////////////////////////////

        //* Encabezado **********

        addText(titulo, 40, height - 35, 12, boldFont);
        addText(nombreProyecto, 40, height - 50, 12, boldFont);

        // Condición para elegir el color del texto basado en el resultado de la inspección
        const textColor = documentoFormulario.resultadoInspeccion === 'Apto' ? greenColor : redColor;

        // Añadir texto con el color condicional
        addText(documentoFormulario.resultadoInspeccion || '', 500, height - 90, 12, boldFont, textColor);

        // Condicional para mostrar la imagen correspondiente basado en el resultado
        // Primero, verifica si el resultado de la inspección es 'Apto'
        if (documentoFormulario.resultadoInspeccion === 'Apto') {
            // Mostrar la imagen "Ok" si el resultado es "Apto"
            await embedImage(imageOk, 475, height - 95, 20, 20);
        } else if (documentoFormulario.resultadoInspeccion === 'No apto') {
            // Mostrar la imagen "Not Ok" si el resultado es "No apto"
            await embedImage(imageNotOk, 475, height - 95, 20, 20);
        } else {
            // No hacer nada si el resultado es undefined, null, o cualquier otro valor no manejado
            // No se muestra ninguna imagen.
        }
        // Agregar imágenes al lado del nombre del proyecto
        await embedImage(imagenPath2, 380, height - 58, 80, 45); // Ajusta las coordenadas y dimensiones según sea necesario
        await embedImage(imagenPath, 490, height - 55, 70, 35); // Ajusta las coordenadas y dimensiones según sea necesario

        // Agregar una línea horizontal debajo del nombre del proyecto
        addHorizontalLine(40, height - 65, 555, 1); // Ajusta las coordenadas y el grosor según sea necesario


        //* Datos *******************************************************************************************************************

        addText(documentoFormulario.obra, 40, height - 80, 10);
        addText(documentoFormulario.tramo, 40, height - 95, 10);




        // Función para agregar una línea horizontal con un color específico
        const addColoredHorizontalLine = (x1, y, x2, lineWidth, color) => {
            page.drawLine({
                start: { x: x1, y },
                end: { x: x2, y },
                thickness: lineWidth,
                color: rgb(color[0], color[1], color[2]), // Convertir los valores de color al rango correcto
            });
        };

        // Función para convertir un color hexadecimal a RGB
        const hexToRgb = (hex) => {
            // Eliminar el '#' del inicio si está presente
            hex = hex.replace(/^#/, '');

            // Convertir el color hexadecimal a RGB
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;

            return [r / 255, g / 255, b / 255];
        };

        // Función para agregar texto en múltiples líneas
        const addTextInLines = (text, x, start_y, fontSize, lineGap, maxWordsPerLine = 12) => {
            const words = text.split(' ');
            let currentLine = '';
            let y = start_y;

            words.forEach((word, index) => {
                currentLine += word + ' ';
                if ((index + 1) % maxWordsPerLine === 0 || index === words.length - 1) {
                    addText(currentLine, x, y, fontSize);
                    y -= lineGap; // Moverse hacia abajo para la siguiente línea
                    currentLine = ''; // Resetear la línea actual
                }
            });
            return y; // Retornar la posición y final
        };

        // Llamada a la función para convertir el color hexadecimal a RGB
        const color = hexToRgb('#e5e7eb');
        // Llamada a la función para agregar la línea horizontal con el color especificado
        addColoredHorizontalLine(40, height - 118, 555, 20, color); // Azul

        //! Columna trazabilidad

        addText('Trazabilidad', 50, height - 122, 10, boldFont);

        //* Columna 1
        addText(`Pk inicial: `, 50, height - 145, 10, boldFont);
        addText(loteInfo.pkInicial, 100, height - 145, 10, regularFont);
        addText(`Pk final: `, 50, height - 160, 10, boldFont);
        addText(loteInfo.pkFinal, 90, height - 160, 10, regularFont);
        addText(`Sector: `, 50, height - 175, 10, boldFont);
        addText(documentoFormulario.sector, 88, height - 175, 10, regularFont);
        addText(`Sub Sector: `, 50, height - 190, 10, boldFont);
        addText(documentoFormulario.subSector, 110, height - 190, 10, regularFont);
        addText(`Parte:`, 50, height - 205, 10, boldFont);
        addText(documentoFormulario.parte, 80, height - 205, 10, regularFont);

        //* Columna 2     
        addText(`Elemento:`, 320, height - 145, 10, boldFont);
        addText(documentoFormulario.elemento, 370, height - 145, 10, regularFont);
        addText(`Lote:`, 320, height - 160, 10, boldFont);
        addText(documentoFormulario.lote, 350, height - 160, 10, regularFont);
        addText(`Nombre modelo: `, 320, height - 175, 10, boldFont);
        addText(documentoFormulario.nombreGlobalId, 405, height - 175, 10, regularFont);
        addText(`GlobalId modelo: `, 320, height - 190, 10, boldFont);
        addText(documentoFormulario.globalId, 410, height - 190, 10, regularFont);

        //! Columna PPI
        // Llamada a la función para agregar la línea horizontal con el color especificado
        addColoredHorizontalLine(40, height - 230, 555, 20, color); // Azul
        addText('PPI', 50, height - 235, 10, boldFont);

        addText(`Nombre PPI:`, 50, height - 260, 10, boldFont);
        addText(documentoFormulario.ppiNombre, 115, height - 260, 10, regularFont);
        addText(`Actividad: `, 50, height - 275, 10, boldFont);
        addText(`${documentoFormulario.num_actividad}. ${documentoFormulario.actividad}`, 105, height - 275, 10, regularFont);
        // Añadir 'Sub actividad'
        addText(`Sub actividad: `, 50, height - 290, 10, boldFont);
        let newY = addTextInLines(
            `(V-${documentoFormulario.version_subactividad}) ${documentoFormulario.numero_subactividad}. ${documentoFormulario.subactividad}`,
            50, // x inicial
            height - 305, // y inicial
            10, // tamaño de fuente
            15, // espacio entre líneas
            13, // máximas palabras por línea
            regularFont // fuente
        );

        // Asegúrate de dejar un espacio después de 'Sub actividad' si es necesario
        newY -= 2; // Ajusta este valor según sea necesario para el espacio deseado

        // Añadir 'Criterio de aceptación' usando la nueva posición 'y' debajo de 'Sub actividad'
        addText(`Criterio de aceptación: `, 50, newY, 10, boldFont);
        let newY2 = addTextInLines(
            `${documentoFormulario.criterio_aceptacion}`,
            50, // x inicial
            newY - 15, // comienza un poco más abajo de donde terminó 'Sub actividad'
            10, // tamaño de fuente
            15, // espacio entre líneas
            13, // máximas palabras por línea
            regularFont // fuente
        );

        // Añadir 'Doc. ref' dividido en título y contenido
        newY2 -= 2; // Espacio entre 'Criterio de aceptación' y 'Doc. ref'
        addText(`Doc. ref:`, 50, newY2, 10, boldFont); // Título en negritas
        addText(documentoFormulario.documentacion_referencia, 95, newY2, 10, regularFont); // Contenido en fuente normal

        // Añadir 'Tipo inspección' dividido en título y contenido
        newY2 -= 15; // Espacio entre 'Doc. ref' y 'Tipo inspección'
        addText(`Tipo inspección:`, 50, newY2, 10, boldFont); // Título en negritas
        addText(documentoFormulario.tipo_inspeccion, 132, newY2, 10, regularFont); // Contenido en fuente normal


        //! Columna Resultado inspeccion
        // Llamada a la función para agregar la línea horizontal con el color especificado
        addColoredHorizontalLine(40, height - 430, 525, 20, color); // Azul
        addText('Inspección', 50, height - 433, 10, boldFont);

        // Añade texto en verde
        addText(`Resultado: `, 50, height - 460, 10, boldFont);

        // Añadir texto con el color condicional
        addText(documentoFormulario.resultadoInspeccion || '', 125, height - 460, 10, boldFont, textColor);

        // Condicional para mostrar la imagen correspondiente basado en el resultado
        // Primero, verifica si el resultado de la inspección es 'Apto'
        if (documentoFormulario.resultadoInspeccion === 'Apto') {
            // Mostrar la imagen "Ok" si el resultado es "Apto"
            await embedImage(imageOk, 105, height - 463, 15, 15);
        } else if (documentoFormulario.resultadoInspeccion === 'No apto') {
            // Mostrar la imagen "Not Ok" si el resultado es "No apto"
            await embedImage(imageNotOk, 105, height - 463, 15, 15);
        } else {
            // No hacer nada si el resultado es undefined, null, o cualquier otro valor no manejado
            // No se muestra ninguna imagen.
        }


        addText('Fecha y hora inicial: ', 50, height - 475, 10, boldFont);
        addText(documentoFormulario.fechaHoraActual || '', 150, height - 475, 10);
        addText('Fecha y hora final: ', 50, height - 490, 10, boldFont);
        addText(documentoFormulario.fechaHoraActual || '', 150, height - 490, 10);
        addText('Número de inspecciones realizadas: ', 50, height - 505, 10, boldFont);
        addText('1' || '', 225, height - 505, 10);

        // Llamada a la función para agregar la línea horizontal con el color especificado
        addColoredHorizontalLine(40, height - 530, 555, 20, color); // Azul
        addText('Observaciones', 50, height - 533, 10, boldFont);
        addText(documentoFormulario.observaciones, 90, height - 560, 10);


        // Guardar el PDF en un archivo
        const pdfBytes = await pdfDoc.save();

        // Convierte los bytes del PDF en un Blob
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Descarga el PDF
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'formulario.pdf';
        link.click();
        URL.revokeObjectURL(pdfUrl);

        cerrarModalYLimpiarDatos();
    };





    const generatePDF = async () => {
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage([595, 842]); // Tamaño de página A4
        let { height } = currentPage.getSize();
        let currentY = height - 950; // Establecer la posición Y inicial
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const blackColor = rgb(0, 0, 0); // Color negro
    
        const addText = async (text, fontSize, font, maxWidth = 555) => {
            const words = text.split(' ');
            let currentLine = '';
            let spaceLeft = currentY; // Espacio vertical restante en la página
    
            for (const word of words) {
                let testLine = currentLine + word + ' ';
                let testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
                if (testWidth > maxWidth && maxWidth !== 0) {
                    if (currentLine !== '') {
                        currentPage.drawText(currentLine, { x: 40, y: currentY, size: fontSize, font, color: blackColor });
                        spaceLeft -= fontSize * 1.4;
                        if (spaceLeft < fontSize * 1.4) {
                            currentPage = pdfDoc.addPage([595, 842]); // Agregar una nueva página
                            currentY = height - 50; // Restablecer la posición Y
                            spaceLeft = currentY;
                        }
                        currentLine = '';
                        currentY -= fontSize * 1.4;
                    }
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            }
    
            if (currentLine !== '') {
                currentPage.drawText(currentLine, { x: 40, y: currentY, size: fontSize, font, color: blackColor });
                spaceLeft -= fontSize * 1.4;
                if (spaceLeft < fontSize * 1.4) {
                    currentPage = pdfDoc.addPage([595, 842]); // Agregar una nueva página
                    currentY = height - 50; // Restablecer la posición Y
                }
            }
            currentY -= fontSize * 1.4; // Ajustar la posición Y para el siguiente texto
        };
    
        // Llama a la función addText con tu texto y el tamaño de fuente deseado
        await addText('Texto largo aquí Texto largo aquí Texto largo aquíTexto largo aquí Texto largo aquí Texto largo aquí Texto largo aquí Texto largo aquí', 12, boldFont);
    
        // Guardar y descargar PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'documento.pdf';
        link.click();
        URL.revokeObjectURL(pdfUrl);
    
        // Función para cerrar modal y limpiar datos si es necesario
        cerrarModalYLimpiarDatos();
    };





    const generatePDF = async () => {
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage([595, 842]); // Inicializa la primera página
        let currentY = currentPage.getSize().height; // Inicializa la coordenada Y actual

        const { height } = currentPage.getSize();

        // Funciones auxiliares
        const blackColor = rgb(0, 0, 0); // Color negro
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Función para añadir texto y calcular el espacio vertical usado
        const addText = (text, x, y, fontSize, font, currentPage, color = blackColor, maxWidth = 555) => {
            const words = text.split(' ');
            let currentLine = '';
            let currentY = y;

            words.forEach(word => {
                let testLine = currentLine + word + " ";
                let testWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (testWidth > maxWidth && maxWidth !== 0) {
                    if (currentLine !== '') {
                        currentPage.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
                        currentLine = '';
                        currentY -= fontSize * 1.4; // Ajuste para la siguiente línea
                    }
                    if (currentY < fontSize * 1.4) {
                        currentPage = pdfDoc.addPage([595, 842]);
                        currentY = currentPage.getSize().height - fontSize * 1.4;
                    }
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine !== '') {
                currentPage.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
            }

            return { lastY: currentY, page: currentPage };
        };

        function hexToRgb(hex) {
            // Asegurarse de que el hex tiene el formato correcto
            hex = hex.replace("#", "");
            if (hex.length === 3) {
                hex = hex.split('').map((hex) => {
                    return hex + hex;
                }).join('');
            }

            // Convertir hex a rgb
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            return rgb(r, g, b);
        }

        const addHorizontalLine = (x1, y, x2, thickness, hexColor = "#000000") => {
            const color = hexToRgb(hexColor);
            currentPage.drawLine({
                start: { x: x1, y },
                end: { x: x2, y },
                thickness: thickness,
                color: color,
            });
        };


        // Función para agregar imágenes al PDF
        const embedImage = async (imagePath, x, y, width, height) => {
            const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);
            currentPage.drawImage(image, {
                x,
                y,
                width,
                height,
            });
        };

        const textoLargo = 'Estlíneasnecesitar múltiples líneas';

        // Agregar imágenes al lado del nombre del proyecto
        await embedImage(imagenPath2, 380, height - 58, 80, 45); // Ajusta las coordenadas y dimensiones según sea necesario
        await embedImage(imagenPath, 490, height - 55, 70, 35); // Ajusta las coordenadas y dimensiones según sea necesario


          // Primero, asegurémonos de que todos los elementos anteriores estén correctamente posicionados
    let result = addText(titulo, 40, currentY - 35, 12, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(nombreProyecto, 40, currentY - 15, 12, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    addHorizontalLine(40, currentY - 10, 555, 1, "#000000", currentPage);

    result = addText(documentoFormulario.obra, 50, currentY - 35, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(documentoFormulario.tramo, 50, currentY - 15, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    addHorizontalLine(40, currentY - 30, 555, 30, "#e2e8f0", currentPage);

    result = addText("Trazabilidad: ", 50, currentY - 34, 12, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Pk inicial: ", 50, currentY - 30, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 105, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Pk final: ", 50, currentY - 20, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 95, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Sector: ", 50, currentY - 20, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 90, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Sub sector: ", 50, currentY - 20, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 110, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Parte: ", 50, currentY - 30, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 85, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText("Elemento: ", 50, currentY - 30, 10, boldFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;

    result = addText(textoLargo, 105, currentY, 10, regularFont, currentPage);
    currentPage = result.page;
    currentY = result.lastY;



        

        // Guardar y descargar PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'documento.pdf';
        link.click();
        URL.revokeObjectURL(pdfUrl);

        // Función para cerrar modal y limpiar datos si es necesario
        cerrarModalYLimpiarDatos();
    };

// Función para añadir texto y calcular el espacio vertical usado
const addText = (text, x, y, fontSize, font, currentPage, color = blackColor, maxWidth = 420) => {
    const words = text.split(' ');
    let currentLine = '';
    let currentY = y;

    words.forEach(word => {
        let testLine = currentLine + word + " ";
        let testWidth = font.widthOfTextAtSize(testLine, fontSize);

        // Verifica si la línea de prueba es más larga que el ancho máximo permitido
        if (testWidth > maxWidth) {
            // Dibuja la línea actual si no está vacía
            if (currentLine !== '') {
                currentPage.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
                currentLine = ''; // Reinicia la línea actual
                currentY -= fontSize * 1.4; // Ajusta la posición Y para la nueva línea
            }
            // Verifica si la posición Y actual es menos que la altura mínima requerida para una nueva línea
            if (currentY < fontSize * 1.4) {
                currentPage = pdfDoc.addPage([595, 842]); // Añade una nueva página
                currentY = currentPage.getSize().height - fontSize * 1.4; // Restablece la posición Y en la nueva página
            }
            currentLine = word + ' '; // Inicia una nueva línea con la palabra actual
        } else {
            currentLine = testLine; // Agrega la palabra a la línea actual
        }
    });

    // Dibuja cualquier texto restante que no haya sido agregado todavía
    if (currentLine !== '') {
        currentPage.drawText(currentLine, { x, y: currentY, size: fontSize, font, color });
    }

    return { lastY: currentY, page: currentPage };
};

    const { idLote } = useParams();
    const navigate = useNavigate();
    const [ppi, setPpi] = useState(null);



    useEffect(() => {
        const obtenerInspecciones = async () => {
            try {
                const inspeccionesRef = collection(db, "lotes", idLote, "inspecciones");
                const querySnapshot = await getDocs(inspeccionesRef);

                const inspeccionesData = querySnapshot.docs.map(doc => ({
                    docId: doc.id, // Almacena el ID del documento generado automáticamente por Firestore
                    ...doc.data()
                }));

                // Asegúrate de que este paso esté ajustado a cómo manejas los datos en tu aplicación
                if (inspeccionesData.length > 0) {
                    setPpi(inspeccionesData[0]);
                    setPpiNombre(inspeccionesData[0].nombre) // O maneja múltiples inspecciones según sea necesario
                } else {
                    console.log('No se encontraron inspecciones para el lote con el ID:', idLote);
                    setPpi(null);
                }
            } catch (error) {
                console.error('Error al obtener las inspecciones:', error);
            }
        };



        obtenerInspecciones();
        console.log(ppi)
    }, [idLote]); // Dependencia del efecto basada en idLote

    useEffect(() => {

        console.log(ppi)
    }, []);




    const regresar = () => {
        navigate(-1); // Regresa a la página anterior
    };





    const [seleccionApto, setSeleccionApto] = useState({});
    const [tempSeleccion, setTempSeleccion] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [modal, setModal] = useState(false);
    const [modalFormulario, setModalFormulario] = useState(false);
    const [currentSubactividadId, setCurrentSubactividadId] = useState(null);

    const [ppiNombre, setPpiNombre] = useState('');






    const handleOpenModal = (subactividadId) => {
        setCurrentSubactividadId(subactividadId);
        console.log(subactividadId)
        // Inicializar la selección temporal con el valor actual si existe
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        setModal(true);
    };

    const handleOpenModalFormulario = (subactividadId) => {


        setCurrentSubactividadId(subactividadId);
        console.log(subactividadId)
        // Inicializar la selección temporal con el valor actual si existe
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        setModalFormulario(true);
    };



    const handleCloseModal = () => {
        setModal(false)
        setModalFormulario(false)

    };

    const handleGuardarTemporal = () => {
        // Solo muestra la confirmación, no aplica la selección todavía
        setMostrarConfirmacion(true);
    };

    const handleConfirmarGuardar = async () => {
        const fechaHoraActual = new Date().toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });

        const hashFirma = 'GSJDJDN5663VDHSDN';

        if (currentSubactividadId && tempSeleccion !== null) {
            // Encuentra el índice de la actividad y de la subactividad desde el ID
            const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);

            // Prepara la evaluación de la subactividad seleccionada
            const evaluacionSubactividad = {

                enviado: true,
                fecha: fechaHoraActual,
                responsable: nombreResponsable,
                firma: hashFirma.toString(),
                comentario: comentario,
            };

            // Actualiza siempre la subactividad seleccionada con la nueva evaluación
            let subactividadActualizada = { ...ppi.actividades[actividadIndex].subactividades[subactividadIndex], ...evaluacionSubactividad };
            ppi.actividades[actividadIndex].subactividades[subactividadIndex] = subactividadActualizada;

            // Si la evaluación es "No apto", agrega una nueva subactividad para una futura inspección
            if (tempSeleccion === "No apto") {
                let nuevaSubactividad = { ...subactividadActualizada };
                const numeroPartes = subactividadActualizada.numero.split('.');
                if (numeroPartes.length === 2) {
                    nuevaSubactividad.numero += ".1";
                } else if (numeroPartes.length > 2) {
                    let repeticion = parseInt(numeroPartes.pop(), 10) + 1;
                    numeroPartes.push(repeticion.toString());
                    nuevaSubactividad.numero = numeroPartes.join('.');
                }

                // La nueva subactividad copiada no debe incluir los datos específicos de la evaluación
                delete nuevaSubactividad.resultadoInspeccion;
                delete nuevaSubactividad.enviado;
                delete nuevaSubactividad.fecha;
                delete nuevaSubactividad.responsable;
                delete nuevaSubactividad.firma;
                delete nuevaSubactividad.comentario;

                ppi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividad);
            }

            // Actualiza Firestore con el nuevo objeto ppi
            await actualizarPpiEnFirestore(ppi);

            // Limpia el formulario y cierra el modal
            setComentario('');
            setMostrarConfirmacion(false);
            setTempSeleccion(null);
            setModal(false);
        }
    };






    const actualizarPpiEnFirestore = async (nuevoPpi) => {
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            // Aquí, "docId" es el ID del documento de Firestore donde se almacenan los datos del PPI.
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", nuevoPpi.docId);

            // Prepara los datos que se van a actualizar. En este caso, actualizamos todo el objeto de actividades.
            const updatedData = {
                actividades: nuevoPpi.actividades.map(actividad => ({
                    ...actividad,
                    subactividades: actividad.subactividades.map(subactividad => ({
                        numero: subactividad.numero,
                        nombre: subactividad.nombre,
                        criterio_aceptacion: subactividad.criterio_aceptacion,
                        documentacion_referencia: subactividad.documentacion_referencia,
                        tipo_inspeccion: subactividad.tipo_inspeccion,
                        punto: subactividad.punto,
                        responsable: subactividad.responsable || '',
                        fecha: subactividad.fecha || '',
                        firma: subactividad.firma || '',
                        comentario: subactividad.comentario || '',
                        resultadoInspeccion: subactividad.resultadoInspeccion || '',
                        formularioEnviado: subactividad.formularioEnviado || '',
                        idRegistroFormulario: subactividad.idRegistroFormulario || ''
                        // Agrega aquí más campos si son necesarios.
                    }))
                }))
            };

            // Realiza la actualización en Firestore.
            await updateDoc(ppiRef, updatedData);

            console.log("PPI actualizado con éxito en Firestore.");
        } catch (error) {
            console.error("Error al actualizar PPI en Firestore:", error);
        }
    };


    // agregar cometarios
    const [comentario, setComentario] = useState("");

    const [resultadoInspeccion, setResultadoInspeccion] = useState("");

    // Define la fecha, el responsable y genera la firma aquí
    const fechaHoraActual = new Date().toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const nombreResponsable = "Usuario"; // Asumiendo que tienes una forma de obtener el nombre del usuario

    const firma = '9c8245e6e0b74cfccg97e8714u3234228fb4xcd2'

    const marcarFormularioComoEnviado = async (idRegistroFormulario, resultadoInspeccion,) => {
        if (!ppi || !currentSubactividadId) {
            console.error("PPI o subactividad no definida.");
            return;
        }

        // Divide el ID para obtener índices de actividad y subactividad
        const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);

        // Crea una copia del estado actual del PPI para modificarlo
        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex];

        // Actualiza los campos con los datos necesarios
        subactividadSeleccionada.formularioEnviado = true;
        subactividadSeleccionada.idRegistroFormulario = idRegistroFormulario;
        subactividadSeleccionada.resultadoInspeccion = resultadoInspeccion;
        subactividadSeleccionada.fecha = fechaHoraActual;
        subactividadSeleccionada.responsable = nombreResponsable;
        subactividadSeleccionada.firma = firma;
        subactividadSeleccionada.comentario = comentario;

        // Si la inspección es "Apto", incrementa el contador de actividadesAptas en el lote
        if (resultadoInspeccion === "Apto") {
            const loteRef = doc(db, "lotes", idLote);
            await updateDoc(loteRef, {
                actividadesAptas: increment(1)
            });
        }

        // Si la inspección es No Apto, duplica la subactividad para una futura inspección
        if (resultadoInspeccion === "No apto") {
            let nuevaSubactividad = { ...subactividadSeleccionada };

            // Eliminar o reiniciar propiedades específicas de la evaluación para la nueva subactividad
            delete nuevaSubactividad.resultadoInspeccion;
            delete nuevaSubactividad.enviado;
            delete nuevaSubactividad.idRegistroFormulario;

            // Restablecer los valores de Responsable, Fecha, Comentarios e Inspección
            // Aquí asumimos que quieres restablecerlos a valores vacíos o predeterminados
            nuevaSubactividad.responsable = '';
            nuevaSubactividad.fecha = '';
            nuevaSubactividad.comentario = '';
            // Para el campo Inspección, asegúrate de restablecerlo según cómo lo manejas en tu modelo de datos
            // Si Inspección se maneja con otro campo o de otra forma, ajusta esta línea acorde a tu implementación
            // Por ejemplo, si 'inspeccion' es un campo booleano que indica si se ha realizado una inspección
            nuevaSubactividad.formularioEnviado = false; // Ajusta el nombre del campo y el valor según tu caso


            // Incrementa el número de versión de la nueva subactividad
            if (nuevaSubactividad.version) {
                nuevaSubactividad.version = String(parseInt(nuevaSubactividad.version) + 1);
            } else {
                // Si por alguna razón la subactividad original no tiene número de versión, se inicializa a 1
                nuevaSubactividad.version = "1";
            }

            // Inserta la nueva subactividad en el PPI
            nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividad);
        }


        // Actualiza la subactividad en el array
        nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = subactividadSeleccionada;

        // Llama a la función que actualiza los datos en Firestore
        await actualizarFormularioEnFirestore(nuevoPpi);
    };






    const actualizarFormularioEnFirestore = async (nuevoPpi) => {
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            // Aquí, "docId" es el ID del documento de Firestore donde se almacenan los datos del PPI.
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", nuevoPpi.docId);

            // Prepara los datos que se van a actualizar. En este caso, actualizamos todo el objeto de PPI.
            const updatedData = {
                actividades: nuevoPpi.actividades.map(actividad => ({
                    ...actividad,
                    subactividades: actividad.subactividades.map(subactividad => ({
                        ...subactividad,

                    }))
                }))
            };

            // Realiza la actualización en Firestore.
            await updateDoc(ppiRef, updatedData);

            console.log("PPI actualizado con éxito en Firestore.");
        } catch (error) {
            console.error("Error al actualizar PPI en Firestore:", error);
        }
    };

    const [modalPdf, setModalPdf] = useState(false)

    const [mostrarFormularioInspeccion, setMostrarFormularioInspeccion] = useState(false);

    const [generarInforme, setGenerarInforme] = useState("no");
    return (
        <div className='min-h-screen px-14 py-5 text-gray-500 text-sm'>
            <div className='flex gap-2 items-center justify start bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'/'}>
                    <h1 className=' text-gray-500'>Inicio</h1>
                </Link>

                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />

                <h1 className='cursor-pointer text-gray-500' onClick={regresar}>Elementos</h1>

                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'#'}>
                    <h1 className='font-medium text-amber-600'>Ppi: {ppiNombre}</h1>
                </Link>

            </div>

            <div className='flex gap-3 flex-col mt-5 bg-white p-8 rounded-xl shadow-md'>
                <div className="w-full rounded-xl overflow-x-auto">
                    <div>
                        <div className="w-full bg-gray-300 text-gray-600 text-sm font-medium py-3 px-3 grid grid-cols-24">
                            <div className='col-span-1'>Versión</div>
                            <div className='col-span-1'>Nº</div>

                            <div className="col-span-3">Actividad</div>
                            <div className="col-span-4">Criterio de aceptación</div>
                            <div className="col-span-2 text-center">Documentación de referencia</div>
                            <div className="col-span-2 text-center">Tipo de inspección</div>
                            <div className="col-span-1 text-center">Punto</div>
                            <div className="col-span-2 text-center">Responsable</div>
                            <div className="col-span-2 text-center">Fecha</div>
                            <div className="col-span-3 text-center">Comentarios</div>
                            {/* <div className="col-span-2 text-center">Estatus</div> */}
                            {/* <div className="col-span-1 text-center">Inspección</div> */}
                            <div className="col-span-3 text-center">Estado</div>

                        </div>


                        <div>
                            {ppi && ppi.actividades.map((actividad, indexActividad) => [
                                // Row for activity name
                                <div key={`actividad-${indexActividad}`} className="bg-gray-200 grid grid-cols-24 items-center px-3 py-3 border-b border-gray-200 text-sm font-medium">
                                    <div className="col-span-1">

                                        (V)

                                    </div>
                                    <div className="col-span-1">

                                        {actividad.numero}

                                    </div>
                                    <div className="col-span-22">

                                        {actividad.actividad}

                                    </div>
                                    {/* <button
                                        type="button"
                                        onClick={() => addSubactividad(indexActividad)}
                                        className="mt-2 mb-2 bg-green-200"
                                    >
                                        Añadir Subactividad
                                    </button> */}
                                </div>,
                                // Rows for subactividades
                                ...actividad.subactividades.map((subactividad, indexSubactividad) => (
                                    <div key={`subactividad-${indexActividad}-${indexSubactividad}`} className="grid grid-cols-24 items-center border-b border-gray-200 text-sm">
                                        <div className="col-span-1 px-3 py-5 ">
                                            V-{subactividad.version}  {/* Combina el número de actividad y el índice de subactividad */}
                                        </div>
                                        <div className="col-span-1 px-3 py-5 ">
                                            {subactividad.numero} {/* Combina el número de actividad y el índice de subactividad */}
                                        </div>

                                        <div className="col-span-3 px-3 py-5">
                                            {subactividad.nombre}
                                        </div>

                                        <div className="col-span-4 px-3 py-5">
                                            {subactividad.criterio_aceptacion}
                                        </div>
                                        <div className="col-span-2 px-3 py-5 text-center">
                                            {subactividad.documentacion_referencia}
                                        </div>
                                        <div className="col-span-2 px-3 py-5 text-center">
                                            {subactividad.tipo_inspeccion}
                                        </div>
                                        <div className="col-span-1 px-3 py-5 text-center">
                                            {subactividad.punto}
                                        </div>




                                        <div className="col-span-2 px-3 py-5 text-center">
                                            {subactividad.responsable || ''}
                                        </div>
                                        <div className="col-span-2 px-5 py-5 text-center">
                                            {/* Aquí asumo que quieres mostrar la fecha en esta columna, ajusta según sea necesario */}
                                            {subactividad.fecha || ''}
                                        </div>
                                        <div className="col-span-3 px-5 py-5 text-center">
                                            {subactividad.comentario || ''}
                                        </div>
                                        {/* <div className={`col-span-2 px-5 py-5 text-center`}>
                                            {
                                                subactividad.resultadoInspeccion === "Apto" ? (
                                                    <span className='text-teal-500 font-bold text-3xl flex justify-center'><IoCheckmarkCircle /></span>
                                                ) : subactividad.resultadoInspeccion === "No apto" ? (
                                                    <div><span className='text-red-500 font-bold text-3xl flex justify-center'><IoMdCloseCircle /></span><p className='text-red-500 font-bold'>Repetir</p></div>
                                                ) : (
                                                    <span className='text-yellow-500 font-bold text-2xl flex justify-center'><FaClock /></span>
                                                )
                                            }
                                        </div> */}

                                        {/* 
                                        <div className="col-span-1 px-5 py-5 bg-white flex justify-center">
                                            {subactividad.formularioEnviado ? (
                                                // Si la subactividad ya fue enviada, muestra "Enviado"
                                                <span className="font-bold text-gray-500">Enviado</span>
                                            ) : (
                                                // Si la subactividad aún no ha sido enviada, muestra un ícono para abrir el formulario de inspección
                                                <span
                                                    className="text-gray-500 text-3xl font-bold cursor-pointer"
                                                    onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}>
                                                    <IoMdAddCircle />
                                                </span>
                                            )}
                                        </div> */}


                                        <div className="col-span-3 px-5 py-5 bg-white flex justify-center cursor-pointer" onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}>
                                            {subactividad.formularioEnviado ? (
                                                subactividad.resultadoInspeccion === "Apto" ? (
                                                    <span

                                                        className="w-full font-bold text-medium p-2 rounded  text-center text-teal-600 cursor-pointer">
                                                        Apto

                                                    </span>
                                                ) : subactividad.resultadoInspeccion === "No apto" ? (
                                                    <span

                                                        className="w-full font-bold text-medium p-2 rounded w-full text-center text-red-600 cursor-pointer">
                                                        No apto
                                                    </span>
                                                ) : (
                                                    <span

                                                        className="w-full font-bold text-medium text-3xl p-2 rounded  w-full flex justify-center cursor-pointer">
                                                        <IoMdAddCircle />
                                                    </span>
                                                )
                                            ) : (
                                                <span

                                                    className="w-full font-bold text-medium text-3xl p-2 rounded  w-full flex justify-center cursor-pointer">
                                                    <IoMdAddCircle />
                                                </span>
                                            )}
                                        </div>



                                    </div>
                                ))
                            ])}
                        </div>
                    </div>
                </div>
            </div>



            {modalFormulario && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                    <div className="mx-auto w-[900px] h-[400px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={handleCloseModal}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <div className="my-6">
                            <label htmlFor="resultadoInspeccion" className="block text-xl font-bold text-gray-500 mb-4">
                                Resultado de la inspección:
                            </label>
                            <select
                                id="resultadoInspeccion"
                                value={resultadoInspeccion}
                                onChange={(e) => setResultadoInspeccion(e.target.value)}
                                className="block w-full py-2 text-base border p-2 border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                            >
                                <option value="">Selecciona una opción del desplegable...</option>
                                <option value="Apto">Apto</option>
                                <option value="No apto">No apto</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="comentario" className="block text-gray-500 text-sm font-bold mb-2">Comentarios inspección</label>
                            <textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                        </div>


                        <div className='flex items-center gap-5'>
                            <span>¿Generar un informe Pdf?</span>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        name="generarInforme"
                                        value="si"
                                        checked={generarInforme === "si"}
                                        onChange={(e) => setGenerarInforme(e.target.value)}
                                    />
                                    Sí
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="generarInforme"
                                        value="no"
                                        checked={generarInforme === "no"}
                                        onChange={(e) => setGenerarInforme(e.target.value)}
                                    />
                                    No
                                </label>
                            </div>
                        </div>


                        {generarInforme === "si" && (
                            <FormularioInspeccion
                                setModalFormulario={setModalFormulario}
                                modalFormulario={modalFormulario}
                                currentSubactividadId={currentSubactividadId}
                                ppiSelected={ppi}
                                marcarFormularioComoEnviado={marcarFormularioComoEnviado}
                                actualizarFormularioEnFirestore={actualizarFormularioEnFirestore}
                                resultadoInspeccion={resultadoInspeccion}
                                comentario={comentario}
                                firma={firma}

                                fechaHoraActual={fechaHoraActual}
                                handleCloseModal={handleCloseModal}
                                ppiNombre={ppiNombre}
                                nombreResponsable={nombreResponsable}

                                setResultadoInspeccion={setResultadoInspeccion}

                            />
                        )}







                    </div>

                </div>
            )}

            


        </div>


    );
}

export default TablaPpi;




import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaFilePdf } from "react-icons/fa";
import jsPDF from 'jspdf';
import logo from '../assets/tpf_logo_azul.png'
import { IoIosWarning } from "react-icons/io";
import imageCompression from 'browser-image-compression';
import { db } from '../../../firebase_config';
import { getDoc, getDocs, doc, deleteDoc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc } from 'firebase/firestore';

function FormularioInspeccion({ handleConfirmarEnvioPdf, setMensajeExitoInspeccion, setModalConfirmacionInforme, setModalFormulario, marcarFormularioComoEnviado, resultadoInspeccion, comentario, setComentario, firma, fechaHoraActual, handleCloseModal, ppiNombre, nombreResponsable, setResultadoInspeccion }) {

    const { id } = useParams()
    const { idLote } = useParams()
    const [nombreProyecto, setNombreProyecto] = useState(localStorage.getItem('nombre_proyecto') || '');
    const [numeroRegistro, setNumeroRegistro] = useState('');
    const [fecha, setFecha] = useState('');
    const [ppi, setPpi] = useState('');
    const [plano, setPlano] = useState('');
    // const [observaciones, setObservaciones] = useState('');
    const [sector, setSector] = useState('');
    const [subSector, setSubSector] = useState('');
    const [parte, setParte] = useState('');
    const [elemento, setElemento] = useState('');
    const [lote, setLote] = useState('');
    const [pkInicial, setPkInicial] = useState('');
    const [pkFinal, setPkFinal] = useState('');
    const titulo = "REGISTRO DE INSPECCIÓN DE OBRA REV-1"
    const [imagen, setImagen] = useState(null);
    const [imagen2, setImagen2] = useState(null);
    const imagenPath = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Adif_wordmark.svg/1200px-Adif_wordmark.svg.png"
    const imagenPath2 = logo
    const [obra, setObra] = useState(localStorage.getItem('obra'));
    const [tramo, setTramo] = useState(localStorage.getItem('tramo'));
    const [observaciones, setObservaciones] = useState('');


    useEffect(() => {
        const obtenerLotesPorPpiId = async () => {
            try {
                // Asegúrate de que `id` sea el ID de PPI por el cual quieres filtrar
                const q = query(collection(db, "lotes"), where("ppiId", "==", id));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const lotesData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));


                    setPpi(lotesData);
                } else {

                    setPpi(null);
                }
            } catch (error) {

                setPpi(null);
            }
        };

        if (id) {
            obtenerLotesPorPpiId();
        }
    }, [id]); // Asegúrate de que `id` sea una dependencia del efecto



    const [loteInfo, setLoteInfo] = useState(null); // Estado para almacenar los datos del PPI
    const [sectorInfoLote, setSectorInfoLote] = useState(null); // Estado para almacenar los datos del PPI
    const [idRegistro, setIdRegistro] = useState(''); // Estado para almacenar los datos del PPI


    useEffect(() => {
        const obtenerLotePorId = async () => {
            console.log('**********', idLote)
            if (!idLote) return; // Verifica si idLote está presente

            try {
                const docRef = doc(db, "lotes", idLote); // Crea una referencia al documento usando el id
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    console.log("Datos del lote:", docSnap.data());
                    setLoteInfo({ id: docSnap.id, ...docSnap.data() });
                    console.log({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No se encontró el lote con el ID:", idLote);

                }
            } catch (error) {
                console.error("Error al obtener el lote:", error);

            }
        };

        obtenerLotePorId();
    }, [idLote]);



    const handleImagenChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const options = {
                    maxSizeMB: .3, // (opcional) Tamaño máximo en MB, por ejemplo, 0.5MB
                    maxWidthOrHeight: 600, // (opcional) ajusta la imagen al tamaño máximo (manteniendo la relación de aspecto)
                    useWebWorker: true, // (opcional) Usa un web worker para realizar la compresión en un hilo de fondo
                };
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagen(reader.result); // Almacenar la imagen comprimida en el estado
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleImagenChange2 = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const options = {
                    maxSizeMB: .3, // Tamaño máximo en MB, ajustable según necesites
                    maxWidthOrHeight: 600, // Ajusta la imagen al tamaño máximo (manteniendo la relación de aspecto)
                    useWebWorker: true, // Utiliza un web worker para realizar la compresión en un hilo de fondo
                };
                const compressedFile = await imageCompression(file, options); // Comprimir la imagen
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagen2(reader.result); // Almacenar la imagen comprimida en base64 en el estado
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error al comprimir la imagen:", error);
            }
        }
    };




    const enviarDatosARegistros = async () => {
        // Objeto que representa los datos del formulario
        const datosFormulario = {
            nombreProyecto,
            fechaHoraActual: fechaHoraActual,
            obra: obra,
            tramo: tramo,
            ppiNombre: loteInfo.ppiNombre,
            observaciones: observaciones,
            comentario: comentario,
            sector: loteInfo.sectorNombre,
            subSector: loteInfo.subSectorNombre,
            parte: loteInfo.parteNombre,
            elemento: loteInfo.elementoNombre,
            lote: loteInfo.nombre,
            firma: firma,
            pkInicial: loteInfo.pkInicial,
            pkFinal: loteInfo.pkFinal,
            nombreResponsable: nombreResponsable,
            resultadoInspeccion: resultadoInspeccion,
            imagen: imagen, // imagen en base64
            imagen2: imagen2, // imagen2 en base64
        };

        try {
            // Referencia a la colección 'registros' en Firestore

            const coleccionRegistros = collection(db, "registros");
            const docRef = await addDoc(coleccionRegistros, datosFormulario);

            // Aquí es donde se obtiene el ID del documento recién creado
            const docId = docRef.id;


            // Ahora, actualizamos el documento para incluir su propio ID
            await updateDoc(doc(db, "registros", docId), {
                id: docId // Guarda el ID del documento dentro del mismo documento
            });
            setIdRegistro(docId)
            // Opcionalmente, cierra el modal o limpia el formulario aquí
            setModalFormulario(false);
            setResultadoInspeccion('')
            setObservaciones('')
            setMensajeExitoInspeccion('Inspección completada con éxito')
            console.log("Documento escrito con ID: ", docRef.id);
            return docRef.id; // Devolver el ID del documento creado


        } catch (e) {
            console.error("Error al añadir documento: ", e);
        }
    };

    const handleConfirmarEnvio = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        await handelEnviarFormulario();
        setMostrarConfirmacion(false); // Ocultar el modal de confirmación después de enviar los datos
    };

    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);


    const handelEnviarFormulario = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);
            generatePDF(firma, fechaHoraActual, nombreResponsable);
            handleConfirmarEnvioPdf() // Si también deseas generar el PDF tras enviar el formulario
        }
    };


    const handleSolicitarConfirmacion = () => {
        setMostrarConfirmacion(true);
    };




    const generatePDF = () => {
        const doc = new jsPDF();






        // Establecer el tamaño de fuente deseado
        const fontSize = 10;

        // Tamaño y posición del recuadro
        const rectX = 10;
        const rectY = 10;
        const rectWidth = 190; // Ancho del recuadro
        const rectHeight = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        doc.setFillColor(230, 230, 230); // Gris muy claro casi blanco

        // Dibujar el recuadro con fondo gris
        doc.rect(rectX, rectY, rectWidth, rectHeight, 'F'); // 'F' indica que se debe rellenar el rectángulo

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Colocar texto dentro del recuadro
        doc.text(titulo, 75, 18); // Ajusta las coordenadas según tu diseño
        doc.text(nombreProyecto, 75, 22); // Ajusta las coordenadas según tu diseño

        if (imagenPath2) {
            const imgData = imagenPath2;
            doc.addImage(imgData, 'JPEG', 12, 12, 30, 15); // Ajusta las coordenadas y dimensiones según tu diseño
        }
        if (imagenPath) {
            const imgData = imagenPath;
            doc.addImage(imgData, 'JPEG', 45, 15, 20, 10); // Ajusta las coordenadas y dimensiones según tu diseño
        }

        // Dibujar el borde después de agregar las imágenes
        doc.setDrawColor(0); // Color negro
        doc.rect(rectX, rectY, rectWidth, rectHeight); // Dibujar el borde del rectángulo


        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        // Tamaño y posición del segundo recuadro
        const rectX2 = 10;
        const rectY2 = 30;
        const rectWidth2 = 190; // Ancho del recuadro
        const rectHeight2 = 20; // Altura del recuadro

        // Establecer el ancho de la línea del borde
        const borderWidth = 0.5; // Ancho del borde en puntos

        // Establecer el color de la línea del borde
        doc.setDrawColor(0); // Color negro

        // Dibujar el borde del segundo recuadro
        doc.rect(rectX2, rectY2, rectWidth2, rectHeight2);

        // Establecer el color de fondo para el segundo recuadro
        doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

        // Dibujar el segundo recuadro con fondo gris claro y borde en todos los lados
        doc.rect(rectX2, rectY2, rectWidth2, rectHeight2, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde en todos los lados

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Colocar texto dentro del segundo recuadro
        doc.text(`Obra: ${obra}`, 15, 40);
        doc.text(`Tramo: ${tramo}`, 15, 45);
        doc.text(`Nº de registro: ${id}`, 120, 40);
        doc.text(`Fecha: ${fechaHoraActual}`, 150, 45);


        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        // Tamaño y posición del recuadro
        const rectX3 = 10;
        const rectY3 = 50;
        const rectWidth3 = 190; // Ancho del recuadro
        const rectHeight3 = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro
        doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

        // Dibujar el recuadro con fondo gris claro
        doc.rect(rectX3, rectY3, rectWidth3, rectHeight3, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Colocar texto dentro del recuadro
        doc.text(`PPI: ${ppiNombre}`, 15, 60);
        doc.text(`Plano que aplica: `, 15, 65);


        // Tamaño y posición del recuadro
        const rectX4 = 10;
        const rectY4 = 70;
        const rectWidth4 = 190; // Ancho del recuadro
        const rectHeight4 = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro con fondo gris claro
        doc.rect(rectX4, rectY4, rectWidth4, rectHeight4, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Dibujar el borde del rectángulo
        doc.rect(rectX4, rectY4, rectWidth4, rectHeight4);

        // Texto a colocar con salto de línea
        const textoObservaciones = `Observaciones: ${observaciones}`;

        // Dividir el texto en líneas cada vez que exceda 15 palabras
        const words = textoObservaciones.split(' ');
        const maxWordsPerLine = 15;
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            currentLine += words[i] + ' ';
            if ((i + 1) % maxWordsPerLine === 0 || i === words.length - 1) {
                lines.push(currentLine.trim());
                currentLine = '';
            }
        }

        // Colocar texto en el PDF
        let yPosition = rectY4 + fontSize + 2; // Iniciar la posición dentro del recuadro
        let xPosition = rectX4 + 5; // Ajustar posición x para evitar que el texto toque el borde del rectángulo
        lines.forEach(line => {
            doc.text(line, xPosition, yPosition, { maxWidth: rectWidth4 - 4 }); // Ajustar maxWidth para evitar que el texto exceda el ancho del rectángulo
            yPosition += fontSize + 2; // Aumentar la posición para la siguiente línea
        });

        // Tamaño y posición del recuadro 5
        const rectX5 = 10;
        const rectY5 = 90;
        const rectWidth5 = 190; // Ancho del recuadro
        const rectHeight5 = 80; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 5
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 5 con fondo gris claro
        doc.rect(rectX5, rectY5, rectWidth5, rectHeight5, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Dibujar el borde del recuadro 5
        doc.rect(rectX5, rectY5, rectWidth5, rectHeight5);

        // Colocar texto dentro del recuadro 5
        doc.text(`Sector: ${loteInfo.sectorNombre}`, 15, 100);
        doc.text(`Subsector: ${loteInfo.subSectorNombre}`, 15, 110);
        doc.text(`Parte: ${loteInfo.parteNombre}`, 15, 120);
        doc.text(`Elemento: ${loteInfo.elementoNombre}`, 15, 130);
        doc.text(`Lote: ${loteInfo.nombre}`, 15, 140);
        doc.text(`Pk inicial: ${loteInfo.pkInicial}`, 15, 150);
        doc.text(`Pk final: ${loteInfo.pkFinal}`, 15, 160);

        // Tamaño y posición del recuadro 6
        const rectX6 = 10;
        const rectY6 = 170;
        const rectWidth6 = 190; // Ancho del recuadro
        const rectHeight6 = 70; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 6
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 6 con fondo gris claro
        doc.rect(rectX6, rectY6, rectWidth6, rectHeight6, 'FD');

        // Dibujar el borde del recuadro 6
        doc.rect(rectX6, rectY6, rectWidth6, rectHeight6);

        // Agregar imagen al PDF dentro del recuadro 6
        if (imagen) {
            doc.addImage(imagen, 'JPEG', 25, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
        }
        if (imagen2) {
            doc.addImage(imagen2, 'JPEG', 110, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
        }

        // Tamaño y posición del recuadro 7
        const rectX7 = 10;
        const rectY7 = 240;
        const rectWidth7 = 190; // Ancho del recuadro
        const rectHeight7 = 28; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 7
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 7 con fondo gris claro
        doc.rect(rectX7, rectY7, rectWidth7, rectHeight7, 'FD');

        // Dibujar el borde del recuadro 7
        doc.rect(rectX7, rectY7, rectWidth7, rectHeight7);

        // Colocar texto dentro del recuadro 7
        doc.text('Resultado de la inspección', 150, 250);
        doc.text(resultadoInspeccion, 150, 260);
        doc.text(`Firmado electronicamente con blockchain`, 15, 250);
        // Asegúrate de que la firma es una cadena y no está vacía
        doc.text(firma, 15, 260);







        doc.save('formulario.pdf');
    };





    return (
        <div className='text-gray-500'>
            {/* Navigation section
            <div className='flex gap-2 items-center justify start bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <GoHomeFill style={{ width: 12, height: 12, fill: '#d97706' }} />
                <Link to={'/'}>
                    <h1 className='font-medium text-gray-500 text-amber-600'>Inicio</h1>
                </Link>
                <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                <Link to={'/elemento'}>
                    <h1 className='text-gray-500 text-gray-500'>Elementos</h1>
                </Link>
                <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                <Link to={'/tablaPpi'}>
                    <h1 className='text-gray-500 text-gray-500'>PPI</h1>
                </Link>
                <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                <Link to={'#'}>
                    <h1 className='font-medium text-amber-600'>Formulario</h1>
                </Link>

            </div> */}


            <form className="bg-white text-gray-500  mb-4">
                <div className='grid sm:grid-cols-1 grid-cols-1 gap-4'>

                    {/* Campos de entrada */}
                    <div className="mb-4 hidden">
                        <label htmlFor="Proyecto" className="block text-gray-500 text-sm font-bold mb-2">Proyecto</label>
                        <input type="text" id="Proyecto" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)}
                            className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="numeroRegistro" className="block text-gray-500 text-sm font-bold mb-2">Nº de registro</label>
                        <input type="text" id="numeroRegistro" value={numeroRegistro} onChange={(e) => setNumeroRegistro(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    {/* <div className="mb-4">
                        <label htmlFor="fecha" className="block text-gray-500 text-sm font-bold mb-2">Fecha</label>
                        <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div> */}
                    <div className="mb-4 hidden">
                        <label htmlFor="obra" className="block text-gray-500 text-sm font-bold mb-2">Obra</label>
                        <input type="text" id="obra" value={obra} onChange={(e) => setObra(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="tramo" className="block text-gray-500 text-sm font-bold mb-2">Tramo</label>
                        <input type="text" id="tramo" value={tramo} onChange={(e) => setTramo(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="ppi" className="block text-gray-500 text-sm font-bold mb-2">PPI</label>
                        <input type="text" id="ppi" value={localStorage.getItem('ppi' || '')} onChange={(e) => setPpi(e.target.value)}
                            className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="plano" className="block text-gray-500 text-sm font-bold mb-2">Plano que aplica</label>
                        <input type="text" id="plano" value={plano} onChange={(e) => setPlano(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="imagen" className="block text-gray-500 text-sm font-bold mb-2">Seleccionar imagen</label>
                        <input onChange={handleImagenChange} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="imagen" className="block text-gray-500 text-sm font-bold mb-2">Seleccionar imagen</label>
                        <input onChange={handleImagenChange2} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="observaciones" className="block text-gray-500 text-sm font-bold mb-2">Observaciones</label>
                        <textarea id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                </div>
                {/* Campos de trazabilidad */}
                <div className="mb-4 hidden">
                    <label className="block text-gray-700 text-sm font-bold mb-5">Trazabilidad</label>
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="sector" className="block text-gray-700 text-sm font-bold mb-2">Sector</label>
                            <input
                                type="text" id="sector" value={loteInfo?.sectorNombre || ''} onChange={(e) => setSector(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="subSector" className="block text-gray-700 text-sm font-bold mb-2">Sub sector</label>
                            <input type="text" id="subSector" value={loteInfo?.subSectorNombre || ''} onChange={(e) => setSubSector(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="parte" className="block text-gray-700 text-sm font-bold mb-2">Parte</label>
                            <input type="text" id="parte" value={loteInfo?.parteNombre || ''} onChange={(e) => setParte(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="elemento" className="block text-gray-700 text-sm font-bold mb-2">Elemento</label>
                            <input type="text" id="elemento" value={loteInfo?.elementoNombre || ''} onChange={(e) => setElemento(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="lote" className="block text-gray-700 text-sm font-bold mb-2">Lote</label>
                            <input type="text" id="lote" value={loteInfo?.nombre || ''} onChange={(e) => setLote(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="pkInicial" className="block text-gray-700 text-sm font-bold mb-2">Pk inicial</label>
                            <input type="text" id="pkInicial" value={loteInfo?.pkInicial || ''} onChange={(e) => setPkInicial(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="pkFinal" className="block text-gray-700 text-sm font-bold mb-2">Pk final</label>
                            <input type="text" id="pkFinal" value={loteInfo?.pkFinal || ''} onChange={(e) => setPkFinal(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                    </div>
                </div>
                {/* Botones */}
                <div className='flex gap-5'>
                    <button type="button" onClick={handleSolicitarConfirmacion} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center"><FaFilePdf /> Guardar</button>
                    <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center" onClick={() => setModalConfirmacionInforme(false)}>Cancelar </button>
                </div>
            </form>

            {
                mostrarConfirmacion && (
                    <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-90 text-gray-500 fonmt-medium text-center">
                        <div className="bg-white p-5 rounded-lg shadow-lg">
                            <h2 className="font-bold text-lg mb-4">Estás seguro de que quieres guardar los datos?</h2>
                            <p className='flex items-center gap-2'><span className='font-bold text-amber-500 text-2xl'><IoIosWarning /></span>¿No podras modificarlos posteriormente y se creará el informe</p>
                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    onClick={() => {
                                        handleConfirmarEnvio()
                                        setMostrarConfirmacion(false);
                                    }}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => setMostrarConfirmacion(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


        </div>
    )
}

export default FormularioInspeccion;





import React, { useState, useEffect } from 'react';
import * as OBC from "openbim-components";
import * as THREE from "three";
import { db } from '../firebase_config';
import { getDocs, collection } from 'firebase/firestore';

// Define la interfaz para un lote
interface Lote {
  docId: string;
  nombre: string;
}


export default function ViewerComponent() {
  const [modelCount, setModelCount] = useState(0);
  const [lotes, setLotes] = useState<Lote[]>([]);

  useEffect(() => {
    const obtenerLotes = async () => {
      try {
        const lotesRef = collection(db, "lotes");
        const querySnapshot = await getDocs(lotesRef);
        const lotesData = querySnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        })) as Lote[];
        setLotes(lotesData);
      } catch (error) {
        console.error('Error al obtener los lotes:', error);
      }
    };

    obtenerLotes();
  }, []);

  useEffect(() => {
    let viewer;
    let grid;
    let fragmentManager;
    let ifcLoader;
    let highlighter;
    let propertiesProcessor;
    let mainToolbar;

    const initViewer = () => {
      viewer = new OBC.Components();

      const sceneComponent = new OBC.SimpleScene(viewer);
      sceneComponent.setup();
      viewer.scene = sceneComponent;

      const viewerContainer = document.getElementById("viewerContainer") as HTMLDivElement;
      const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
      viewer.renderer = rendererComponent;

      const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
      viewer.camera = cameraComponent;

      const raycasterComponent = new OBC.SimpleRaycaster(viewer);
      viewer.raycaster = raycasterComponent;

      viewer.init();
      cameraComponent.updateAspect();
      rendererComponent.postproduction.enabled = true;

      grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
      rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());

      fragmentManager = new OBC.FragmentManager(viewer);
      ifcLoader = new OBC.FragmentIfcLoader(viewer);

      highlighter = new OBC.FragmentHighlighter(viewer);
      highlighter.setup();

      propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
      highlighter.events.select.onClear.add(() => {
        propertiesProcessor.cleanPropertiesList();
      });

      ifcLoader.onIfcLoaded.add(model => {
        setModelCount(fragmentManager.groups.length);
        propertiesProcessor.process(model);
        highlighter.events.select.onHighlight.add((selection) => {
          const fragmentID = Object.keys(selection)[0];
          const expressID = Number([...selection[fragmentID]][0]);
          
          // Asumiendo que `getProperties` te da acceso a todas las propiedades del objeto seleccionado.
          // Debes verificar cómo tu implementación específica devuelve estas propiedades.
          const properties = propertiesProcessor.getProperties(model, expressID.toString());
          if (properties) {
            // Busca la propiedad `GlobalId` dentro del conjunto de propiedades obtenidas.
            const globalIdProperty = properties.find(prop => prop.Name === 'GlobalId' || (prop.GlobalId && prop.GlobalId.value));
            const globalId = globalIdProperty ? globalIdProperty.GlobalId.value : 'No disponible';
      
            console.log(`GlobalId del elemento seleccionado: ${globalId}`);
            console.log(properties)
          } else {
            console.log(`No se encontraron propiedades para el elemento con ExpressID: ${expressID}`);
          }
      
          // La llamada a renderProperties parece estar correcta, asumiendo que es la forma
          // en que deseas que se maneje la visualización de las propiedades en tu aplicación.
          propertiesProcessor.renderProperties(model, expressID);
        });
        highlighter.update();
      });

      mainToolbar = new OBC.Toolbar(viewer);
      mainToolbar.addChild(
        ifcLoader.uiElement.get("main"), // Botón para cargar modelos
        propertiesProcessor.uiElement.get("main") // Botón para procesar propiedades
      );
      viewer.ui.addToolbar(mainToolbar);
    };

    initViewer();

    return () => {
      if (viewer) {
        viewer.dispose(); // Reemplazar con el método de limpieza correcto
      }
      // Agregar aquí la limpieza de otros componentes si es necesario
    };
  }, []);

  return (
    <>
      <div id="viewerContainer" className='w-full h-full'>
        <h3>Modelo: {modelCount}</h3>
        <div>
          {lotes.map((lote, index) => (
            <button className='bg-green-500 text-white p-2 m-1' key={index}>
              {lote.nombre}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
