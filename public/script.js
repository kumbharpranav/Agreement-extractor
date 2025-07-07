document.addEventListener('DOMContentLoaded', () => {
  // Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.setZ(30);

  // Glowing Torus
  const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0xff6347, emissive: 0xff6347, emissiveIntensity: 0.3 });
  const torus = new THREE.Mesh(geometry, material);
  scene.add(torus);

  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(5, 5, 5);
  const ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(pointLight, ambientLight);

  // Mouse interaction
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  let mouseX = 0, mouseY = 0;
  function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
  }

  function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.005;
    torus.rotation.y += 0.005;
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  // UI Logic
  const steps = document.querySelectorAll('.step');
  const agreementTypeSelect = document.getElementById('agreement-type-select');
  const addAgreementTypeBtn = document.getElementById('add-agreement-type-btn');
  const nextStep1Btn = document.getElementById('next-step-1');
  const saveAgreementTypeBtn = document.getElementById('save-agreement-type-btn');
  const backStep2Btn = document.getElementById('back-step-2');
  const backStep3Btn = document.getElementById('back-step-3');
  const extractBtn = document.getElementById('extract-btn');
  const restartBtn = document.getElementById('restart-btn');

  function showStep(stepNumber) {
    steps.forEach(step => step.classList.add('hidden'));
    document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
  }

  // Initial fetch of agreement types
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

  addAgreementTypeBtn.addEventListener('click', () => showStep(2));
  nextStep1Btn.addEventListener('click', () => showStep(3));
  backStep2Btn.addEventListener('click', () => showStep(1));
  backStep3Btn.addEventListener('click', () => showStep(1));
  restartBtn.addEventListener('click', () => location.reload());

  saveAgreementTypeBtn.addEventListener('click', () => {
    const name = document.getElementById('new-agreement-type-name').value;
    const fields = document.getElementById('new-agreement-type-fields').value.split(',').map(s => s.trim());
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
    const imageUpload = document.getElementById('image-upload');
    for (const file of imageUpload.files) {
      formData.append('images', file);
    }

    showStep('loading');

    fetch('/api/extract', {
      method: 'POST',
      body: formData
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.getElementById('download-link');
        downloadLink.href = url;
        showStep('download-container');
      });
  });

  showStep(1);
});