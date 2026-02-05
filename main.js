const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generate');

let files = [];

/* ===============================
   SUBIDA + VISTA PREVIA
================================ */

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    files.push({ file, size: 'medium', position: 'center' }); // tamaño y posición por defecto
    renderFile(file);
  }
});

function renderFile(file) {
  const li = document.createElement('li');
  li.file = file;

  li.innerHTML = `
    <strong>${file.name}</strong>
    <div class="thumb"></div>
    <button class="remove">✕</button>
  `;

  const thumb = li.querySelector('.thumb');

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    thumb.appendChild(img);
  } else {
    thumb.textContent = 'Documento Word';
  }

  li.querySelector('.remove').onclick = () => {
    files = files.filter(f => f.file !== file);
    li.remove();
  };

  fileList.appendChild(li);
}

/* ===============================
   DRAG & DROP
================================ */

new Sortable(fileList, {
  animation: 150,
  onEnd() {
    files = [...fileList.children].map(li => files.find(f => f.file === li.file));
  }
});

/* ===============================
   GENERAR PDF
================================ */

generateBtn.addEventListener('click', async () => {
  if (!files.length) return alert('Agrega al menos un archivo');

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  let imageBuffer = [];

  for (const obj of files) {
    const file = obj.file;

    if (file.type.startsWith('image/')) {
      imageBuffer.push(obj);

      // Si se juntan 4 imágenes o es la última imagen, dibujamos la página
      if (imageBuffer.length === 4) {
        await drawImagePage(pdfDoc, imageBuffer);
        imageBuffer = [];
      }
    }

    if (file.name.endsWith('.docx')) {
      if (imageBuffer.length) {
        await drawImagePage(pdfDoc, imageBuffer);
        imageBuffer = [];
      }
      await addWord(pdfDoc, file, font);
    }
  }

  if (imageBuffer.length) {
    await drawImagePage(pdfDoc, imageBuffer);
  }

  const pdfBytes = await pdfDoc.save();
  showPreview(pdfBytes);
});

/* ===============================
   IMÁGENES CON TAMAÑO Y POSICIÓN
================================ */

async function drawImagePage(pdfDoc, images) {
  const page = pdfDoc.addPage([595, 842]);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 30;

  for (let i = 0; i < images.length; i++) {
    const { file, size, position } = images[i];
    const bytes = await file.arrayBuffer();
    const img = file.type.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    // Definir tamaño
    let width, height;
    switch (size) {
      case 'small':
        width = 200; height = 200; break;
      case 'medium':
        width = 300; height = 300; break;
      case 'large':
        width = 400; height = 400; break;
      default:
        width = 300; height = 300;
    }

    // Definir posición Y
    let y;
    switch (position) {
      case 'top':
        y = pageHeight - height - margin; break;
      case 'bottom':
        y = margin; break;
      case 'center':
      default:
        y = (pageHeight - height) / 2;
    }

    // Definir posición X (centrada)
    const x = (pageWidth - width) / 2;

    page.drawImage(img, { x, y, width, height });
  }
}

/* ===============================
   WORD → PDF
================================ */

async function addWord(pdfDoc, file, font) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  let page = pdfDoc.addPage([595, 842]);
  let y = 800;

  for (const line of result.value.split('\n')) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
    }

    if (line.trim()) {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font,
        maxWidth: 495,
        lineHeight: 16,
      });
      y -= 18;
    } else {
      y -= 10;
    }
  }
}

/* ===============================
   VISTA PREVIA
================================ */

function showPreview(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  preview.src = URL.createObjectURL(blob);
}
