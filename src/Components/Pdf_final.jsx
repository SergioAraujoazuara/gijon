import React, { useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';

function PdfCreator() {
  const [pdfFiles, setPdfFiles] = useState([]);

  const handleFileChange = (index) => (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPdfFiles = [...pdfFiles];
        newPdfFiles[index] = e.target.result; // Guardar el PDF en el índice correspondiente
        setPdfFiles(newPdfFiles);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const createPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Agregar texto a la primera página
    const { width, height } = page.getSize();
    const fontSize = 30;
    page.drawText('Hola Mundo', {
      x: 50,
      y: height - 4 * fontSize,
      size: fontSize,
      font: timesRomanFont,
    });

    // Cargar y agregar los documentos PDF adjuntos
    for (const pdfFile of pdfFiles.filter(Boolean)) {
      const existingPdfDoc = await PDFDocument.load(pdfFile);
      const [existingPage] = await pdfDoc.copyPages(existingPdfDoc, [0]);
      pdfDoc.addPage(existingPage);
    }

    // Guardar el PDF resultante
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Descargar el archivo
    const link = document.createElement('a');
    link.href = url;
    link.download = 'created.pdf';
    link.click();
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange(0)} accept="application/pdf" />
      <input type="file" onChange={handleFileChange(1)} accept="application/pdf" />
      <input type="file" onChange={handleFileChange(2)} accept="application/pdf" />
      <button onClick={createPdf}>Create PDF</button>
    </div>
  );
}

export default PdfCreator;
