/**
 * Callista's Portfolio - Navigation and Active Section Scroll Tracking
 * Features:
 * - Scroll tracking with IntersectionObserver & fallback position calculation
 * - Active link updates with aria-current="page"
 * - Smooth scroll behavior with header offset support
 * - Accessible mobile navigation drawer toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-right');

  /**
   * Set active navigation link
   * @param {string} sectionId - The ID of the currently visible section
   */
  function setActiveLink(sectionId) {
    if (!sectionId) return;

    navLinks.forEach((link) => {
      const linkSection = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
      const isTarget = linkSection === sectionId;

      if (isTarget) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // --- Scroll Tracking ---
  let isManualScrolling = false;
  let scrollTimeout = null;

  window.addEventListener('scroll', () => {
    if (isManualScrolling) return;

    // Detect if user has reached bottom of page (useful for short contact sections)
    const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);
    if (atBottom && sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        setActiveLink(lastSection.id);
        return;
      }
    }

    // Top of page edge-case
    if (window.scrollY < 80 && sections.length > 0) {
      setActiveLink(sections[0].id);
      return;
    }

    // Normal scroll tracking
    let currentSectionId = '';
    // Use the navbar height (85px) plus some padding to find the active section
    const scrollPos = window.scrollY + 120;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.id;
      }
    });

    if (currentSectionId) {
      setActiveLink(currentSectionId);
    }
  }, { passive: true });

  // --- Smooth Scroll & Click Handler ---
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetSection = document.getElementById(href.slice(1));
        if (targetSection) {
          e.preventDefault();
          const sectionId = href.slice(1);

          // Immediately highlight clicked link
          setActiveLink(sectionId);

          // Disable observer briefly during programmatic scroll
          isManualScrolling = true;
          clearTimeout(scrollTimeout);

          targetSection.scrollIntoView({
            behavior: 'smooth'
          });

          // Close mobile menu if open
          closeMobileMenu();

          scrollTimeout = setTimeout(() => {
            isManualScrolling = false;
            setActiveLink(sectionId);
          }, 800);
        }
      }
    });
  });

  // --- Core Magical Animation Engine ---
  function playMagicAnimation(containerNode, imageNode, prefersReducedMotion, onCompleteCallback) {
    // Handle reduced motion preference
    if (prefersReducedMotion.matches) {
      imageNode.classList.add('magic-hidden');
      setTimeout(() => {
        imageNode.classList.remove('magic-hidden');
        imageNode.classList.add('magic-pop');
        setTimeout(() => {
          imageNode.classList.remove('magic-pop');
          if (onCompleteCallback) onCompleteCallback();
        }, 350);
      }, 300);
      return;
    }

    // Stage 1 & 2: Hide avatar temporarily & create magic overlay
    imageNode.classList.add('magic-hidden');

    const overlay = document.createElement('div');
    overlay.className = 'magic-fx-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    containerNode.appendChild(overlay);

    // Create glowing magical orb
    const orb = document.createElement('div');
    orb.className = 'magic-orb';
    overlay.appendChild(orb);

    const avatarRect = imageNode.getBoundingClientRect();
    const baseRadius = Math.max(avatarRect.width, avatarRect.height, 48) * 0.65;

    const startTime = performance.now();
    const flightDuration = 800; // ms for orbit & spiral inward
    let lastTrailTime = 0;

    function animateOrb(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / flightDuration, 1);

      // Orbital & Spiral trajectory
      const angle = -Math.PI / 2 + (progress * 1.1 + Math.pow(progress, 2) * 0.9) * Math.PI * 2.2;

      let radius;
      if (progress < 0.45) {
        // Stage 2: Smooth circular orbit
        radius = baseRadius;
      } else {
        // Stage 3: Spiral inward toward center
        const spiralProgress = (progress - 0.45) / 0.55;
        radius = baseRadius * Math.pow(1 - spiralProgress, 1.4);
      }

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Scale orb slightly as it converges
      const orbScale = progress < 0.45 ? 1.0 : 1.0 + (progress - 0.45) * 0.7;
      orb.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${orbScale.toFixed(2)})`;

      // Spawn delicate trail dots
      if (currentTime - lastTrailTime > 26 && progress < 0.95) {
        lastTrailTime = currentTime;
        createTrailDot(overlay, x, y);
      }

      if (progress < 1) {
        requestAnimationFrame(animateOrb);
      } else {
        // Stage 4: Magical Pop & Sparkle Burst
        triggerMagicalPop(overlay, imageNode, () => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          if (onCompleteCallback) onCompleteCallback();
        });
      }
    }

    requestAnimationFrame(animateOrb);
  }

  // Helper: Create temporary trail particle
  function createTrailDot(container, x, y) {
    const dot = document.createElement('div');
    dot.className = 'magic-trail-dot';
    const size = 3 + Math.random() * 3;
    dot.style.width = `${size.toFixed(1)}px`;
    dot.style.height = `${size.toFixed(1)}px`;
    dot.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px))`;
    container.appendChild(dot);

    requestAnimationFrame(() => {
      dot.classList.add('fade-out');
    });

    setTimeout(() => {
      if (dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
    }, 300);
  }

  // Helper: Trigger center burst and reveal avatar
  function triggerMagicalPop(overlay, img, onComplete) {
    // 1. Center flash burst
    const flash = document.createElement('div');
    flash.className = 'magic-pop-flash';
    overlay.appendChild(flash);

    // 2. Radiating Sparkles
    const sparkleCount = 12;
    const colors = ['#ffffff', '#FF92D7', '#FFCBEB', '#FF70C8'];

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'magic-sparkle';

      const angle = (i / sparkleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 20 + Math.random() * 22;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const size = 6 + Math.random() * 6;
      const color = colors[i % colors.length];

      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.color = color;
      sparkle.innerHTML = `<svg viewBox="0 0 24 24" width="100%" height="100%" style="display:block; overflow:visible;"><polygon points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9" fill="currentColor"/></svg>`;

      overlay.appendChild(sparkle);

      if (sparkle.animate) {
        sparkle.animate([
          {
            transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)',
            opacity: 1
          },
          {
            transform: `translate(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px)) scale(1.1) rotate(90deg)`,
            opacity: 0.9,
            offset: 0.6
          },
          {
            transform: `translate(calc(-50% + ${(tx * 1.15).toFixed(1)}px), calc(-50% + ${(ty * 1.15).toFixed(1)}px)) scale(0) rotate(180deg)`,
            opacity: 0
          }
        ], {
          duration: 450 + Math.random() * 100,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards'
        });
      }
    }

    // 3. Avatar pop back into view with gentle bounce & pink halo
    img.classList.remove('magic-hidden');
    img.classList.add('magic-pop');

    setTimeout(() => {
      img.classList.remove('magic-pop');
      img.classList.add('magic-settled');
    }, 350);

    setTimeout(() => {
      img.classList.remove('magic-settled');
      if (onComplete) onComplete();
    }, 500);
  }

  // --- Magical Avatar Hover Animation Controller ---
  function initAvatarMagicalHover() {
    const avatarLink = document.querySelector('.nav-avatar-link');
    const avatarImg = avatarLink?.querySelector('.nav-avatar');
    if (!avatarLink || !avatarImg) return;

    let isAnimating = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function triggerHover() {
      if (isAnimating) return;
      isAnimating = true;
      playMagicAnimation(avatarLink, avatarImg, prefersReducedMotion, () => {
        isAnimating = false;
      });
    }

    // Attach hover listener
    avatarLink.addEventListener('mouseenter', triggerHover);
    // Touch support for mobile devices
    avatarLink.addEventListener('touchstart', triggerHover, { passive: true });
  }

  // --- Magical Loading Screen Controller ---
  function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingContainer = loadingScreen?.querySelector('.loading-avatar-container');
    const loadingImg = loadingContainer?.querySelector('.loading-avatar');

    if (!loadingScreen || !loadingContainer || !loadingImg) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Start loading animation shortly after page load
    setTimeout(() => {
      playMagicAnimation(loadingContainer, loadingImg, prefersReducedMotion, () => {
        // Animation finished, fade out loader smoothly
        loadingScreen.classList.add('loaded');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500); // Matches the CSS transition duration
      });
    }, 300);
  }

  initLoadingScreen();
  initAvatarMagicalHover();

  // Avatar link to home
  const avatarLink = document.querySelector('.nav-avatar-link');
  if (avatarLink) {
    avatarLink.addEventListener('click', (e) => {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        e.preventDefault();
        setActiveLink('home');
        homeSection.scrollIntoView({ behavior: 'smooth' });
        closeMobileMenu();
      }
    });
  }

  // --- Home Section: Cursor-Following Color Reveal ---
  function initHomeColorReveal() {
    const homeSection = document.getElementById('home');
    const colorImg = homeSection?.querySelector('.home-profile-color');
    const doodlesImg = homeSection?.querySelector('.home-doodles');
    if (!homeSection || !colorImg) return;

    // Respect reduced motion: skip the effect
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) return;

    const REVEAL_RADIUS = 100; // px radius of the cursor reveal circle
    let rafId = null;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHovering = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    // Compute clip-path string for a given element at cursor position using exact viewport pixel alignment
    function getClipPath(element, cxViewport, cyViewport, radius) {
      const rect = element.getBoundingClientRect();
      const relX = cxViewport - rect.left;
      const relY = cyViewport - rect.top;
      return `circle(${radius}px at ${relX.toFixed(1)}px ${relY.toFixed(1)}px)`;
    }

    function updateReveal() {
      if (!isHovering) return;

      currentX = lerp(currentX, targetX, 0.2);
      currentY = lerp(currentY, targetY, 0.2);

      // Update color portrait clip (coordinates relative to the portrait image)
      colorImg.style.clipPath = getClipPath(colorImg, currentX, currentY, REVEAL_RADIUS);

      // Update doodles clip (coordinates relative to the full section)
      if (doodlesImg) {
        doodlesImg.style.clipPath = getClipPath(doodlesImg, currentX, currentY, REVEAL_RADIUS);
      }

      rafId = requestAnimationFrame(updateReveal);
    }

    homeSection.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isHovering) {
        isHovering = true;
        currentX = e.clientX;
        currentY = e.clientY;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateReveal);
      }
    });

    homeSection.addEventListener('mouseenter', (e) => {
      isHovering = true;
      currentX = e.clientX;
      currentY = e.clientY;
      targetX = e.clientX;
      targetY = e.clientY;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateReveal);
    });

    homeSection.addEventListener('mouseleave', () => {
      isHovering = false;
      cancelAnimationFrame(rafId);
      colorImg.style.clipPath = 'circle(0px at 50% 50%)';
      if (doodlesImg) doodlesImg.style.clipPath = 'circle(0px at 50% 50%)';
    });

    // Touch: tap to toggle full reveal
    homeSection.addEventListener('touchstart', () => {
      const isRevealed = colorImg.style.clipPath !== 'circle(0px at 50% 50%)';
      if (isRevealed) {
        colorImg.style.clipPath = 'circle(0px at 50% 50%)';
        if (doodlesImg) doodlesImg.style.clipPath = 'circle(0px at 50% 50%)';
      } else {
        colorImg.style.clipPath = 'circle(150% at 50% 50%)';
        if (doodlesImg) doodlesImg.style.clipPath = 'circle(150% at 50% 50%)';
      }
    }, { passive: true });
  }

  initHomeColorReveal();

  // --- Contact Me: Typewriter Heading Animation ---
  function initContactTypewriter() {
    const contactSection = document.getElementById('contactme');
    const headingText = document.getElementById('contact-heading-text');
    const cursor = document.getElementById('contact-heading-cursor');
    if (!contactSection || !headingText) return;

    const fullText = "Come say hi!";
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
      headingText.textContent = fullText;
      if (cursor) cursor.style.display = 'none';
      return;
    }

    let hasPlayed = false;
    let isTyping = false;
    let typeTimer = null;

    function startTypewriter() {
      if (hasPlayed || isTyping) return;
      isTyping = true;
      headingText.textContent = '';
      if (cursor) {
        cursor.style.display = 'inline-block';
        cursor.classList.remove('typing-done');
      }

      let charIndex = 0;
      function typeCharacter() {
        if (charIndex < fullText.length) {
          headingText.textContent += fullText.charAt(charIndex);
          charIndex++;
          let delay = 75 + Math.random() * 35;
          if (fullText.charAt(charIndex - 1) === ' ') {
            delay += 40;
          }
          typeTimer = setTimeout(typeCharacter, delay);
        } else {
          isTyping = false;
          hasPlayed = true;
          // Gracefully fade out blinking cursor after typing completes
          setTimeout(() => {
            if (cursor) {
              cursor.classList.add('typing-done');
            }
          }, 1100);
        }
      }

      typeTimer = setTimeout(typeCharacter, 220);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPlayed) {
          startTypewriter();
        }
      });
    }, {
      threshold: 0.25,
      rootMargin: '0px 0px -40px 0px'
    });

    observer.observe(contactSection);
  }

  initContactTypewriter();

  // --- Photobooth Controller ---
  function initPhotobooth() {
    const video = document.getElementById('booth-video');
    const canvas = document.getElementById('booth-canvas');
    const frameOverlay = document.getElementById('booth-frame-overlay');
    const countdown = document.getElementById('booth-countdown');
    const flash = document.getElementById('booth-flash');
    const placeholder = document.getElementById('booth-placeholder');
    const btnStart = document.getElementById('btn-start-camera');
    const btnPhoto = document.getElementById('btn-take-photo');
    const btnClear = document.getElementById('btn-clear-strip');
    const btnDownload = document.getElementById('btn-download');
    const stripSlots = document.querySelectorAll('.strip-slot');
    const frameSelector = document.getElementById('frame-selector');

    if (!video || !canvas || !btnStart) return; // section not in DOM

    // Frame overlay SVG patterns
    const FRAMES = {
      none: '',
      hearts: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
        <g fill="#FF92D7" opacity="0.85" font-size="26">
          <text x="8" y="34">♥</text><text x="360" y="34">♥</text>
          <text x="8" y="270">♥</text><text x="360" y="270">♥</text>
          <text x="80" y="22">♡</text><text x="160" y="22">♥</text><text x="240" y="22">♡</text>
          <text x="80" y="292">♡</text><text x="160" y="292">♥</text><text x="240" y="292">♡</text>
          <text x="2" y="100">♡</text><text x="2" y="160">♥</text><text x="2" y="220">♡</text>
          <text x="370" y="100">♡</text><text x="370" y="160">♥</text><text x="370" y="220">♡</text>
        </g>
      </svg>`,
      stars: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
        <g fill="#FFD700" opacity="0.85" font-size="22">
          <text x="6" y="30">★</text><text x="364" y="30">★</text>
          <text x="6" y="276">★</text><text x="364" y="276">★</text>
          <text x="76" y="20">✦</text><text x="156" y="20">★</text><text x="236" y="20">✦</text>
          <text x="76" y="294">✦</text><text x="156" y="294">★</text><text x="236" y="294">✦</text>
          <text x="0" y="100">✦</text><text x="0" y="162">★</text><text x="0" y="224">✦</text>
          <text x="374" y="100">✦</text><text x="374" y="162">★</text><text x="374" y="224">✦</text>
        </g>
      </svg>`,
      flowers: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
        <g opacity="0.85" font-size="24">
          <text x="4" y="32" fill="#FF92D7">✿</text><text x="362" y="32" fill="#FF92D7">✿</text>
          <text x="4" y="274" fill="#7BC8F0">❀</text><text x="362" y="274" fill="#7BC8F0">❀</text>
          <text x="78" y="20" fill="#FFD700">✾</text><text x="158" y="20" fill="#FF92D7">✿</text><text x="238" y="20" fill="#FFD700">✾</text>
          <text x="78" y="294" fill="#FF92D7">✿</text><text x="158" y="294" fill="#7BC8F0">❀</text><text x="238" y="294" fill="#FF92D7">✿</text>
          <text x="0" y="100" fill="#7BC8F0">❀</text><text x="0" y="162" fill="#FF92D7">✿</text><text x="0" y="224" fill="#FFD700">✾</text>
          <text x="372" y="100" fill="#FFD700">✾</text><text x="372" y="162" fill="#FF92D7">✿</text><text x="372" y="224" fill="#7BC8F0">❀</text>
        </g>
      </svg>`
    };

    let currentFrame = 'none';
    let stream = null;
    let photos = []; // array of dataURLs
    let isCounting = false;
    const MAX_PHOTOS = 4;

    // --- Frame selector ---
    if (frameSelector) {
      frameSelector.addEventListener('click', (e) => {
        const btn = e.target.closest('.frame-btn');
        if (!btn) return;
        const frame = btn.dataset.frame;
        currentFrame = frame;
        document.querySelectorAll('.frame-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        frameOverlay.innerHTML = FRAMES[frame] || '';
      });
    }

    // --- Start Camera ---
    btnStart.addEventListener('click', async () => {
      if (stream) {
        // Stop camera
        stopCamera();
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false
        });
        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        btnStart.textContent = 'Stop Camera';
        btnPhoto.disabled = false;
      } catch (err) {
        const msg = err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not access camera: ' + err.message;
        alert(msg);
      }
    });

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      video.srcObject = null;
      video.style.display = 'none';
      placeholder.style.display = 'flex';
      btnStart.textContent = 'Start Camera';
      btnPhoto.disabled = true;
      isCounting = false;
      countdown.textContent = '';
      countdown.classList.remove('visible');
    }

    // --- Take Photo (with 3-second countdown) ---
    btnPhoto.addEventListener('click', () => {
      if (!stream || isCounting) return;
      if (photos.length >= MAX_PHOTOS) {
        alert('Strip is full! Clear it to take new photos.');
        return;
      }
      isCounting = true;
      btnPhoto.disabled = true;
      runCountdown(3, () => {
        capturePhoto();
        isCounting = false;
        btnPhoto.disabled = false;
      });
    });

    function runCountdown(seconds, onDone) {
      countdown.textContent = seconds;
      countdown.classList.add('visible');

      const tick = (remaining) => {
        if (remaining <= 0) {
          countdown.classList.remove('visible');
          countdown.textContent = '';
          onDone();
          return;
        }
        countdown.textContent = remaining;
        setTimeout(() => tick(remaining - 1), 1000);
      };

      setTimeout(() => tick(seconds - 1), 1000);
    }

    function capturePhoto() {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d');

      // Mirror the image (matches video transform: scaleX(-1))
      ctx.save();
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();

      // Composite the selected frame onto canvas
      if (currentFrame !== 'none' && FRAMES[currentFrame]) {
        // Convert SVG to image and draw on canvas
        const svgBlob = new Blob([FRAMES[currentFrame].replace('width="100%"', `width="${vw}"`).replace('height="100%"', `height="${vh}"`)], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, vw, vh);
          URL.revokeObjectURL(url);
          finalizeCapture(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.src = url;
      } else {
        finalizeCapture(canvas.toDataURL('image/jpeg', 0.92));
      }

      // Trigger camera flash effect
      triggerFlash();
    }

    function triggerFlash() {
      flash.classList.add('flash-active');
      setTimeout(() => flash.classList.remove('flash-active'), 180);
    }

    function finalizeCapture(dataUrl) {
      photos.push(dataUrl);
      const slotIndex = photos.length - 1;
      const slot = stripSlots[slotIndex];
      if (slot) {
        const img = new Image();
        img.src = dataUrl;
        slot.classList.add('filled', 'strip-pop');
        slot.appendChild(img);
        setTimeout(() => slot.classList.remove('strip-pop'), 600);
      }

      if (photos.length >= MAX_PHOTOS) {
        btnDownload.disabled = false;
        btnClear.disabled = false;
      } else {
        btnClear.disabled = false;
      }
    }

    // --- Clear strip ---
    btnClear.addEventListener('click', () => {
      photos = [];
      stripSlots.forEach(slot => {
        slot.classList.remove('filled', 'strip-pop');
        const img = slot.querySelector('img');
        if (img) img.remove();
      });
      btnDownload.disabled = true;
      btnClear.disabled = true;
    });

    // --- Download strip ---
    btnDownload.addEventListener('click', () => {
      if (!photos.length) return;
      compositeStrip().then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'photobooth-strip.png';
        a.click();
      });
    });

    // Compose photos vertically into one strip canvas
    function compositeStrip() {
      return new Promise((resolve) => {
        const SLOT_W = 400;
        const SLOT_H = 300;
        const PADDING = 8;
        const HEADER_H = 38;
        const FOOTER_H = 30;
        const totalH = HEADER_H + photos.length * (SLOT_H + PADDING) + FOOTER_H;
        const stripCanvas = document.createElement('canvas');
        stripCanvas.width = SLOT_W + PADDING * 2;
        stripCanvas.height = totalH;
        const ctx = stripCanvas.getContext('2d');

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, stripCanvas.width, totalH);

        // Header
        ctx.fillStyle = '#999999';
        ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📷 Photo Strip', stripCanvas.width / 2, 24);

        let loadedCount = 0;
        const imgs = photos.map((url, i) => {
          const img = new Image();
          img.onload = () => {
            const y = HEADER_H + i * (SLOT_H + PADDING);
            ctx.drawImage(img, PADDING, y, SLOT_W, SLOT_H);
            loadedCount++;
            if (loadedCount === photos.length) {
              // Footer
              ctx.fillStyle = '#cccccc';
              ctx.font = '11px Helvetica, Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('callista.portfolio', stripCanvas.width / 2, totalH - 10);
              resolve(stripCanvas.toDataURL('image/png'));
            }
          };
          img.src = url;
          return img;
        });
        // Silence unused var lint
        void imgs;
      });
    }
  }

  initPhotobooth();

  // --- Mobile Hamburger Menu Handler ---
  function openMobileMenu() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close menu with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileMenu();
        navToggle.focus();
      }
    });
  }
});
