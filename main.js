document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const pagesContainer = document.getElementById('pagesContainer');
  const button = document.getElementById('generate'); // Cambié a 'button' aquí
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
  button.addEventListener('click', async () => { // Aquí usamos 'button' como variable
    if (!images.length) {
      alert('Agrega al menos una imagen');
      return;
    }

    try {
      console.log("Generando el PDF...");

      // Creamos un nuevo documento PDF
      const pdfDoc = await PDFLib.PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // Tamaño A4 (en puntos)
      const { width, height } = page.getSize(); // Tamaño de la página

      let yPosition = height - 30; // Comenzamos desde el borde superior (con margen)

      // Recorremos las imágenes para agregarlas al PDF
      for (const imgObj of images) {
        const imgBytes = await imgObj.file.arrayBuffer();
        const img = imgObj.file.type.startsWith('image/png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

        // Determinamos el tamaño de la imagen según el tamaño seleccionado
        let imgWidth, imgHeight;
        switch (imgObj.size) {
          case 'small':
            imgWidth = 200;
            imgHeight = (img.height / img.width) * imgWidth;
            break;
          case 'medium':
            imgWidth = 300;
            imgHeight = (img.height / img.width) * imgWidth;
            break;
          case 'large':
            imgWidth = 400;
            imgHeight = (img.height / img.width) * imgWidth;
            break;
          default:
            imgWidth = 300;
            imgHeight = (img.height / img.width) * imgWidth;
        }

        // Dibujamos la imagen en el PDF
        if (yPosition - imgHeight < 30) {
          // Si no cabe, creamos una nueva página
          page = pdfDoc.addPage([595, 842]); // A4
          yPosition = height - 30;
        }

        // Dibujo de la imagen en la página
        page.drawImage(img, {
          x: 30, // Borde izquierdo
          y: yPosition - imgHeight, // Borde superior
          width: imgWidth,
          height: imgHeight,
        });

        // Actualizamos la posición para la siguiente imagen
        yPosition -= imgHeight + 30; // Dejamos un margen entre imágenes
      }

      // Guardamos el PDF generado
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
