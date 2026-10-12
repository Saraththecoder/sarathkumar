/**
 * =============================================================================
 * BHASA SARATH KUMAR — PERSONAL QR PORTFOLIO CONFIGURATION
 * =============================================================================
 * Centralized personal credentials, social links, college info, and video splash settings.
 */

window.PORTFOLIO_CONFIG = {
  // ---------------------------------------------------------------------------
  // 1. PERSONAL & ACADEMIC INFORMATION
  // ---------------------------------------------------------------------------
  profile: {
    fullName: "Bhasa Sarath Kumar",
    firstName: "BHASA SARATH",
    lastName: "KUMAR",
    wordmark: "SARATH",
    rollNumber: "24AK1A33D8",
    emailAddress: "bhasasarathkumar051@gmail.com",
    role: "Technical Lead - 24AK1A33D8",
    college: "Annamacharya Institute of Technology and Sciences, Tirupati",
    department: "Artificial Intelligence & Machine Learning (AIRA)",
    collegeLogoPath: "assets/aira-logo.webp",
    collegeLogoAlt: "AIRA — Artificial Intelligence & Robotics Association, AITS Tirupati",
    location: "Tirupati, India",
    eyebrowTitle: "Personal Profile & Social Links",

    // Primary introduction
    introduction:
      "Managing technical workshops, hands-on sessions, projects, research activities and technical support.",

    // Annotation near portrait
    annotationText: ".That's<br>Me! :)",

    // Portrait image path
    portraitPath: "assets/sarath-composite.webp",
    portraitAlt: "Portrait photograph of Bhasa Sarath Kumar"
  },

  // ---------------------------------------------------------------------------
  // 2. CINEMATIC VIDEO SPLASH SCREEN SETTINGS
  // ---------------------------------------------------------------------------
  splash: {
    videoSrc: "splash_screen.mp4",
    videoPoster: "assets/video-poster.webp",
    videoDurationSeconds: 7.0,
    enableAutoRedirect: true,
    transitionDurationMs: 600,
    startMuted: false // Default ON sound (unmuted)
  },

  // ---------------------------------------------------------------------------
  // 3. "CONNECT WITH ME" SOCIAL & CONTACT CHANNELS
  // ---------------------------------------------------------------------------
  connectWithMe: {
    sectionTitle: "Connect With Me",
    links: [
      {
        id: "github",
        title: "GitHub",
        subtitle: "Explore my projects",
        url: "https://github.com/sarathkumar-placeholder",
        icon: "github"
      },
      {
        id: "instagram",
        title: "Instagram",
        subtitle: "Follow my journey",
        url: "https://www.instagram.com/sarathkumar_placeholder",
        icon: "instagram"
      },
      {
        id: "linkedin",
        title: "LinkedIn",
        subtitle: "Let's connect professionally",
        url: "https://www.linkedin.com/in/sarath-kumar-placeholder",
        icon: "linkedin"
      },
      {
        id: "email",
        title: "Email",
        subtitle: "bhasasarathkumar051@gmail.com",
        url: "mailto:bhasasarathkumar051@gmail.com?subject=Hello%20Bhasa%20Sarath%20Kumar",
        icon: "email"
      }
    ]
  },

  // Metadata
  meta: {
    siteTitle: "Bhasa Sarath Kumar | Technical Lead - 24AK1A33D8",
    siteDescription: "Bhasa Sarath Kumar (Roll No: 24AK1A33D8) — Technical Lead at AITS Tirupati (AIRA). Managing technical workshops, hands-on sessions, projects, and research activities."
  }
};
