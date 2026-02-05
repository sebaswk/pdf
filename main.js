const input = document.getElementById('fileInput');
const button = document.getElementById('generate');

button.onclick = async () => {
  if (!input.files.length) {
    return alert('Selecciona uno o más archivos');
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  for (const file of input.files) {
    if (file.type.startsWith('image/')) {
      await addImagePage(pdfDoc, file);
    }

    if (file.name.endsWith('.docx')) {
      await addWordPages(pdfDoc, file, font);
    }
  }

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes, 'documento.pdf');
};

async function addImagePage(pdfDoc, file) {
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const bytes = await file.arrayBuffer();
  const image = file.type.includes('png')
    ? await pdfDoc.embedPng(bytes)
    : await pdfDoc.embedJpg(bytes);

  const scale = Math.min(
    (width - 80) / image.width,
    (height - 80) / image.height
  );

  page.drawImage(image, {
    x: (width - image.width * scale) / 2,
    y: (height - image.height * scale) / 2,
    width: image.width * scale,
    height: image.height * scale,
  });
}

async function addWordPages(pdfDoc, file, font) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  const text = result.value;
  const lines = text.split('\n');

  let page = pdfDoc.addPage([595, 842]);
  let y = 800;

  for (const line of lines) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
    }

    page.drawText(line, {
      x: 50,
      y,
      size: 12,
      font,
      maxWidth: 495,
    });

    y -= 18;
  }
}
