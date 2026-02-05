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
    files.push(file);
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
    files = files.filter(f => f !== file);
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
    files = [...fileList.children].map(li => li.file);
  }
});

/* ===============================
   GENERAR PDF
================================ */

generateBtn.addEventListener('click', async () => {
  if (!files.length) {
    alert('Agrega al menos un archivo');
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  let imageBuffer = [];

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      imageBuffer.push(file);

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
   IMÁGENES (1–4 POR PÁGINA)
================================ */

async function drawImagePage(pdfDoc, images) {
  const page = pdfDoc.addPage([595, 842]);

  const layouts = {
    1: [[197, 321]],
    2: [[70, 321], [325, 321]],
    3: [[70, 450], [325, 450], [197, 150]],
    4: [[70, 450], [325, 450], [70, 150], [325, 150]],
  };

  const positions = layouts[images.length];

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const bytes = await file.arrayBuffer();

    const img = file.type.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    page.drawImage(img, {
      x: positions[i][0],
      y: positions[i][1],
      width: 200,
      height: 200,
    });
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
