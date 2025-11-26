import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase_config";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const PdfCreator = ({
    progresoGeneralObra,
    inspeccionesTerminadas,
    totalLotes,
    lotesIniciados,
    porcentajeInspeccionesCompletadas,
    timelineRef,
    aptoNoAptoRef,
    graficaLotesRef,
    sectorsData = []
}) => {
    const [proyecto, setProyecto] = useState(null);
    const obra = localStorage.getItem('obra');
    const tramo = localStorage.getItem('tramo');
    const ppi = localStorage.getItem('ppi');

    useEffect(() => {
        const fetchProyecto = async () => {
            const idProyecto = localStorage.getItem("idProyecto");
            if (!idProyecto) {
                console.error("No se encontró el ID del proyecto en localStorage.");
                return;
            }

            const proyectoRef = doc(db, "proyectos", idProyecto);
            const proyectoSnap = await getDoc(proyectoRef);

            if (proyectoSnap.exists()) {
                setProyecto(proyectoSnap.data());
            } else {
                console.error("No se encontró el proyecto en la base de datos.");
            }
        };

        fetchProyecto();
    }, []);

    const generatePDF = async () => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4',
            compress: true // Habilitar compresión
        });
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        let yPosition = 100;

        const primaryColor = '#ffffff';
        const secondaryColor = '#475569';

        // Función para agregar encabezado en cada página
        const addHeader = async () => {
            pdf.setFontSize(12);
            pdf.setTextColor(secondaryColor);
            pdf.text('Reporte de Inspección de Obras', 40, 40);
            pdf.text(obra || 'Obra no especificada', 40, 55);
            pdf.text(tramo || 'Tramo no especificado', 40, 70);

            if (proyecto?.logo || proyecto?.logoCliente) {
                const logoSize = 70;
                const logoMarginTop = 10;
                let xPosition = pageWidth - (logoSize * 2) - 80;

                if (proyecto?.logo) {
                    const imgData = await fetch(proyecto.logo)
                        .then(res => res.blob())
                        .then(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        }));
                    pdf.addImage(imgData, 'JPEG', xPosition, logoMarginTop, logoSize, logoSize);
                    xPosition += logoSize + 20;
                }

                if (proyecto?.logoCliente) {
                    const imgData = await fetch(proyecto.logoCliente)
                        .then(res => res.blob())
                        .then(blob => new Promise(resolve => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        }));
                    pdf.addImage(imgData, 'JPEG', xPosition, logoMarginTop, logoSize, logoSize);
                }
            }

            pdf.setDrawColor(200, 200, 200);
            pdf.line(40, 90, pageWidth - 40, 90);
        };

        await addHeader();

        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor);
        pdf.text('Resumen de Inspección', 40, yPosition);

        yPosition += 30;

        pdf.setFontSize(12);
        pdf.setTextColor(secondaryColor);
        pdf.text(`Progreso General de la Obra (Total aptos): ${progresoGeneralObra}%`, 40, yPosition);
        pdf.text(`Inspecciones completadas: ${inspeccionesTerminadas} / ${totalLotes}`, 40, yPosition + 20);
        pdf.text(`Porcentaje de Inspecciones Completadas: ${porcentajeInspeccionesCompletadas}%`, 40, yPosition + 40);
        pdf.text(`Lotes Iniciados: ${lotesIniciados}`, 40, yPosition + 60);
        yPosition += 90;

        // Resumen por sector
        if (sectorsData.length > 0) {
            // Título de la sección
            pdf.setFontSize(14);
            pdf.setTextColor(primaryColor);
            pdf.text('Resumen por Sector', 40, yPosition);
            pdf.setDrawColor(200, 200, 200);
            pdf.line(40, yPosition + 5, pageWidth - 40, yPosition + 5);
            yPosition += 20;
        
            // Encabezados de la tabla con fondo y padding
            pdf.setFillColor(230, 230, 230); // Color gris claro
            pdf.rect(40, yPosition - 15, pageWidth - 80, 30, 'F'); // Fondo del encabezado con mayor altura para padding
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Color del texto negro
        
            // Agregar encabezados
            pdf.text('Sector', 50, yPosition); // Columna Sector
            pdf.text('Aptos', 180, yPosition); // Columna Aptos
            pdf.text('No Aptos', 280, yPosition); // Columna No Aptos
            pdf.text('Total', 380, yPosition); // Nueva columna: Subactividades
            pdf.text('Avance', 500, yPosition); // Nueva columna: Porcentaje Avance
            yPosition += 30; // Incrementar para iniciar las filas después del encabezado
        
            // Filas de la tabla con líneas divisorias
            for (const sector of sectorsData) {
                pdf.setFontSize(12);
                pdf.setTextColor(secondaryColor);
        
                // Dibujar línea divisoria entre filas
                pdf.setDrawColor(220, 220, 220); // Color gris claro para las líneas
                pdf.line(40, yPosition, pageWidth - 40, yPosition);
        
                // Imprimir datos en columnas
                pdf.text(sector.name, 50, yPosition + 15, { maxWidth: 100 }); // Nombre del sector alineado a la izquierda
                pdf.text(`${sector.aptos}`, 180, yPosition + 15, { align: 'center' }); // Alineación centrada para los números
                pdf.text(`${sector.noAptos}`, 280, yPosition + 15, { align: 'center' });
        
                // Calcular Total de Subactividades (puedes modificar esta lógica según tus datos)
                const totalSubactividades = sector.total * 2; // Ejemplo: cada actividad tiene 2 subactividades
                pdf.text(`${totalSubactividades}`, 400, yPosition + 15, { align: 'center' });
        
                // Calcular y mostrar porcentaje de avance
                const percentageProgress = ((sector.aptos / totalSubactividades) * 100).toFixed(2);
                pdf.text(`${percentageProgress}%`, 520, yPosition + 15, { align: 'center' });
        
                yPosition += 30; // Espaciado entre filas
        
                // Cambiar de página si se alcanza el límite
                if (yPosition > pageHeight - 100) {
                    pdf.addPage();
                    await addHeader(); // Agregar encabezado en la nueva página
                    yPosition = 100;
                }
            }
        
            // Espaciado al final de la tabla
            yPosition += 20;
        }
        
        
        

        const addImages = async (refs, labels) => {
            for (let i = 0; i < refs.length; i++) {
                const ref = refs[i];
                const label = labels[i];

                if (ref.current) {
                    const canvas = await html2canvas(ref.current, { scale: 5 }); // Reducción de escala
                    const imgData = canvas.toDataURL('image/jpeg', 0.5); // Reducción de calidad

                    const imgWidth = pageWidth * 0.6;
                    const imgHeight = 300;

                    if (yPosition + imgHeight > pageHeight - 80) {
                        pdf.addPage();
                        await addHeader();
                        yPosition = 100;
                    }

                    pdf.setFontSize(10);
                    pdf.setTextColor(primaryColor);
                    pdf.text(label, 40, yPosition - 10);
                    pdf.addImage(imgData, 'JPEG', 40, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 20;
                }
            }
        };

        await addImages(
            [timelineRef, aptoNoAptoRef, graficaLotesRef],
            ["Progreso de Inspecciones en el Tiempo", "Distribución de Inspecciones Aptas/No Aptas", "Lotes por Sector"]
        );

        pdf.setFillColor(primaryColor);
        pdf.rect(0, pageHeight - 40, pageWidth, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text('Generado automáticamente por el sistema de inspección de obras', pageWidth / 2, pageHeight - 15, { align: 'center' });

        const pdfBlob = pdf.output('blob');

        const storage = getStorage();
        const fileName = `Dashboard_Inspeccion_${ppi}_${obra}_${tramo}.pdf`;
        const storageRef = ref(storage, `informes_dashboard/${fileName}`);

        try {
            await uploadBytes(storageRef, pdfBlob);
            pdf.save(fileName);
            alert('PDF generado y guardado exitosamente.');
        } catch (error) {
            console.error('Error al guardar el PDF:', error);
        }
    };

    return (
        <div className="text-center mt-4">
            <button onClick={generatePDF} className="bg-blue-500 text-white py-2 px-4 rounded">
                Generar PDF
            </button>
        </div>
    );
};

export default PdfCreator;
