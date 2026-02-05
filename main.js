const fileInput = document.getElementById('fileInput');
const pagesContainer = document.getElementById('pagesContainer'); // contenedor para las páginas
const generateBtn = document.getElementById('generate');

let pages = []; // array de páginas, cada página tiene imágenes

/* ===============================
   SUBIDA DE ARCHIVOS
================================ */

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    // Por defecto, si no hay páginas, creamos una
    if (pages.length === 0) {
      pages.push({ id: Date.now(), images: [] });
    }

    // Agregamos la imagen a la última página
    pages[pages.length - 1].images.push({
      file,
      size: 'medium',
      position: 'center'
    });
  }

  renderPages();
});

/* ===============================
   RENDERIZAR PÁGINAS EN LA UI
================================ */

function renderPages() {
  pagesContainer.innerHTML = '';

  pages.forEach((page, pageIndex) => {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.dataset.pageId = page.id;

    const title = document.createElement('h3');
    title.textContent = `Página ${pageIndex + 1}`;
    pageDiv.appendChild(title);

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'images-container';

    page.images.forEach((imgObj, imgIndex) => {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'image-card';
      imgDiv.dataset.imgIndex = imgIndex;

      const thumb = document.createElement('img');
      if (imgObj.file.type.startsWith('image/')) {
        thumb.src = URL.createObjectURL(imgObj.file);
      } else {
        thumb.alt = 'Word';
      }
      imgDiv.appendChild(thumb);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.onclick = () => {
        page.images.splice(imgIndex, 1);
        renderPages();
      };
      imgDiv.appendChild(removeBtn);

      imagesContainer.appendChild(imgDiv);
    });

    pageDiv.appendChild(imagesContainer);
    pagesContainer.appendChild(pageDiv);

    // Inicializamos Sortable para cada página
    new Sortable(imagesContainer, {
      group: 'pages', // permite arrastrar entre contenedores
      animation: 150,
      onEnd: () => {
        const updatedImages = [];
        imagesContainer.querySelectorAll('.image-card').forEach(div => {
          const idx = parseInt(div.dataset.imgIndex);
          updatedImages.push(page.images[idx]);
        });
        page.images = updatedImages;
      }
    });
  });

  // Permite drag & drop entre páginas automáticamente por grupo 'pages'
}

/* ===============================
   GENERAR PDF
================================ */

generateBtn.addEventListener('click', async () => {
  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  for (const page of pages) {
    const images = page.images;
    if (images.length) {
      await drawImagePage(pdfDoc, images);
    }

    // Aquí podríamos añadir Word si quieres integrarlo luego
  }

  const pdfBytes = await pdfDoc.save();
  showPreview(pdfBytes);
});

/* ===============================
   DIBUJAR IMÁGENES POR PÁGINA
================================ */

async function drawImagePage(pdfDoc, images) {
  const page = pdfDoc.addPage([595, 842]);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 30;

  for (const imgObj of images) {
    const { file, size, position } = imgObj;
    const bytes = await file.arrayBuffer();
    const img = file.type.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    // Definir tamaño
    let width, height;
    switch (size) {
      case 'small': width = 200; height = 200; break;
      case 'medium': width = 300; height = 300; break;
      case 'large': width = 400; height = 400; break;
      default: width = 300; height = 300;
    }

    // Definir posición Y
    let y;
    switch (position) {
      case 'top': y = pageHeight - height - margin; break;
      case 'bottom': y = margin; break;
      case 'center':
      default: y = (pageHeight - height) / 2;
    }

    // Posición X centrada
    const x = (pageWidth - width) / 2;

    page.drawImage(img, { x, y, width, height });
  }
}

/* ===============================
   VISTA PREVIA
================================ */

function showPreview(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const preview = document.getElementById('preview');
  preview.src = URL.createObjectURL(blob);
}
