const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generate');

let files = [];

/* ---------- Subida + preview ---------- */

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    files.push(file);
    addFileCard(file);
  }
});

function addFileCard(file) {
  const li = document.createElement('li');
  li.file = file;

  li.innerHTML = `
    <strong>${file.name}</strong>
    <div class="thumb"></div>
    <button class="remove">✕</button>
  `;

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    li.querySelector('.thumb').appendChild(img);
  } else {
    li.querySelector('.thumb').textContent = 'Documento Word';
  }

  li.querySelector('.remove').onclick = () => {
    files = files.filter(f => f !== file);
    li.remove();
  };

  fileList.appendChild(li);
}

/* ---------- Drag & drop ---------- */

new Sortable(fileList, {
  animation: 150,
  onEnd() {
    files = [...fileList.children].map(li => li.file);
  }
});

/* ---------- Generar PDF ---------- */

generateBtn.addEventListener('click', async () => {
  if (!files.length) {
    return alert('Agrega al menos un archivo');
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  const images = files.filter(f => f.type.startsWith('image/'));
  const docs = files.filter(f => f.name.endsWith('.docx'));

  if (images.length) await addImages(pdfDoc, images, font);
  for (const doc of docs) {
    await addWord(pdfDoc, doc, font);
  }

  const pdfBytes = await pdfDoc.save();
  showPreview(pdfBytes);
});

/* ---------- Imágenes 2×2 ---------- */

async function addImages(pdfDoc, images, font) {
  for (let i = 0; i < images.length; i += 4) {
    const page = pdfDoc.addPage([595, 842]);

    const positions = [
      [50, 450], [300, 450],
      [50, 150], [300, 150],
    ];

    for (let j = 0; j < 4 && i + j < images.length; j++) {
      const file = images[i + j];
      const bytes = await file.arrayBuffer();
      const img = file.type.includes('png')
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

      page.drawImage(img, {
        x: positions[j][0],
        y: positions[j][1],
        width: 200,
        height: 200,
      });
    }
  }
}

/* ---------- Word ---------- */

async function addWord(pdfDoc, file, font) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  let page = pdfDoc.addPage([595, 842]);
  let y = 780;

  page.drawText(file.name, {
    x: 50,
    y,
    size: 16,
    font,
  });

  y -= 30;

  for (const line of result.value.split('\n')) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 780;
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

/* ---------- Preview ---------- */

function showPreview(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  preview.src = URL.createObjectURL(blob);
}
