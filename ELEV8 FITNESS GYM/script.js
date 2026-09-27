/**
 * ==========================================================================
 * ELEVE8 FITNESS GYM - Interactive Core Engine
 * Vanilla JavaScript (ES6+)
 * Features:
 *  - Canvas Particle Background System
 *  - Web Speech API Trainer Voice Coach (SpeechSynthesis)
 *  - Web Audio API Sound Effects (Beeps & Bells)
 *  - Interactive Circular Workout Timer Modal with Auto-Advance
 *  - Dynamic Workout Filters & Routine Sequencer
 *  - Interactive Daily Food Timeline
 *  - Goal Recommendation Engine
 *  - Accessible FAQ Accordion
 *  - Real-time Form Validation & LocalStorage Persistence
 *  - Accessibility Reduced-Motion Mode & ARIA Management
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. ACCESSIBILITY & USER PREFERENCES (LOCALSTORAGE)
     ========================================================================== */
  const motionToggleBtn = document.getElementById('a11y-motion-toggle');
  const mobileMotionBtn = document.getElementById('mobile-a11y-motion');
  const motionModeText = document.getElementById('motion-mode-text');

  // Check saved preference or system preference
  const savedMotion = localStorage.getItem('eleve8_reduced_motion');
  const systemPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setReducedMotion(enable) {
    if (enable) {
      document.body.setAttribute('data-reduced-motion', 'true');
      if (motionToggleBtn) motionToggleBtn.setAttribute('aria-pressed', 'true');
      if (motionModeText) motionModeText.textContent = 'Disable Reduced Motion';
      localStorage.setItem('eleve8_reduced_motion', 'true');
    } else {
      document.body.removeAttribute('data-reduced-motion');
      if (motionToggleBtn) motionToggleBtn.setAttribute('aria-pressed', 'false');
      if (motionModeText) motionModeText.textContent = 'Enable Reduced Motion';
      localStorage.setItem('eleve8_reduced_motion', 'false');
    }
  }

  if (savedMotion === 'true' || (savedMotion === null && systemPrefersReduced)) {
    setReducedMotion(true);
  } else {
    setReducedMotion(false);
  }

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener('click', () => {
      const isCurrentlyReduced = document.body.getAttribute('data-reduced-motion') === 'true';
      setReducedMotion(!isCurrentlyReduced);
    });
  }

  if (mobileMotionBtn) {
    mobileMotionBtn.addEventListener('click', () => {
      const isCurrentlyReduced = document.body.getAttribute('data-reduced-motion') === 'true';
      setReducedMotion(!isCurrentlyReduced);
    });
  }

  /* ==========================================================================
     2. WEB AUDIO API SYNTHESIZER (Timer Countdown Beeps & Chime)
     ========================================================================== */
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Short beep for countdown (3, 2, 1)
    playBeep(freq = 600, duration = 0.12) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    }

    // Two-tone chime for workout finish
    playCompletionChime() {
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Tone 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.frequency.setValueAtTime(523.25, now); // C5
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);

        // Tone 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.frequency.setValueAtTime(783.99, now + 0.18); // G5
        gain2.gain.setValueAtTime(0.2, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.8);
      } catch (e) {
        console.warn('Audio chime error:', e);
      }
    }
  }

  const soundFx = new SoundFX();

  /* ==========================================================================
     3. WEB SPEECH API (TRAINER VOICE COACH)
     ========================================================================== */
  class TrainerVoiceCoach {
    constructor() {
      this.synth = window.speechSynthesis;
      this.speaking = false;
      this.lastSpokenText = '';
      this.preferredVoice = null;

      this.barEl = document.getElementById('audio-coach-bar');
      this.textEl = document.getElementById('audio-coach-text');
      this.stopBtn = document.getElementById('coach-stop-btn');
      this.replayBtn = document.getElementById('coach-replay-btn');

      this.initVoices();
      this.bindControls();
    }

    initVoices() {
      if (!this.synth) return;

      const loadVoices = () => {
        const voices = this.synth.getVoices();
        // Prefer natural English voices
        this.preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha') || v.name.includes('David'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      };

      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    bindControls() {
      if (this.stopBtn) {
        this.stopBtn.addEventListener('click', () => this.stop());
      }
      if (this.replayBtn) {
        this.replayBtn.addEventListener('click', () => {
          if (this.lastSpokenText) {
            this.speak(this.lastSpokenText);
          }
        });
      }
    }

    speak(text) {
      if (!this.synth) {
        alert('Voice coaching is not supported on this browser.');
        return;
      }

      this.stop(); // Stop any pending speech
      this.lastSpokenText = text;

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }
      utterance.rate = 0.98; // natural coach pacing
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.speaking = true;
        this.showBar(text);
      };

      utterance.onend = () => {
        this.speaking = false;
        setTimeout(() => {
          if (!this.speaking) this.hideBar();
        }, 3500);
      };

      utterance.onerror = () => {
        this.speaking = false;
        this.hideBar();
      };

      this.synth.speak(utterance);
    }

    stop() {
      if (this.synth && this.synth.speaking) {
        this.synth.cancel();
      }
      this.speaking = false;
      this.hideBar();
    }

    showBar(text) {
      if (!this.barEl) return;
      if (this.textEl) this.textEl.textContent = text;
      this.barEl.classList.add('visible');
      this.barEl.setAttribute('aria-hidden', 'false');
    }

    hideBar() {
      if (!this.barEl) return;
      this.barEl.classList.remove('visible');
      this.barEl.setAttribute('aria-hidden', 'true');
    }
  }

  const voiceCoach = new TrainerVoiceCoach();

  // Global Voice Test Button in Header
  const voiceTestBtn = document.getElementById('voice-test-btn');
  if (voiceTestBtn) {
    voiceTestBtn.addEventListener('click', () => {
      soundFx.init();
      voiceCoach.speak("Welcome to ELEVE8 FITNESS GYM. I am your digital trainer. Let us elevate your strength, precision, and endurance today!");
    });
  }

  // Attach Voice Coach listeners to all `.btn-voice-trainer` buttons
  document.querySelectorAll('.btn-voice-trainer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundFx.init();
      const speechText = btn.getAttribute('data-speech');
      if (speechText) {
        voiceCoach.speak(speechText);
      }
    });
  });

  /* ==========================================================================
     4. HERO CANVAS PARTICLES
     ========================================================================== */
  const canvas = document.getElementById('hero-particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.6 + 0.2;
        this.color = Math.random() > 0.4 ? 'rgba(212, 255, 0,' : 'rgba(0, 240, 255,';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}${this.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#d4ff00';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = () => {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 22000), 55);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const animateParticles = () => {
      if (document.body.getAttribute('data-reduced-motion') === 'true') {
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 255, 0, ${0.15 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(animateParticles);
    };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    });

    initParticles();
    animateParticles();
  }

  /* ==========================================================================
     5. STICKY NAVBAR & MOBILE MENU
     ========================================================================== */
  const header = document.getElementById('site-header');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-cta-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileToggle.classList.contains('active');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    function openMobileMenu() {
      mobileToggle.classList.add('active');
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileDrawer.classList.add('active');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
      mobileToggle.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileDrawer.classList.remove('active');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => closeMobileMenu());
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
        closeMobileMenu();
      }
    });
  }

  // Active section spy via Intersection Observer
  const sections = document.querySelectorAll('section[id]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(section => navObserver.observe(section));

  /* ==========================================================================
     6. SCROLL REVEAL (INTERSECTION OBSERVER)
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal-item');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================================================
     7. CIRCULAR WORKOUT TIMER (INTERACTIVE MODAL & PLAYER)
     ========================================================================== */
  const timerModal = document.getElementById('timer-modal');
  const timerBackdrop = document.getElementById('timer-backdrop');
  const closeTimerBtn = document.getElementById('close-timer-btn');

  const timerCircleProgress = document.getElementById('timer-circle-progress');
  const timerCountdownDisplay = document.getElementById('timer-countdown-display');
  const timerStateLabel = document.getElementById('timer-state-label');
  const timerModalTitle = document.getElementById('timer-modal-title');
  const timerExerciseInstructions = document.getElementById('timer-exercise-instructions');
  const timerDifficultyBadge = document.getElementById('timer-difficulty-badge');
  const timerSequenceStatus = document.getElementById('timer-sequence-status');
  const timerRoutineTitle = document.getElementById('timer-routine-title');
  const timerProgressFill = document.getElementById('timer-progress-fill');

  const btnTimerToggle = document.getElementById('btn-timer-toggle');
  const timerPlayIcon = document.getElementById('timer-play-icon');
  const timerPauseIcon = document.getElementById('timer-pause-icon');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const btnTimerPrev = document.getElementById('btn-timer-prev');
  const btnTimerNext = document.getElementById('btn-timer-next');
  const modalVoiceBtn = document.getElementById('modal-voice-btn');

  // SVG Circumference for r=115: 2 * Math.PI * 115 ~= 722.56
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 115;
  if (timerCircleProgress) {
    timerCircleProgress.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE}`;
    timerCircleProgress.style.strokeDashoffset = '0';
  }

  // Routine Sequences
  const morningRoutine = [
    { name: "Full Body Warm-Up", duration: 30, diff: "Beginner", instructions: "Rotate neck and shoulders gently. Dynamic hinges to raise core temp.", speech: "Welcome to your warm up. Rotate your neck and shoulders gently. Breathe steadily." },
    { name: "Dynamic Stretching", duration: 45, diff: "Beginner", instructions: "Hamstring sweeps, torso twists, and overhead thoracic reaching.", speech: "Dynamic stretching. Reach overhead, sweep down to your toes, and open up your chest." },
    { name: "Bodyweight Squats", duration: 40, diff: "Intermediate", instructions: "Shoulder-width stance, push hips back, press firmly through full foot.", speech: "Bodyweight squats. Hips back, proud chest, press through the floor to stand tall." },
    { name: "Push-Ups", duration: 35, diff: "Intermediate", instructions: "Brace abs and glutes tightly. Lower chest to 90 degrees and press up.", speech: "Push-ups ready. Keep your body rigid like an iron plank. Lower and press with authority." },
    { name: "Forward & Reverse Lunges", duration: 40, diff: "Intermediate", instructions: "Step forward smoothly. Both knees bend to 90 degrees. Maintain posture.", speech: "Lunges in motion. Controlled steps, keeping torso upright and core engaged." },
    { name: "Isometric Plank Hold", duration: 30, diff: "Beginner", instructions: "Forearms grounded, elbows under shoulders, squeeze abs with full focus.", speech: "Lock in your plank! Keep hips level, glutes tight, and breath steady." },
    { name: "Morning Light Cardio", duration: 45, diff: "Beginner", instructions: "Boxer bounce, high knees, and jumping jacks sequence.", speech: "Cardio burst! Stay light on your toes, pump your arms, and feel the morning energy!" },
    { name: "Morning Cool Down", duration: 30, diff: "Beginner", instructions: "Child's pose, cat-cow flow, and deep parasympathetic breath cycles.", speech: "Cool down time. Deep inhalations, slow exhalations. Fantastic workout!" }
  ];

  let currentRoutineList = morningRoutine;
  let currentExerciseIndex = 0;
  let timerDuration = 30;
  let timerRemaining = 30;
  let timerInterval = null;
  let isTimerRunning = false;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateCircleProgress() {
    if (!timerCircleProgress) return;
    const progressFraction = (timerDuration - timerRemaining) / timerDuration;
    const offset = CIRCLE_CIRCUMFERENCE * progressFraction;
    timerCircleProgress.style.strokeDashoffset = `${offset}`;
  }

  function updateTimerDisplay() {
    if (timerCountdownDisplay) {
      timerCountdownDisplay.textContent = formatTime(timerRemaining);
    }
    updateCircleProgress();
  }

  function loadExercise(index) {
    if (index < 0) index = 0;
    if (index >= currentRoutineList.length) index = currentRoutineList.length - 1;

    currentExerciseIndex = index;
    const ex = currentRoutineList[index];

    timerDuration = ex.duration || 30;
    timerRemaining = timerDuration;

    if (timerModalTitle) timerModalTitle.textContent = ex.name;
    if (timerExerciseInstructions) timerExerciseInstructions.textContent = ex.instructions;
    if (timerDifficultyBadge) timerDifficultyBadge.textContent = ex.diff || 'GENERAL';
    if (timerSequenceStatus) timerSequenceStatus.textContent = `Exercise ${index + 1} of ${currentRoutineList.length}`;
    if (timerProgressFill) {
      const pct = ((index + 1) / currentRoutineList.length) * 100;
      timerProgressFill.style.width = `${pct}%`;
    }

    pauseTimer();
    updateTimerDisplay();
    if (timerStateLabel) timerStateLabel.textContent = 'READY';
  }

  function startTimer() {
    soundFx.init();
    if (isTimerRunning) return;

    isTimerRunning = true;
    if (timerPlayIcon) timerPlayIcon.style.display = 'none';
    if (timerPauseIcon) timerPauseIcon.style.display = 'block';
    if (timerStateLabel) timerStateLabel.textContent = 'WORK';

    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();

      // Audio beeps on last 3 seconds
      if (timerRemaining === 3 || timerRemaining === 2 || timerRemaining === 1) {
        soundFx.playBeep(520, 0.1);
      }

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        soundFx.playCompletionChime();
        if (timerStateLabel) timerStateLabel.textContent = 'COMPLETE!';

        // Auto-advance after 1.5 seconds if more exercises exist
        if (currentExerciseIndex < currentRoutineList.length - 1) {
          voiceCoach.speak(`Great job! Moving to ${currentRoutineList[currentExerciseIndex + 1].name}`);
          setTimeout(() => {
            loadExercise(currentExerciseIndex + 1);
            startTimer();
          }, 2000);
        } else {
          voiceCoach.speak("Routine complete! Outstanding dedication to your health today!");
        }
      }
    }, 1000);
  }

  function pauseTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = false;
    if (timerPlayIcon) timerPlayIcon.style.display = 'block';
    if (timerPauseIcon) timerPauseIcon.style.display = 'none';
    if (timerStateLabel) timerStateLabel.textContent = 'PAUSED';
  }

  function resetTimer() {
    pauseTimer();
    timerRemaining = timerDuration;
    updateTimerDisplay();
    if (timerStateLabel) timerStateLabel.textContent = 'RESET';
  }

  function openTimerModal(routine = morningRoutine, startIndex = 0, customName = "Routine") {
    currentRoutineList = routine;
    if (timerRoutineTitle) timerRoutineTitle.textContent = customName;
    loadExercise(startIndex);

    if (timerModal) {
      timerModal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeTimerModal() {
    pauseTimer();
    voiceCoach.stop();
    if (timerModal) {
      timerModal.setAttribute('hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Timer Dialog Event Listeners
  if (closeTimerBtn) closeTimerBtn.addEventListener('click', closeTimerModal);
  if (timerBackdrop) timerBackdrop.addEventListener('click', closeTimerModal);

  if (btnTimerToggle) {
    btnTimerToggle.addEventListener('click', () => {
      if (isTimerRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (btnTimerReset) btnTimerReset.addEventListener('click', resetTimer);

  if (btnTimerPrev) {
    btnTimerPrev.addEventListener('click', () => {
      if (currentExerciseIndex > 0) {
        loadExercise(currentExerciseIndex - 1);
      }
    });
  }

  if (btnTimerNext) {
    btnTimerNext.addEventListener('click', () => {
      if (currentExerciseIndex < currentRoutineList.length - 1) {
        loadExercise(currentExerciseIndex + 1);
      }
    });
  }

  if (modalVoiceBtn) {
    modalVoiceBtn.addEventListener('click', () => {
      const ex = currentRoutineList[currentExerciseIndex];
      if (ex) {
        voiceCoach.speak(ex.speech || ex.instructions);
      }
    });
  }

  // Attach Start Timer to card buttons
  document.querySelectorAll('.btn-start-timer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundFx.init();

      const card = btn.closest('.workout-card');
      const category = card ? card.getAttribute('data-category') : 'general';
      const name = btn.getAttribute('data-name') || 'Workout Exercise';
      const duration = parseInt(btn.getAttribute('data-duration') || '30', 10);
      const instructions = btn.getAttribute('data-instructions') || 'Perform movement with good form.';

      // Generate a single item or routine
      const singleRoutine = [
        {
          name: name,
          duration: duration,
          diff: card?.querySelector('.badge-difficulty')?.textContent || 'All Levels',
          instructions: instructions,
          speech: `Starting ${name}. Duration: ${duration} seconds. Focus on continuous breath and controlled mechanics.`
        }
      ];

      openTimerModal(singleRoutine, 0, category === 'morning' ? 'Morning Routine' : category === 'night' ? 'Night Routine' : 'Home Routine');
      startTimer();
    });
  });

  // Close modal on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && timerModal && !timerModal.hasAttribute('hidden')) {
      closeTimerModal();
    }
  });

  /* ==========================================================================
     8. ONLINE WORKOUTS CATEGORY FILTER
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterCards = document.querySelectorAll('.filter-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetFilter = btn.getAttribute('data-filter');
      let visibleCount = 0;

      filterCards.forEach(card => {
        const tags = card.getAttribute('data-tags') || '';
        if (targetFilter === 'all' || tags.includes(targetFilter)) {
          card.classList.remove('filter-hidden');
          visibleCount++;
        } else {
          card.classList.add('filter-hidden');
        }
      });

      // Update active button count badge if applicable
      const countSpan = btn.querySelector('.filter-count');
      if (countSpan && targetFilter === 'all') {
        countSpan.textContent = visibleCount;
      }
    });
  });

  /* ==========================================================================
     9. TRAINER DETAIL MODAL
     ========================================================================== */
  const trainerModal = document.getElementById('trainer-modal');
  const trainerBackdrop = document.getElementById('trainer-backdrop');
  const closeTrainerBtn = document.getElementById('close-trainer-btn');
  const modalTrainerName = document.getElementById('modal-trainer-name');
  const modalTrainerSpecialty = document.getElementById('modal-trainer-specialty');
  const modalTrainerExp = document.getElementById('modal-trainer-exp');
  const modalTrainerBio = document.getElementById('modal-trainer-bio');
  const modalTrainerSpeakBtn = document.getElementById('modal-trainer-speak-btn');

  let currentTrainerSpeech = '';

  document.querySelectorAll('.btn-view-trainer').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-trainer-name');
      const spec = btn.getAttribute('data-specialty');
      const exp = btn.getAttribute('data-exp');
      const bio = btn.getAttribute('data-bio');

      if (modalTrainerName) modalTrainerName.textContent = name;
      if (modalTrainerSpecialty) modalTrainerSpecialty.textContent = spec;
      if (modalTrainerExp) modalTrainerExp.textContent = exp;
      if (modalTrainerBio) modalTrainerBio.textContent = bio;

      // Find the card voice text for speech
      const card = btn.closest('.trainer-card');
      const voiceBtn = card ? card.querySelector('.btn-voice-trainer') : null;
      currentTrainerSpeech = voiceBtn ? voiceBtn.getAttribute('data-speech') : `Welcome! I am Coach ${name}.`;

      if (trainerModal) {
        trainerModal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeTrainerModal() {
    if (trainerModal) {
      trainerModal.setAttribute('hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (closeTrainerBtn) closeTrainerBtn.addEventListener('click', closeTrainerModal);
  if (trainerBackdrop) trainerBackdrop.addEventListener('click', closeTrainerModal);

  if (modalTrainerSpeakBtn) {
    modalTrainerSpeakBtn.addEventListener('click', () => {
      soundFx.init();
      if (currentTrainerSpeech) voiceCoach.speak(currentTrainerSpeech);
    });
  }

  /* ==========================================================================
     10. FOOD PLANS CATEGORY FILTER
     ========================================================================== */
  const foodPills = document.querySelectorAll('.food-pill');
  const foodCards = document.querySelectorAll('.food-card');

  foodPills.forEach(pill => {
    pill.addEventListener('click', () => {
      foodPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');

      const cat = pill.getAttribute('data-food-cat');
      foodCards.forEach(card => {
        const cardCat = card.getAttribute('data-food');
        if (cat === 'all' || cardCat === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ==========================================================================
     11. DAILY FOOD ROUTINE INTERACTIVE TIMELINE
     ========================================================================== */
  const routineTimelineData = {
    "1": {
      time: "07:30 AM • MORNING START",
      title: "High-Protein Berry & Chia Power Oats",
      focus: "Replenishes liver glycogen depleted overnight, provides sustained slow-release glucose, and stimulates muscle protein synthesis.",
      hydration: "500ml room temperature water with a pinch of Celtic sea salt and lemon juice before eating.",
      ingredients: "Rolled organic oats, scoop of clean isolate protein, chia seeds, fresh blueberries, and crushed almonds.",
      coach: '"Do not skip morning protein. Consuming 30 grams within 90 minutes of waking supports stable dopamine levels throughout the morning." — Coach Marcus'
    },
    "2": {
      time: "10:30 AM • MID-MORNING BOOST",
      title: "Cultured Greek Yogurt with Raw English Walnuts",
      focus: "Slow-digesting micellar casein and healthy fats prevent energy lulls and support sustained executive cognitive focus.",
      hydration: "250ml green tea or filtered mineral water with mint leaves.",
      ingredients: "Plain 0% Greek yogurt, raw English walnuts, fresh raspberries, splash of pure vanilla.",
      coach: '"Mid-morning fats and probiotics keep blood sugar flat, keeping you sharp without brain fog." — Coach Elena'
    },
    "3": {
      time: "01:00 PM • MID-DAY SUSTENANCE",
      title: "Grilled Herb Chicken & Mediterranean Quinoa Bowl",
      focus: "Dense micronutrient loading, complete amino acid profile, and low-glycemic fiber for sustained afternoon drive.",
      hydration: "400ml chilled electrolyte water.",
      ingredients: "Seasoned free-range chicken breast, tricolor quinoa, baby spinach, avocado slices, extra virgin olive oil drizzle.",
      coach: '"Avoid heavy refined carbohydrates at lunch. Lean proteins and leafy greens keep digestion light and energetic." — Coach Jordan'
    },
    "4": {
      time: "04:30 PM • PRE-WORKOUT PRIMING",
      title: "Sprouted Banana Toast with Stoneground Almond Butter",
      focus: "Easily digestible glycogen loading to maximize muscle pump and muscular ATP output during workout intervals.",
      hydration: "350ml water 30 minutes before workout.",
      ingredients: "Sprouted sourdough slice, half banana sliced, 1 tbsp raw almond butter, Ceylon cinnamon.",
      coach: '"Eat your pre-workout fuel 45 minutes before starting so your stomach is calm and muscles are topped up." — Coach Sarah'
    },
    "5": {
      time: "06:00 PM • POST-WORKOUT CELL RECOVERY",
      title: "Anabolic Nitro Whey Recovery Shake",
      focus: "Rapid spike in systemic leucine for accelerated protein synthesis and tart cherries to mitigate delayed onset muscle soreness.",
      hydration: "500ml cold water blended with shake.",
      ingredients: "Cold-filtered whey isolate (or organic pea protein), tart cherry concentrate, unsweetened oat milk.",
      coach: '"Hydrate quickly and restore amino acids within 45 minutes of finishing your training." — Coach David'
    },
    "6": {
      time: "08:00 PM • EVENING NOURISHMENT",
      title: "Wild Alaskan Salmon & Roasted Sweet Potato",
      focus: "High concentration of EPA/DHA Omega-3s to calm inflammation, paired with sweet potato to promote deep restorative REM sleep.",
      hydration: "Chamomile or magnesium tea 1 hour after dinner.",
      ingredients: "Wild salmon fillet, roasted sweet potato wedges, steamed asparagus spears, lemon butter sauce.",
      coach: '"Your body rebuilds while you sleep. Nutritious fats and evening complex carbs support restful slumber." — Coach Maya'
    }
  };

  const timelineSteps = document.querySelectorAll('.timeline-step');
  const detailTimeEl = document.getElementById('detail-slot-time');
  const detailTitleEl = document.getElementById('detail-slot-title');
  const detailFocusEl = document.getElementById('detail-slot-focus');
  const detailHydrationEl = document.getElementById('detail-slot-hydration');
  const detailIngredientsEl = document.getElementById('detail-slot-ingredients');
  const detailCoachEl = document.getElementById('detail-slot-coach');

  timelineSteps.forEach(step => {
    step.addEventListener('click', () => {
      timelineSteps.forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-selected', 'false');
      });
      step.classList.add('active');
      step.setAttribute('aria-selected', 'true');

      const stepNum = step.getAttribute('data-step');
      const data = routineTimelineData[stepNum];

      if (data) {
        if (detailTimeEl) detailTimeEl.textContent = data.time;
        if (detailTitleEl) detailTitleEl.textContent = data.title;
        if (detailFocusEl) detailFocusEl.textContent = data.focus;
        if (detailHydrationEl) detailHydrationEl.textContent = data.hydration;
        if (detailIngredientsEl) detailIngredientsEl.textContent = data.ingredients;
        if (detailCoachEl) detailCoachEl.textContent = data.coach;
      }
    });
  });

  /* ==========================================================================
     12. FITNESS GOALS INTERACTION & RECOMMENDATION ENGINE
     ========================================================================== */
  const goalCards = document.querySelectorAll('.goal-card');
  const goalMap = {
    'strength': 'strength',
    'fitness': 'cardio',
    'mobility': 'mobility',
    'active': 'full-body',
    'home': 'home',
    'beginner': 'beginner'
  };

  goalCards.forEach(card => {
    const handleGoalSelect = () => {
      goalCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const goalKey = card.getAttribute('data-goal');
      const matchingFilter = goalMap[goalKey] || 'all';

      // Pre-select in registration form if available
      const regGoalSelect = document.getElementById('reg-goal');
      if (regGoalSelect) {
        const goalName = card.querySelector('.goal-name')?.textContent;
        if (goalName) {
          for (let opt of regGoalSelect.options) {
            if (opt.value.toLowerCase().includes(goalKey)) {
              regGoalSelect.value = opt.value;
              break;
            }
          }
        }
      }

      // Scroll to workouts and trigger filter
      const targetBtn = document.querySelector(`.filter-btn[data-filter="${matchingFilter}"]`);
      if (targetBtn) {
        targetBtn.click();
      }

      const workoutsSection = document.getElementById('online-workouts');
      if (workoutsSection) {
        workoutsSection.scrollIntoView({ behavior: 'smooth' });
      }

      soundFx.playBeep(660, 0.15);
      const goalTitle = card.querySelector('.goal-name')?.textContent || 'Goal';
      voiceCoach.speak(`Goal selected: ${goalTitle}. Displaying tailored workout recommendations.`);
    };

    card.addEventListener('click', handleGoalSelect);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleGoalSelect();
      }
    });
  });

  /* ==========================================================================
     13. ACCESSIBLE FAQ ACCORDION
     ========================================================================== */
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId = trigger.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const item = trigger.closest('.accordion-item');

      // Close all other accordion items for clean UX
      accordionTriggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherPanelId = otherTrigger.getAttribute('aria-controls');
          const otherPanel = document.getElementById(otherPanelId);
          if (otherPanel) otherPanel.hidden = true;
          otherTrigger.closest('.accordion-item')?.classList.remove('active');
        }
      });

      // Toggle current
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
        if (item) item.classList.remove('active');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        if (panel) panel.hidden = false;
        if (item) item.classList.add('active');
      }
    });
  });

  /* ==========================================================================
     14. REGISTRATION FORM VALIDATION & LOCALSTORAGE
     ========================================================================== */
  const regForm = document.getElementById('eleve8-reg-form');
  const formAlert = document.getElementById('form-alert');
  const userProfileBadge = document.getElementById('user-profile-badge');
  const badgeUserName = document.getElementById('badge-user-name');
  const badgeUserGoal = document.getElementById('badge-user-goal');
  const badgeAvatarLetter = document.getElementById('badge-avatar-letter');
  const logoutBtn = document.getElementById('logout-btn');

  // Check existing membership
  function checkExistingMember() {
    const savedUser = localStorage.getItem('eleve8_member');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (userProfileBadge) userProfileBadge.style.display = 'flex';
        if (badgeUserName) badgeUserName.textContent = user.fullname;
        if (badgeUserGoal) badgeUserGoal.textContent = `Goal: ${user.goal} • ${user.level}`;
        if (badgeAvatarLetter) badgeAvatarLetter.textContent = user.fullname.charAt(0).toUpperCase();

        // Populate fields
        const nameInput = document.getElementById('reg-fullname');
        const emailInput = document.getElementById('reg-email');
        if (nameInput) nameInput.value = user.fullname;
        if (emailInput) emailInput.value = user.email;
      } catch (e) {
        console.error('Error loading member profile', e);
      }
    }
  }

  checkExistingMember();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('eleve8_member');
      if (userProfileBadge) userProfileBadge.style.display = 'none';
      if (regForm) regForm.reset();
      showAlert('Account switched. You can now register a new membership.', 'success');
    });
  }

  function showAlert(message, type = 'success') {
    if (!formAlert) return;
    formAlert.textContent = message;
    formAlert.className = `form-alert ${type}`;
    formAlert.style.display = 'block';
  }

  function clearAlert() {
    if (!formAlert) return;
    formAlert.style.display = 'none';
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone.trim());
  }

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('is-invalid'));
  }

  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert();
      clearErrors();

      let hasError = false;

      const fullname = document.getElementById('reg-fullname')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const phone = document.getElementById('reg-phone')?.value.trim();
      const age = parseInt(document.getElementById('reg-age')?.value, 10);
      const goal = document.getElementById('reg-goal')?.value;
      const time = document.getElementById('reg-time')?.value;
      const level = document.getElementById('reg-level')?.value;
      const location = document.getElementById('reg-location')?.value;
      const password = document.getElementById('reg-password')?.value;
      const terms = document.getElementById('reg-terms')?.checked;

      // Full Name validation
      if (!fullname || fullname.length < 2) {
        document.getElementById('err-fullname').textContent = 'Please enter your full name (at least 2 characters).';
        document.getElementById('reg-fullname')?.classList.add('is-invalid');
        hasError = true;
      }

      // Email validation
      if (!email || !validateEmail(email)) {
        document.getElementById('err-email').textContent = 'Please enter a valid email address.';
        document.getElementById('reg-email')?.classList.add('is-invalid');
        hasError = true;
      }

      // Phone validation
      if (!phone || !validatePhone(phone)) {
        document.getElementById('err-phone').textContent = 'Please enter a valid phone number.';
        document.getElementById('reg-phone')?.classList.add('is-invalid');
        hasError = true;
      }

      // Age validation
      if (isNaN(age) || age < 14 || age > 100) {
        document.getElementById('err-age').textContent = 'Please enter an age between 14 and 100.';
        document.getElementById('reg-age')?.classList.add('is-invalid');
        hasError = true;
      }

      // Goal dropdown
      if (!goal) {
        document.getElementById('err-goal').textContent = 'Please select your primary fitness goal.';
        document.getElementById('reg-goal')?.classList.add('is-invalid');
        hasError = true;
      }

      // Preferred Time dropdown
      if (!time) {
        document.getElementById('err-time').textContent = 'Please select your preferred workout time.';
        document.getElementById('reg-time')?.classList.add('is-invalid');
        hasError = true;
      }

      // Experience Level dropdown
      if (!level) {
        document.getElementById('err-level').textContent = 'Please select your experience level.';
        document.getElementById('reg-level')?.classList.add('is-invalid');
        hasError = true;
      }

      // Training Location dropdown
      if (!location) {
        document.getElementById('err-location').textContent = 'Please select your training preference.';
        document.getElementById('reg-location')?.classList.add('is-invalid');
        hasError = true;
      }

      // Password validation
      if (!password || password.length < 6) {
        document.getElementById('err-password').textContent = 'Password must contain at least 6 characters.';
        document.getElementById('reg-password')?.classList.add('is-invalid');
        hasError = true;
      }

      // Terms validation
      if (!terms) {
        document.getElementById('err-terms').textContent = 'You must agree to the terms and privacy policy.';
        hasError = true;
      }

      if (hasError) {
        showAlert('Please correct the highlighted fields above.', 'error');
        return;
      }

      // Save to LocalStorage
      const userData = {
        fullname,
        email,
        phone,
        age,
        goal,
        time,
        level,
        location,
        registeredAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('eleve8_member', JSON.stringify(userData));
        soundFx.playCompletionChime();
        showAlert(`Welcome to ELEVE8, ${fullname}! Your membership pass has been generated.`, 'success');
        checkExistingMember();
        voiceCoach.speak(`Congratulations ${fullname}! You are now an official member of ELEVE8 FITNESS GYM. Your customized journey is unlocked.`);
      } catch (err) {
        console.error('LocalStorage write error', err);
        showAlert('Registration completed for this session!', 'success');
      }
    });
  }

  /* ==========================================================================
     15. CONTACT & NEWSLETTER FORMS
     ========================================================================== */
  const contactForm = document.getElementById('contact-message-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value;
      alert(`Thank you, ${name}! Your inquiry has been sent to our coaching desk. A trainer will get back to you within 2 hours.`);
      contactForm.reset();
    });
  }

  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterMsg = document.getElementById('newsletter-msg');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (newsletterMsg) {
        newsletterMsg.textContent = '✓ You are subscribed! Check your inbox for your first workout guide.';
        setTimeout(() => { newsletterMsg.textContent = ''; }, 5000);
      }
      newsletterForm.reset();
    });
  }

  // Console Welcome Stamp
  console.log('%c ELEVE8 FITNESS GYM %c Elevate Your Body. Elevate Your Life. ', 'background: #d4ff00; color: #0a0b0e; font-weight: bold; padding: 4px 8px; border-radius: 4px;', 'background: #11131a; color: #00f0ff; padding: 4px 8px; border-radius: 4px;');
});
