const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const preview = document.getElementById('preview');

let files = [];

fileInput.onchange = () => {
  for (const file of fileInput.files) {
    files.push(file);
    renderFile(file);
  }
};

function renderFile(file) {
  const li = document.createElement('li');
  li.file = file;

  li.innerHTML = `
    <strong>${file.name}</strong>
    <div class="thumb"></div>
    <button class="remove">✖</button>
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
