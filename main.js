document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const imageContainer = document.getElementById('imageContainer');
  const generateBtn = document.getElementById('generate');
  let images = []; // Array que guarda las imágenes

  // Subir imágenes
  fileInput.addEventListener('change', () => {
    for (const file of fileInput.files) {
      if (file.type.startsWith('image/')) {
        images.push(file); // Solo agregamos imágenes
      }
    }
    renderImages();
  });

  // Renderizar las imágenes en la UI
  function renderImages() {
    imageContainer.innerHTML = ''; // Limpiar contenedor de imágenes

    images.forEach((imgFile, index) => {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'image-card';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(imgFile);
      img.alt = 'Imagen subida';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Eliminar';
      removeBtn.onclick = () => {
        images.splice(index, 1); // Eliminar imagen
        renderImages(); // Re-renderizar
      };

      imgDiv.appendChild(img);
      imgDiv.appendChild(removeBtn);
      imageContainer.appendChild(imgDiv);
    });
  }

  // Generar el PDF
  generateBtn.addEventListener('click', async () => {
    if (images.length === 0) {
      alert('¡Por favor sube al menos una imagen!');
      return;
    }

    // Crear el documento PDF
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Tamaño A4
    const { width, height } = page.getSize();

    let yPosition = height - 30; // Empezamos desde el borde superior

    // Agregar cada imagen al PDF
    for (const imgFile of images) {
      const imgBytes = await imgFile.arrayBuffer();
      const img = imgFile.type.startsWith('image/png')
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      const imgWidth = width - 60; // Dejar márgenes de 30px
      const imgHeight = (img.height / img.width) * imgWidth; // Mantener proporciones

      // Si la imagen no cabe en la página, crear una nueva
      if (yPosition - imgHeight < 30) {
        yPosition = height - 30; // Reiniciar posición
        page = pdfDoc.addPage([595, 842]); // Nueva página
      }

      page.drawImage(img, {
        x: 30, // Margen izquierdo
        y: yPosition - imgHeight, // Margen superior
        width: imgWidth,
        height: imgHeight,
      });

      yPosition -= imgHeight + 30; // Margen entre imágenes
    }

    // Guardar el PDF
    const pdfBytes = await pdfDoc.save();
    showPreview(pdfBytes);
  });

  // Mostrar el PDF en la vista previa
  function showPreview(bytes) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const preview = document.getElementById('preview');
    preview.src = URL.createObjectURL(blob);
  }
});
