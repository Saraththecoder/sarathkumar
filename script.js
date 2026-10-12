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
    connectHeaderRow: document.querySelector('.connect-header-row'),
    connectCounterBadge: document.getElementById('connect-counter-badge'),
    btnCarouselPrev: document.getElementById('btn-carousel-prev'),
    btnCarouselNext: document.getElementById('btn-carousel-next'),
    carouselTrack: document.getElementById('connect-carousel-track'),
    carouselDots: document.querySelectorAll('.carousel-dot'),
    connectCards: document.querySelectorAll('.connect-channel-card'),
    profileFooter: document.getElementById('profile-meta-footer'),

    // Social Links
    linkGithub: document.getElementById('link-github'),
    linkInstagram: document.getElementById('link-instagram'),
    linkLinkedin: document.getElementById('link-linkedin'),
    linkEmail: document.getElementById('link-email'),

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

    // Connect Channels
    if (config.connectWithMe && Array.isArray(config.connectWithMe.links)) {
      config.connectWithMe.links.forEach(function (channel) {
        if (channel.id === 'github' && elements.linkGithub && channel.url) elements.linkGithub.href = channel.url;
        if (channel.id === 'instagram' && elements.linkInstagram && channel.url) elements.linkInstagram.href = channel.url;
        if (channel.id === 'linkedin' && elements.linkLinkedin && channel.url) elements.linkLinkedin.href = channel.url;
        if (channel.id === 'email' && elements.linkEmail && channel.url) elements.linkEmail.href = channel.url;
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
  // 5. PROFILE INTERACTIONS (SCROLL PROGRESS, SPOTLIGHT)
  // ---------------------------------------------------------------------------
  function setupProfileInteractions() {
    // Scroll progress bar
    if (elements.profileScrollCanvas) {
      elements.profileScrollCanvas.addEventListener('scroll', function () {
        const el = elements.profileScrollCanvas;
        const scrollTop = el.scrollTop;
        const maxScroll = el.scrollHeight - el.clientHeight;

        if (elements.profileScrollProgress && maxScroll > 0) {
          const progress = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
          elements.profileScrollProgress.style.width = `${progress}%`;
        }

        if (elements.portraitVisualBox && !state.isReducedMotion) {
          const translateY = scrollTop * 0.16;
          const scale = Math.max(0.92, 1 - scrollTop * 0.0003);
          elements.portraitVisualBox.style.transform = `translateY(${translateY}px) scale(${scale})`;
        }
      }, { passive: true });
    }

    // Card cursor spotlight glow
    elements.connectCards.forEach(function (card) {
      function updateSpotlight(clientX, clientY) {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }

      card.addEventListener('mousemove', function (e) {
        updateSpotlight(e.clientX, e.clientY);
      });

      card.addEventListener('touchmove', function (e) {
        if (e.touches && e.touches[0]) {
          updateSpotlight(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
    });

    // Initialize Horizontal Carousel
    setupConnectCarousel();
  }

  // ---------------------------------------------------------------------------
  // 5b. TACTILE HAPTIC AUDIO ENGINE (WEB AUDIO API)
  // ---------------------------------------------------------------------------
  const AudioEngine = (function () {
    let ctx = null;

    function initContext() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
        }
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }
      return ctx;
    }

    // Warm, velvety mechanical haptic click on card scroll / snap
    function playScrollTick(step = 0) {
      try {
        const audioCtx = initContext();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;

        // Base frequency steps subtly with card index (harmonic progression)
        const baseFreq = 520 + (step % 4) * 60;

        // Primary impulse
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.038);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.042);

        // Soft sub-harmonic tap for depth
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(180, now);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.028);

        subGain.gain.setValueAtTime(0.12, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);

        subOsc.start(now);
        subOsc.stop(now + 0.032);
      } catch (_) {}
    }

    // Auto-unlock audio on first touch/interaction
    function unlockAudio() {
      initContext();
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    }
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });

    return {
      playScrollTick
    };
  })();

  // ---------------------------------------------------------------------------
  // 5c. HORIZONTAL CONNECT CAROUSEL CONTROLLER
  // ---------------------------------------------------------------------------
  function setupConnectCarousel() {
    const track = elements.carouselTrack || document.getElementById('connect-carousel-track');
    const cards = track ? track.querySelectorAll('.connect-channel-card') : [];
    const dots = document.querySelectorAll('.carousel-dot');
    const badge = elements.connectCounterBadge || document.getElementById('connect-counter-badge');
    const btnPrev = elements.btnCarouselPrev || document.getElementById('btn-carousel-prev');
    const btnNext = elements.btnCarouselNext || document.getElementById('btn-carousel-next');

    if (!track || cards.length === 0) return;

    let currentIndex = 0;
    const total = cards.length;
    let isUserProgrammaticScroll = false;

    function updateActiveState(index, playSound = false) {
      const prev = currentIndex;
      currentIndex = Math.max(0, Math.min(total - 1, index));

      if (playSound && currentIndex !== prev) {
        AudioEngine.playScrollTick(currentIndex);
      }

      // Update card active classes
      cards.forEach(function (card, i) {
        card.classList.toggle('active', i === currentIndex);
      });

      // Update dots
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentIndex);
      });

      // Update counter badge
      if (badge) {
        badge.textContent = `${currentIndex + 1} / ${total}`;
      }

      // Update buttons
      if (btnPrev) btnPrev.classList.toggle('disabled', currentIndex === 0);
      if (btnNext) btnNext.classList.toggle('disabled', currentIndex === total - 1);
    }

    function scrollToIndex(index) {
      if (index < 0 || index >= total) return;
      isUserProgrammaticScroll = true;
      const targetCard = cards[index];
      if (targetCard) {
        const left = targetCard.offsetLeft - track.offsetLeft - (track.clientWidth - targetCard.clientWidth) / 2;
        track.scrollTo({
          left: Math.max(0, left),
          behavior: 'smooth'
        });
      }
      AudioEngine.playScrollTick(index);
      updateActiveState(index, false);
      setTimeout(function () { isUserProgrammaticScroll = false; }, 420);
    }

    // Scroll listener with RAF debouncing for swipe snap detection
    let scrollRaf = null;
    let lastSnapIndex = 0;

    track.addEventListener('scroll', function () {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);

      scrollRaf = requestAnimationFrame(function () {
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let closestIndex = 0;
        let minDiff = Infinity;

        cards.forEach(function (card, i) {
          const cardCenter = card.offsetLeft - track.offsetLeft + card.clientWidth / 2;
          const diff = Math.abs(trackCenter - cardCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        });

        if (closestIndex !== lastSnapIndex) {
          lastSnapIndex = closestIndex;
          if (!isUserProgrammaticScroll) {
            updateActiveState(closestIndex, true);
          }
        }
      });
    }, { passive: true });

    // Click on pagination dots
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToIndex(i);
      });
    });

    // Prev / Next button clicks
    if (btnPrev) {
      btnPrev.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      });
    }

    // Mouse drag-to-scroll support for desktop
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragDistance = 0;

    track.addEventListener('mousedown', function (e) {
      isDown = true;
      dragDistance = 0;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      track.classList.add('dragging');
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('dragging');
    });

    track.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      dragDistance = Math.abs(walk);
      track.scrollLeft = scrollLeft - walk;
    });

    // Prevent link click when dragging
    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (dragDistance > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });

    // Initialize state
    updateActiveState(0, false);
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
