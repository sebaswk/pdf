const fileInput = document.getElementById('fileInput');
const pagesContainer = document.getElementById('pagesContainer'); // contenedor para las páginas
const generateBtn = document.getElementById('generate');

let pages = []; // array de páginas, cada página tiene imágenes

/* ===============================
   SUBIDA DE ARCHIVOS
================================ */

fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    // Si no hay páginas, creamos una página por defecto
    if (pages.length === 0) {
      pages.push({ id: Date.now(), images: [] });
    }

    // Agregamos la imagen a la última página
    const newImage = {
      id: Date.now() + Math.random(), // id único para cada imagen
      file,
      size: 'medium', // tamaño por defecto
      position: 'center' // posición por defecto
    };
    pages[pages.length - 1].images.push(newImage);
  }

  renderPages();
});

/* ===============================
   RENDERIZAR PÁGINAS EN LA UI
================================ */

function renderPages() {
  pagesContainer.innerHTML = ''; // Limpiamos el contenedor de páginas

  pages.forEach((page, pageIndex) => {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.dataset.pageId = page.id;

    const title = document.createElement('h3');
    title.textContent = `Página ${pageIndex + 1}`;
    pageDiv.appendChild(title);

    const imagesContainer = document.createElement('div');
    imagesContainer.className = 'images-container';

    page.images.forEach((imgObj) => {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'image-card';
      imgDiv.dataset.imgId = imgObj.id;

      const thumb = document.createElement('img');
      if (imgObj.file.type.startsWith('image/')) {
        thumb.src = URL.createObjectURL(imgObj.file);
      } else {
        thumb.alt = 'Word';
      }
      imgDiv.appendChild(thumb);

      const sizeSelect = document.createElement('select');
      const sizes = ['small', 'medium', 'large'];
      sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size.charAt(0).toUpperCase() + size.slice(1);
        if (size === imgObj.size) option.selected = true;
        sizeSelect.appendChild(option);
      });

      sizeSelect.onchange = (e) => {
        imgObj.size = e.target.value;
        renderPages(); // Re-renderiza para aplicar el cambio
      };

      const positionSelect = document.createElement('select');
      const positions = ['top', 'center', 'bottom'];
      positions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos;
        option.textContent = pos.charAt(0).toUpperCase() + pos.slice(1);
        if (pos === imgObj.position) option.selected = true;
        positionSelect.appendChild(option);
      });

      positionSelect.onchange = (e) => {
        imgObj.position = e.target.value;
        renderPages(); // Re-renderiza para aplicar el cambio
      };

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.onclick = () => {
        const page = findPageById(imgObj.id);
        page.images = page.images.filter(img => img.id !== imgObj.id);
        renderPages();
      };

      imgDiv.appendChild(sizeSelect);
      imgDiv.appendChild(positionSelect);
      imgDiv.appendChild(removeBtn);

      imagesContainer.appendChild(imgDiv);
    });

    pageDiv.appendChild(imagesContainer);
    pagesContainer.appendChild(pageDiv);

    // Habilitar drag & drop entre páginas
    new Sortable(imagesContainer, {
      group: 'pages', // permite arrastrar entre contenedores
      animation: 150,
      onEnd: () => {
        updateImageOrder(page, imagesContainer);
      }
    });
  });
}

/* ===============================
   ACTUALIZAR ORDEN DE IMÁGENES
================================ */

function updateImageOrder(page, imagesContainer) {
  const updatedImages = [];
  imagesContainer.querySelectorAll('.image-card').forEach((imgDiv, index) => {
    const imgId = imgDiv.dataset.imgId;
    const imgObj = page.images.find(img => img.id === imgId);
    updatedImages.push(imgObj);
  });
  page.images = updatedImages;
}

/* ===============================
   ENCONTRAR PÁGINA POR ID
================================ */

function findPageById(imgId) {
  for (const page of pages) {
    if (page.images.some(img => img.id === imgId)) {
      return page;
    }
  }
}

/* ===============================
   GENERAR PDF
================================ */

generateBtn.addEventListener('click', async () => {
  if (!pages.length) {
    alert('Agrega al menos una página con imágenes');
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  // Generamos el PDF página por página
  for (const page of pages) {
    if (page.images.length) {
      await drawImagePage(pdfDoc, page.images);
    }
  }

  const pdfBytes = await pdfDoc.save();
  showPreview(pdfBytes);
});

/* ===============================
   DIBUJAR IMÁGENES EN EL PDF
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
