const fileInput = document.getElementById('fileInput');
const pagesContainer = document.getElementById('pagesContainer');
const generateBtn = document.getElementById('generate');

let images = []; // Array de imágenes que se van a agregar al PDF

// Subir imágenes
fileInput.addEventListener('change', () => {
  for (const file of fileInput.files) {
    images.push({ file, size: 'medium' }); // Por defecto tamaño medio
  }
  renderImages();
});

// Renderizar las imágenes en la UI
function renderImages() {
  pagesContainer.innerHTML = ''; // Limpiar contenedor de imágenes

  images.forEach((imgObj, index) => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'image-card';
    imgDiv.dataset.index = index;

    const thumb = document.createElement('img');
    if (imgObj.file.type.startsWith('image/')) {
      thumb.src = URL.createObjectURL(imgObj.file);
    } else {
      thumb.alt = 'Documento';
    }
    imgDiv.appendChild(thumb);

    // Selector de tamaño
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
      imgObj.size = e.target.value; // Actualizar tamaño
      renderImages(); // Re-renderizar para aplicar cambios
    };

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => {
      images = images.filter((_, i) => i !== index);
      renderImages();
    };

    imgDiv.appendChild(sizeSelect);
    imgDiv.appendChild(removeBtn);
    pagesContainer.appendChild(imgDiv);
  });

  // Inicializar el drag & drop para reordenar las imágenes
  new Sortable(pagesContainer, {
    animation: 150,
    onEnd() {
      // Reordenamos las imágenes cuando se mueve algo
      const sortedImages = [];
      pagesContainer.querySelectorAll('.image-card').forEach(div => {
        const index = div.dataset.index;
        sortedImages.push(images[index]);
      });
      images = sortedImages; // Actualizamos el array con el nuevo orden
    }
  });
}

// Generar PDF con las imágenes
generateBtn.addEventListener('click', async () => {
  if (!images.length) {
    alert('Agrega al menos una imagen');
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  // Creamos una página para cada conjunto de imágenes
  const pageWidth = 595;
  const pageHeight = 842;
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let x = 30; // Margen izquierdo
  let y = pageHeight - 30; // Margen superior (empezamos desde arriba)

  // Dibujamos las imágenes en el PDF
  for (const imgObj of images) {
    const imgBytes = await imgObj.file.arrayBuffer();
    const img = imgObj.file.type.startsWith('image/png')
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes);

    // Determinamos el tamaño de la imagen
    let width, height;
    switch (imgObj.size) {
      case 'small':
        width = 200;
        height = 200;
        break;
      case 'medium':
        width = 300;
        height = 300;
        break;
      case 'large':
        width = 400;
        height = 400;
        break;
      default:
        width = 300;
        height = 300;
    }

    // Dibujo de la imagen
    currentPage.drawImage(img, { x, y, width, height });

    // Actualizamos las coordenadas para la siguiente imagen
    y -= height + 30; // Margen entre imágenes

    // Si llegamos al final de la página, creamos una nueva
    if (y < 30) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 30; // Reiniciamos la posición en Y
    }
  }

  const pdfBytes = await pdfDoc.save();
  showPreview(pdfBytes);
});

// Mostrar el PDF generado en la vista previa
function showPreview(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const preview = document.getElementById('preview');
  preview.src = URL.createObjectURL(blob);
}
