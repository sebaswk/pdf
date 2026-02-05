const input = document.getElementById('fileInput');
const button = document.getElementById('generate');

button.onclick = async () => {
  const file = input.files[0];
  if (!file) return alert('Sube un archivo');

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  if (file.type.startsWith('image/')) {
    const bytes = await file.arrayBuffer();
    const image = file.type.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    const scale = Math.min(
      width / image.width,
      height / image.height
    ) * 0.8;

    page.drawImage(image, {
      x: (width - image.width * scale) / 2,
      y: (height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });
  }

  if (file.name.endsWith('.docx')) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });

    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const text = result.value;

    page.drawText(text, {
      x: 50,
      y: height - 80,
      size: 12,
      font,
      maxWidth: width - 100,
      lineHeight: 18,
    });
  }

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes, 'documento.pdf');
};

function download(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
