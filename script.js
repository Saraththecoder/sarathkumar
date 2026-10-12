/**
 * =============================================================================
 * BHASA SARATH KUMAR — PERSONAL QR PORTFOLIO
 * Cinematic Video Splash Screen & Homepage Interaction Engine
 * =============================================================================
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & STATE
  // ---------------------------------------------------------------------------
  const config = window.PORTFOLIO_CONFIG || {};

  const state = {
    currentScreen: 'welcome', // 'welcome' | 'profile'
    isTransitioning: false,
    safetyRedirectTimer: null,
    isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasGsap: typeof window.gsap !== 'undefined'
  };

  // DOM Elements
  const elements = {
    // Welcome Video Splash Elements
    welcomeScreen: document.getElementById('welcome-screen'),
    zoomPortal: document.getElementById('zoom-portal'),
    videoContainer: document.getElementById('video-splash-container'),
    splashVideo: document.getElementById('splash-video'),
    videoProgressFill: document.getElementById('video-progress-fill'),

    // Homepage Profile Screen Elements
    profileScreen: document.getElementById('profile-screen'),
    profileScrollProgress: document.getElementById('profile-scroll-progress'),
    profileScrollCanvas: document.getElementById('profile-scroll-canvas'),
    profileTopBar: document.getElementById('profile-top-bar'),
    btnBackWelcome: document.getElementById('btn-back-welcome'),
    collegeLogo: document.getElementById('header-college-logo'),
    portraitStage: document.getElementById('profile-portrait-stage'),
    portraitVisualBox: document.getElementById('portrait-visual-box'),
    portraitImg: document.getElementById('profile-photo'),
    portraitAnnotation: document.getElementById('portrait-annotation'),
    annotationLabel: document.getElementById('annotation-label'),
    profilePillWrapper: document.getElementById('profile-pill-wrapper'),
    profileHeroName: document.getElementById('profile-hero-name'),
    profileFirstName: document.getElementById('profile-first-name'),
    profileLastName: document.getElementById('profile-last-name'),
    profileHeadline: document.getElementById('profile-headline'),
    profileRollTag: document.getElementById('profile-roll-tag'),
    profileBio: document.getElementById('profile-bio'),
    connectSection: document.getElementById('connect-with-me-section'),
    infiniteScrollContainer: document.getElementById('infinite-scroll-container'),
    infiniteScrollTrack: document.getElementById('infinite-scroll-track'),
    socialIconOrbs: document.querySelectorAll('.social-icon-orb'),
    profileFooter: document.getElementById('profile-meta-footer'),

    // Toast
    toast: document.getElementById('toast-notification'),
    toastMessage: document.getElementById('toast-message')
  };

  // ---------------------------------------------------------------------------
  // 2. CONFIG HYDRATION
  // ---------------------------------------------------------------------------
  function hydrateFromConfig() {
    if (!config) return;

    // Document Title & Meta
    if (config.meta) {
      if (config.meta.siteTitle) document.title = config.meta.siteTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && config.meta.siteDescription) {
        metaDesc.setAttribute('content', config.meta.siteDescription);
      }
    }

    // Profile Details
    if (config.profile) {
      const p = config.profile;
      if (elements.profileFirstName && p.firstName) elements.profileFirstName.textContent = p.firstName;
      if (elements.profileLastName && p.lastName) elements.profileLastName.textContent = p.lastName;
      if (elements.profileRollTag && p.rollNumber) elements.profileRollTag.textContent = p.rollNumber;
      if (elements.profileBio && p.introduction) elements.profileBio.textContent = p.introduction;

      if (elements.annotationLabel && p.annotationText) {
        elements.annotationLabel.innerHTML = p.annotationText;
      }

      if (elements.collegeLogo && p.collegeLogoPath) {
        elements.collegeLogo.src = p.collegeLogoPath;
        if (p.collegeLogoAlt) elements.collegeLogo.alt = p.collegeLogoAlt;
      }
    }

    // Connect Channels (All cloned infinite-scroll instances)
    if (config.connectWithMe && Array.isArray(config.connectWithMe.links)) {
      config.connectWithMe.links.forEach(function (channel) {
        if (!channel.url) return;
        const targets = document.querySelectorAll(`[data-channel="${channel.id}"]`);
        targets.forEach(function (link) {
          link.href = channel.url;
        });
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. CINEMATIC VIDEO SPLASH LOGIC (SOUND ON BY DEFAULT)
  // ---------------------------------------------------------------------------

  function startSplashVideo() {
    const video = elements.splashVideo;
    if (!video) return;

    // Request audio default ON
    video.muted = false;

    // Attempt direct unmuted playback
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function (error) {
        // If browser autoplay policy blocks unmuted autoplay without prior gesture,
        // start playback muted and immediately unmute on first user interaction.
        console.info('Autoplay with sound restricted by browser; starting muted and unmuting on first touch:', error);
        video.muted = true;
        video.play().catch(function (err) {
          console.warn('Playback error:', err);
        });

        function unmuteAudio() {
          video.muted = false;
          window.removeEventListener('click', unmuteAudio);
          window.removeEventListener('touchstart', unmuteAudio);
          window.removeEventListener('pointerdown', unmuteAudio);
        }

        window.addEventListener('click', unmuteAudio, { once: true });
        window.addEventListener('touchstart', unmuteAudio, { once: true });
        window.addEventListener('pointerdown', unmuteAudio, { once: true });
      });
    }

    // Progress line update
    video.ontimeupdate = function () {
      if (video.duration && elements.videoProgressFill) {
        const pct = Math.min(100, (video.currentTime / video.duration) * 100);
        elements.videoProgressFill.style.width = pct + '%';
      }
    };

    // Upon completion of video -> automatically redirect to homepage profile
    video.onended = function () {
      showProfileScreen(true);
    };

    // Safety fallback: if video ended event is delayed or stalled, redirect after ~7.4s
    clearSafetyTimer();
    const durationSec = (config.splash && config.splash.videoDurationSeconds) || 7.0;
    const fallbackMs = (durationSec + 0.4) * 1000;
    state.safetyRedirectTimer = window.setTimeout(function () {
      if (state.currentScreen === 'welcome' && !state.isTransitioning) {
        showProfileScreen(true);
      }
    }, fallbackMs);
  }

  function clearSafetyTimer() {
    if (state.safetyRedirectTimer) {
      window.clearTimeout(state.safetyRedirectTimer);
      state.safetyRedirectTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. SCREEN TRANSITIONS: SPLASH VIDEO -> HOMEPAGE & HOMEPAGE -> SPLASH
  // ---------------------------------------------------------------------------

  function showProfileScreen(updateHistory = true) {
    if (state.isTransitioning) return;
    if (state.currentScreen === 'profile') return;

    state.isTransitioning = true;
    clearSafetyTimer();

    // Pause video
    if (elements.splashVideo) {
      try {
        elements.splashVideo.pause();
      } catch (_) {}
    }

    if (state.hasGsap && !state.isReducedMotion) {
      runGsapSplashToProfileTransition(updateHistory);
    } else {
      runFallbackSplashToProfileTransition(updateHistory);
    }
  }

  function runGsapSplashToProfileTransition(updateHistory) {
    const tl = window.gsap.timeline({
      onComplete: function () {
        elements.welcomeScreen.classList.remove('active');
        elements.welcomeScreen.style.pointerEvents = 'none';
        elements.welcomeScreen.style.visibility = 'hidden';
        elements.welcomeScreen.style.transform = 'none';

        elements.profileScreen.classList.add('active');
        elements.profileScreen.style.pointerEvents = 'auto';

        state.currentScreen = 'profile';
        state.isTransitioning = false;

        if (updateHistory && window.location.hash !== '#profile') {
          try {
            history.pushState({ screen: 'profile' }, '', '#profile');
          } catch (_) {
            window.location.hash = 'profile';
          }
        }

        if (elements.btnBackWelcome) {
          elements.btnBackWelcome.focus({ preventScroll: true });
        }
      }
    });

    // =========================================================================
    // STEP 1: CINEMATIC ZOOM-IN FLY-THROUGH EFFECT
    // =========================================================================

    // Zoom the splash video camera deeply into space (scale 1.00 -> 1.38)
    tl.to(elements.welcomeScreen, {
      scale: 1.38,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.in'
    }, 0);

    // Cosmic portal flash flare
    if (elements.zoomPortal) {
      tl.fromTo(elements.zoomPortal,
        { opacity: 0, scale: 0.88 },
        { opacity: 0.85, scale: 1.15, duration: 0.42, ease: 'power2.out' },
        0.2
      );
      tl.to(elements.zoomPortal, {
        opacity: 0,
        scale: 1.32,
        duration: 0.45,
        ease: 'power2.in'
      }, 0.52);
    }

    // Prepare profile screen in DOM
    tl.add(function () {
      elements.profileScreen.style.visibility = 'visible';
      elements.profileScreen.style.opacity = '1';
      elements.profileScreen.classList.add('active');
      if (elements.profileScrollCanvas) elements.profileScrollCanvas.scrollTop = 0;
    }, 0.48);

    // Camera arrives at homepage: zoom settles smoothly from scale(1.18) down to scale(1.00)
    tl.fromTo(elements.profileScreen,
      { scale: 1.18, opacity: 0 },
      { scale: 1.00, opacity: 1, duration: 0.65, ease: 'power3.out' },
      0.48
    );

    // =========================================================================
    // STEP 2: AFTER ZOOM-IN EFFECT SETTLES -> ALL ELEMENTS APPEAR
    // =========================================================================
    // The zoom-in effect completes at ~1.15s; all profile elements now cascade in:
    const startTime = 1.15;

    // 1. Header (Wordmark S A R A T H & College Logo)
    if (elements.profileTopBar) {
      tl.fromTo(
        elements.profileTopBar,
        { opacity: 0, y: -26 },
        { opacity: 1, y: 0, duration: 0.58, ease: 'power3.out' },
        startTime
      );
    }

    // 2. Authentic Portrait Photograph (Lifts up with halo glow)
    if (elements.portraitImg) {
      tl.fromTo(
        elements.portraitImg,
        { opacity: 0, scale: 0.88, y: 32 },
        { opacity: 1, scale: 1, y: 0, duration: 0.75, ease: 'back.out(1.4)' },
        startTime + 0.1
      );
    }

    // 3. Handwritten ".That's Me! :)" Annotation
    if (elements.portraitAnnotation) {
      tl.fromTo(
        elements.portraitAnnotation,
        { opacity: 0, scale: 0.45, rotation: -20 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.2)' },
        startTime + 0.32
      );
    }

    // 4. Category Pill
    if (elements.profilePillWrapper) {
      tl.fromTo(
        elements.profilePillWrapper,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
        startTime + 0.42
      );
    }

    // 5. Hero Name (BHASA SARATH KUMAR)
    if (elements.profileHeroName) {
      tl.fromTo(
        elements.profileHeroName,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power4.out' },
        startTime + 0.5
      );
    }

    // 6. Role & Roll Number (Technical Lead – 24AK1A33D8)
    if (elements.profileHeadline) {
      tl.fromTo(
        elements.profileHeadline,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        startTime + 0.6
      );
    }

    // 7. Bio Introduction
    if (elements.profileBio) {
      tl.fromTo(
        elements.profileBio,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
        startTime + 0.7
      );
    }

    // 8. Connect With Me Section & Horizontal Carousel
    if (elements.connectSection) {
      tl.fromTo(
        elements.connectHeaderRow,
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        startTime + 0.8
      );

      const carouselWrapper = document.querySelector('.connect-carousel-wrapper');
      if (carouselWrapper) {
        tl.fromTo(
          carouselWrapper,
          { opacity: 0, x: 24 },
          { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' },
          startTime + 0.88
        );
      }

      const dotsBar = document.querySelector('.carousel-indicators-bar');
      if (dotsBar) {
        tl.fromTo(
          dotsBar,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' },
          startTime + 1.05
        );
      }
    }

    // 9. Institutional College Footer
    if (elements.profileFooter) {
      tl.fromTo(
        elements.profileFooter,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        startTime + 1.25
      );
    }
  }

  function runFallbackSplashToProfileTransition(updateHistory) {
    elements.welcomeScreen.classList.remove('active');
    elements.welcomeScreen.classList.add('zoom-in-exit');

    elements.profileScreen.classList.remove('active');
    elements.profileScreen.classList.add('portal-zoom-enter');

    window.setTimeout(function () {
      elements.welcomeScreen.classList.remove('zoom-in-exit');
      elements.welcomeScreen.style.opacity = '0';
      elements.welcomeScreen.style.visibility = 'hidden';

      elements.profileScreen.classList.remove('portal-zoom-enter');
      elements.profileScreen.classList.add('active');
      elements.profileScreen.style.opacity = '1';
      elements.profileScreen.style.visibility = 'visible';

      state.currentScreen = 'profile';
      state.isTransitioning = false;

      window.dispatchEvent(new Event('profileScreenActivated'));

      if (updateHistory && window.location.hash !== '#profile') {
        try {
          history.pushState({ screen: 'profile' }, '', '#profile');
        } catch (_) {
          window.location.hash = 'profile';
        }
      }
    }, 720);
  }

  function showWelcomeScreen(updateHistory = true) {
    if (state.isTransitioning) return;
    if (state.currentScreen === 'welcome') return;

    state.isTransitioning = true;
    clearSafetyTimer();

    elements.profileScreen.classList.remove('active');
    elements.profileScreen.style.opacity = '0';
    elements.profileScreen.style.visibility = 'hidden';

    elements.welcomeScreen.classList.add('active');
    elements.welcomeScreen.style.opacity = '1';
    elements.welcomeScreen.style.visibility = 'visible';
    elements.welcomeScreen.style.transform = 'scale(1.00)';
    elements.welcomeScreen.style.pointerEvents = 'auto';

    state.currentScreen = 'welcome';
    state.isTransitioning = false;

    if (updateHistory && window.location.hash !== '#welcome') {
      try {
        history.pushState({ screen: 'welcome' }, '', '#welcome');
      } catch (_) {
        window.location.hash = 'welcome';
      }
    }

    // Replay video from start
    if (elements.splashVideo) {
      elements.splashVideo.currentTime = 0;
      startSplashVideo();
    }
  }

  // ---------------------------------------------------------------------------
  // 5. PROFILE INTERACTIONS (SCROLL PROGRESS, PAGE SCROLL AUDIO, ORBS)
  // ---------------------------------------------------------------------------
  function setupProfileInteractions() {
    // Scroll progress bar & Tactile audio tick while scrolling the page
    if (elements.profileScrollCanvas) {
      let lastScrollY = 0;
      let scrollAccumulator = 0;
      const SCROLL_TICK_THRESHOLD = 32; // Crisp, responsive ~32px steps
      let lastTickTime = 0;

      function handleVerticalMovement(currentScrollTop) {
        const delta = Math.abs(currentScrollTop - lastScrollY);
        scrollAccumulator += delta;
        lastScrollY = currentScrollTop;

        const now = performance.now();
        if (scrollAccumulator >= SCROLL_TICK_THRESHOLD && (now - lastTickTime > 45)) {
          scrollAccumulator = 0;
          lastTickTime = now;
          const stepIndex = Math.floor(currentScrollTop / SCROLL_TICK_THRESHOLD);
          AudioEngine.playScrollTick(stepIndex);
        }
      }

      let scrollStateTimer = null;
      function onScrollActivity() {
        if (!elements.profileScrollCanvas.classList.contains('is-scrolling')) {
          elements.profileScrollCanvas.classList.add('is-scrolling');
        }
        if (document.activeElement && document.activeElement.classList.contains('social-icon-orb')) {
          document.activeElement.blur();
        }
        clearTimeout(scrollStateTimer);
        scrollStateTimer = setTimeout(function () {
          elements.profileScrollCanvas.classList.remove('is-scrolling');
        }, 120);
      }

      elements.profileScrollCanvas.addEventListener('scroll', function () {
        const el = elements.profileScrollCanvas;
        const scrollTop = el.scrollTop;
        const maxScroll = el.scrollHeight - el.clientHeight;

        onScrollActivity();

        if (elements.profileScrollProgress && maxScroll > 0) {
          const progress = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
          elements.profileScrollProgress.style.width = `${progress}%`;
        }

        if (elements.portraitVisualBox && !state.isReducedMotion) {
          const translateY = scrollTop * 0.16;
          const scale = Math.max(0.92, 1 - scrollTop * 0.0003);
          elements.portraitVisualBox.style.transform = `translateY(${translateY}px) scale(${scale})`;
        }

        handleVerticalMovement(scrollTop);
      }, { passive: true });
    }

    // Initialize Infinite Icon Scroll Track
    setupInfiniteIconScroll();
  }

  // ---------------------------------------------------------------------------
  // 5b. TACTILE HAPTIC AUDIO ENGINE (WEB AUDIO API — PUNCHY MECHANICAL CLICK)
  // ---------------------------------------------------------------------------
  const AudioEngine = (function () {
    let ctx = null;

    function getContext() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
        }
      }
      return ctx;
    }

    function ensureUnlocked() {
      const audioCtx = getContext();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
    }

    // Proactively unlock on any gesture
    const unlockEvents = ['touchstart', 'touchend', 'touchmove', 'pointerdown', 'mousedown', 'click', 'wheel', 'scroll', 'keydown'];
    unlockEvents.forEach(function (evt) {
      window.addEventListener(evt, ensureUnlocked, { passive: true, capture: true });
      document.addEventListener(evt, ensureUnlocked, { passive: true, capture: true });
    });

    // Synthesize a crisp, distinctly audible mechanical haptic click
    function playScrollTick(step = 0) {
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;

        if (audioCtx.state === 'suspended') {
          audioCtx.resume().then(function () {
            doPlay(audioCtx, step);
          }).catch(function () {});
          return;
        }

        doPlay(audioCtx, step);
      } catch (_) {}
    }

    function doPlay(audioCtx, step) {
      try {
        const now = audioCtx.currentTime;

        // Master gain node
        const master = audioCtx.createGain();
        master.gain.setValueAtTime(0.55, now);
        master.connect(audioCtx.destination);

        // 1. Crisp transient click (sharp mechanical snap)
        const snapOsc = audioCtx.createOscillator();
        const snapGain = audioCtx.createGain();
        snapOsc.type = 'triangle';
        const snapFreq = 1250 + (Math.abs(step) % 5) * 75;
        snapOsc.frequency.setValueAtTime(snapFreq, now);
        snapOsc.frequency.exponentialRampToValueAtTime(320, now + 0.022);

        snapGain.gain.setValueAtTime(0.50, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

        snapOsc.connect(snapGain);
        snapGain.connect(master);
        snapOsc.start(now);
        snapOsc.stop(now + 0.026);

        // 2. Warm body resonance (gives it solid tactile weight)
        const bodyOsc = audioCtx.createOscillator();
        const bodyGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        bodyOsc.type = 'sine';
        const bodyFreq = 480 + (Math.abs(step) % 4) * 45;
        bodyOsc.frequency.setValueAtTime(bodyFreq, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(160, now + 0.040);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);

        bodyGain.gain.setValueAtTime(0.45, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);

        bodyOsc.connect(filter);
        filter.connect(bodyGain);
        bodyGain.connect(master);

        bodyOsc.start(now);
        bodyOsc.stop(now + 0.045);
      } catch (_) {}
    }

    return {
      playScrollTick,
      ensureUnlocked
    };
  })();

  // ---------------------------------------------------------------------------
  // 5c. USER-CONTROLLED INFINITE SCROLL SOCIAL ICONS CONTROLLER
  // ---------------------------------------------------------------------------
  function setupInfiniteIconScroll() {
    const container = document.getElementById('infinite-scroll-container');
    const track = document.getElementById('infinite-scroll-track');
    const groups = track ? track.querySelectorAll('.infinite-scroll-group') : [];
    const iconOrbs = document.querySelectorAll('.social-icon-orb');

    if (!container || !track || groups.length === 0) return;

    let groupWidth = 0;

    function measureGroup() {
      if (groups[0] && groups[0].offsetWidth > 0) {
        groupWidth = groups[0].offsetWidth;
      }
    }

    // Set scroll position to middle group for seamless bidirectional scrolling
    function centerTrack() {
      measureGroup();
      if (groupWidth > 0) {
        track.scrollLeft = groupWidth;
      }
    }

    setTimeout(centerTrack, 100);
    window.addEventListener('resize', function () {
      measureGroup();
    });
    window.addEventListener('profileScreenActivated', function () {
      setTimeout(centerTrack, 50);
    });

    let trackScrollTimer = null;

    // Tactile sound tick on hover/focus (only when idle)
    iconOrbs.forEach(function (orb, index) {
      orb.addEventListener('mouseenter', function () {
        if (!track.classList.contains('is-scrolling') && !elements.profileScrollCanvas.classList.contains('is-scrolling')) {
          AudioEngine.ensureUnlocked();
          AudioEngine.playScrollTick(index);
        }
      });
    });

    // User horizontal scroll: seamless infinite wrapping + scroll sounds!
    let lastTrackScroll = track.scrollLeft;
    let trackAccumulator = 0;
    let isWrapping = false;
    let lastTickTime = 0;

    track.addEventListener('scroll', function () {
      if (!track.classList.contains('is-scrolling')) {
        track.classList.add('is-scrolling');
      }
      if (document.activeElement && document.activeElement.classList.contains('social-icon-orb')) {
        document.activeElement.blur();
      }
      clearTimeout(trackScrollTimer);
      trackScrollTimer = setTimeout(function () {
        track.classList.remove('is-scrolling');
      }, 120);

      if (isWrapping) return;

      const currentScroll = track.scrollLeft;
      const delta = Math.abs(currentScroll - lastTrackScroll);
      trackAccumulator += delta;
      lastTrackScroll = currentScroll;

      // Play tactile mechanical tick while user is scrolling through icons
      const now = performance.now();
      if (trackAccumulator >= 30 && now - lastTickTime > 45) {
        trackAccumulator = 0;
        lastTickTime = now;
        AudioEngine.playScrollTick(Math.floor(currentScroll / 30));
      }

      // Seamless infinite loop wrapping
      if (groupWidth > 0) {
        if (currentScroll >= groupWidth * 2) {
          isWrapping = true;
          track.scrollLeft = currentScroll - groupWidth;
          lastTrackScroll = track.scrollLeft;
          requestAnimationFrame(function () { isWrapping = false; });
        } else if (currentScroll <= 12) {
          isWrapping = true;
          track.scrollLeft = currentScroll + groupWidth;
          lastTrackScroll = track.scrollLeft;
          requestAnimationFrame(function () { isWrapping = false; });
        }
      }
    }, { passive: true });

    // Allow vertical mouse wheel to scroll horizontally when over the icon ribbon
    track.addEventListener('wheel', function (e) {
      AudioEngine.ensureUnlocked();
      const scrollDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (scrollDelta !== 0) {
        track.scrollLeft += scrollDelta;
        AudioEngine.playScrollTick();
        e.preventDefault();
      }
    }, { passive: false });

    // Global mouse wheel delegation for vertical page scrolling on desktop
    window.addEventListener('wheel', function (e) {
      AudioEngine.ensureUnlocked();
      if (state.currentScreen === 'profile' && elements.profileScrollCanvas) {
        if (e.target && e.target.closest('#infinite-scroll-container')) {
          return; // Let the icon ribbon handle its own horizontal wheel scroll
        }
        elements.profileScrollCanvas.scrollTop += e.deltaY;
      }
    }, { passive: true });

    // Desktop mouse drag-to-scroll support
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let dragDistance = 0;

    track.addEventListener('mousedown', function (e) {
      isDown = true;
      dragDistance = 0;
      startX = e.pageX;
      startScrollLeft = track.scrollLeft;
      track.classList.add('dragging');
    });

    window.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX;
      const walk = (x - startX) * 1.35;
      dragDistance = Math.abs(walk);
      track.scrollLeft = startScrollLeft - walk;
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('dragging');
    });

    // Prevent link click when dragging was intentional swipe
    iconOrbs.forEach(function (orb) {
      orb.addEventListener('click', function (e) {
        if (dragDistance > 8) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          AudioEngine.playScrollTick();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 6. EVENT LISTENERS
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Back / Replay button on profile screen (tapping S A R A T H)
    if (elements.btnBackWelcome) {
      elements.btnBackWelcome.addEventListener('click', function (e) {
        e.preventDefault();
        showWelcomeScreen(true);
      });
    }

    // Browser history navigation (Back / Forward)
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.screen === 'profile') {
        showProfileScreen(false);
      } else if (e.state && e.state.screen === 'welcome') {
        showWelcomeScreen(false);
      } else {
        if (window.location.hash === '#profile') {
          showProfileScreen(false);
        } else {
          showWelcomeScreen(false);
        }
      }
    });

    setupProfileInteractions();
  }

  // ---------------------------------------------------------------------------
  // 7. INITIALIZATION
  // ---------------------------------------------------------------------------
  function init() {
    hydrateFromConfig();
    setupEventListeners();

    // Check URL hash on initial page load
    if (window.location.hash === '#profile') {
      elements.welcomeScreen.classList.remove('active');
      elements.welcomeScreen.style.opacity = '0';
      elements.welcomeScreen.style.visibility = 'hidden';
      elements.profileScreen.classList.add('active');
      elements.profileScreen.style.opacity = '1';
      elements.profileScreen.style.visibility = 'visible';
      state.currentScreen = 'profile';
    } else {
      startSplashVideo();
    }
  }

  // Execute on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
