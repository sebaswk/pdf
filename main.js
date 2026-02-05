document.addEventListener('DOMContentLoaded', () => {
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

      // Botón eliminar imagen
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

    try {
      console.log("Generando el PDF...");

      // Creamos un nuevo documento PDF
      const pdfDoc = await PDFLib.PDFDocument.create();
      const pageWidth = 595; // A4 en puntos (en un PDF)
      const pageHeight = 842;
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let x = 0; // Borde izquierdo
      let y = pageHeight; // Borde superior

      // Recorremos las imágenes para agregarlas al PDF
      for (const imgObj of images) {
        const imgBytes = await imgObj.file.arrayBuffer();
        const img = imgObj.file.type.startsWith('image/png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        // Ajustamos el tamaño de la imagen para que se ajuste a la página
        let width, height;

        switch (imgObj.size) {
          case 'small':
            width = pageWidth / 2; // Tamaño pequeño ajustado a la mitad de la página
            height = (img.height / img.width) * width; // Mantener la proporción
            break;
          case 'medium':
            width = (pageWidth * 3) / 4; // Tamaño medio, 3/4 del ancho
            height = (img.height / img.width) * width; // Mantener la proporción
            break;
          case 'large':
            width = pageWidth; // Tamaño grande ajustado a todo el ancho de la página
            height = (img.height / img.width) * width; // Mantener la proporción
            break;
          default:
            width = pageWidth / 2;
            height = (img.height / img.width) * width;
        }

        // Aseguramos que la imagen no se desborde por el borde de la página
        if (y - height < 0) {
          // Si la imagen no cabe, creamos una nueva página
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight;
        }

        // Dibujamos la imagen
        currentPage.drawImage(img, { x, y: y - height, width, height });

        // Actualizamos la posición vertical para la siguiente imagen
        y -= height + 10; // Ajuste del margen entre imágenes

        // Si llegamos al final de la página, creamos una nueva
        if (y < 50) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight;
        }
      }

      // Guardar el PDF como bytes
      const pdfBytes = await pdfDoc.save();
      showPreview(pdfBytes);

    } catch (error) {
      console.error("Error al generar el PDF: ", error);
    }
  });

  // Mostrar el PDF generado en la vista previa
  function showPreview(bytes) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const preview = document.getElementById('preview');
    preview.src = URL.createObjectURL(blob);
  }

});
