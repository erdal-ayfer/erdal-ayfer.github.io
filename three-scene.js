/* ============================================
   THREE.JS — Interactive Particle Constellation
   ============================================ */
(function () {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Mouse tracking
  const mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
  document.addEventListener('mousemove', (e) => {
    mouse.target.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.target.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Particle system
  const PARTICLE_COUNT = 300;
  const SPREAD = 80;
  const CONNECTION_DISTANCE = 12;

  // Create particle geometry
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const velocities = [];

  const colorPalette = [
    new THREE.Color(0x00d4ff), // Cyan
    new THREE.Color(0x8b5cf6), // Violet
    new THREE.Color(0xec4899), // Pink
    new THREE.Color(0x6366f1), // Indigo
    new THREE.Color(0x06b6d4), // Teal
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i3 + 2] = (Math.random() - 0.5) * SPREAD;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = Math.random() * 2 + 0.5;

    velocities.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    });
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Create circular particle texture
  const particleTexture = createParticleTexture();

  function createParticleTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(c);
    return texture;
  }

  // Particle material
  const particlesMaterial = new THREE.PointsMaterial({
    size: 1.5,
    map: particleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // Connection lines
  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  let linesGeometry = new THREE.BufferGeometry();
  let lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(lines);

  // Ambient glow spheres
  const glowSpheres = [];
  const glowColors = [0x00d4ff, 0x8b5cf6, 0xec4899];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.SphereGeometry(15 + i * 5, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: glowColors[i],
      transparent: true,
      opacity: 0.015,
      wireframe: true,
    });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      -20
    );
    scene.add(sphere);
    glowSpheres.push({ mesh: sphere, speed: 0.001 + i * 0.0005, offset: i * 2 });
  }

  // Scroll offset for parallax
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Animation loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse following
    mouse.x += (mouse.target.x - mouse.x) * 0.05;
    mouse.y += (mouse.target.y - mouse.y) * 0.05;

    // Update particles
    const posArray = particlesGeometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Basic drift
      posArray[i3] += velocities[i].x;
      posArray[i3 + 1] += velocities[i].y;
      posArray[i3 + 2] += velocities[i].z;

      // Boundary wrap
      const half = SPREAD / 2;
      if (posArray[i3] > half) posArray[i3] = -half;
      if (posArray[i3] < -half) posArray[i3] = half;
      if (posArray[i3 + 1] > half) posArray[i3 + 1] = -half;
      if (posArray[i3 + 1] < -half) posArray[i3 + 1] = half;
      if (posArray[i3 + 2] > half) posArray[i3 + 2] = -half;
      if (posArray[i3 + 2] < -half) posArray[i3 + 2] = half;
    }
    particlesGeometry.attributes.position.needsUpdate = true;

    // Mouse influence on camera
    camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 3 - camera.position.y) * 0.02;

    // Scroll parallax
    const scrollOffset = scrollY * 0.015;
    camera.position.y -= scrollOffset * 0.3;
    camera.lookAt(0, -scrollOffset * 0.3, 0);

    // Rotate entire particle system slowly
    particles.rotation.y = elapsed * 0.03;
    particles.rotation.x = Math.sin(elapsed * 0.02) * 0.1;

    // Animate glow spheres
    glowSpheres.forEach(({ mesh, speed, offset }) => {
      mesh.rotation.x = elapsed * speed;
      mesh.rotation.y = elapsed * speed * 1.3;
      mesh.position.y = Math.sin(elapsed * 0.3 + offset) * 3;
    });

    // Update connection lines (every 2 frames for performance)
    if (Math.floor(elapsed * 60) % 2 === 0) {
      updateLines(posArray);
    }

    renderer.render(scene, camera);
  }

  function updateLines(posArray) {
    const linePositions = [];
    const MAX_LINES = 200;
    let lineCount = 0;

    for (let i = 0; i < PARTICLE_COUNT && lineCount < MAX_LINES; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineCount < MAX_LINES; j++) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = posArray[i3] - posArray[j3];
        const dy = posArray[i3 + 1] - posArray[j3 + 1];
        const dz = posArray[i3 + 2] - posArray[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE) {
          linePositions.push(
            posArray[i3], posArray[i3 + 1], posArray[i3 + 2],
            posArray[j3], posArray[j3 + 1], posArray[j3 + 2]
          );
          lineCount++;
        }
      }
    }

    scene.remove(lines);
    linesGeometry.dispose();
    linesGeometry = new THREE.BufferGeometry();
    if (linePositions.length > 0) {
      linesGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
    }
    lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(lines);
  }

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
})();
