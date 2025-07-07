document.addEventListener('DOMContentLoaded', () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg') });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.setZ(30);

  const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
  const torus = new THREE.Mesh(geometry, material);

  scene.add(torus);

  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(5, 5, 5);

  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(pointLight, ambientLight);

  function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.005;
    torus.rotation.z += 0.01;
    renderer.render(scene, camera);
  }

  animate();

  const agreementTypeSelect = document.getElementById('agreement-type-select');
  const addAgreementTypeBtn = document.getElementById('add-agreement-type-btn');
  const newAgreementTypeForm = document.getElementById('new-agreement-type-form');
  const saveAgreementTypeBtn = document.getElementById('save-agreement-type-btn');
  const newAgreementTypeName = document.getElementById('new-agreement-type-name');
  const newAgreementTypeFields = document.getElementById('new-agreement-type-fields');
  const imageUpload = document.getElementById('image-upload');
  const extractBtn = document.getElementById('extract-btn');
  const loading = document.getElementById('loading');
  const downloadContainer = document.getElementById('download-container');
  const downloadLink = document.getElementById('download-link');

  // Fetch agreement types
  fetch('/api/agreement-types')
    .then(response => response.json())
    .then(data => {
      for (const type in data) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        agreementTypeSelect.appendChild(option);
      }
    });

  addAgreementTypeBtn.addEventListener('click', () => {
    newAgreementTypeForm.classList.toggle('hidden');
  });

  saveAgreementTypeBtn.addEventListener('click', () => {
    const name = newAgreementTypeName.value;
    const fields = newAgreementTypeFields.value.split(',').map(s => s.trim());
    if (name && fields.length > 0) {
      fetch('/api/agreement-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fields })
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message);
          location.reload();
        });
    }
  });

  extractBtn.addEventListener('click', () => {
    const formData = new FormData();
    formData.append('agreementType', agreementTypeSelect.value);
    for (const file of imageUpload.files) {
      formData.append('images', file);
    }

    loading.classList.remove('hidden');
    downloadContainer.classList.add('hidden');

    fetch('/api/extract', {
      method: 'POST',
      body: formData
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        downloadLink.href = url;
        loading.classList.add('hidden');
        downloadContainer.classList.remove('hidden');
      });
  });
});
