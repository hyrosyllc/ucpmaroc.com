export const HTML_TEMPLATES = [
  {
    id: "pure-css-card",
    name: "Animated Glass Card",
    description: "A beautiful, responsive card using pure CSS and zero JavaScript. Perfect for highlighting a specific service.",
    allowJavascript: false,
    useTailwind: false,
    code: `<style>
  /* We scope our CSS to prevent it from bleeding into the main website */
  .ch-glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2rem;
    max-width: 400px;
    margin: 2rem auto;
    color: white;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .ch-glass-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .ch-btn {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    background: #38bdf8;
    color: #030712;
    font-weight: 800;
    border-radius: 99px;
    text-decoration: none;
    transition: background 0.3s ease;
  }

  .ch-btn:hover {
    background: #7dd3fc;
  }
</style>

<div class="ch-glass-card">
  <h2 style="margin: 0 0 0.5rem; font-size: 1.5rem;">Pure CSS Magic</h2>
  <p style="margin: 0; opacity: 0.8; font-size: 0.9rem;">
    This entire card is styled using vanilla CSS. No JavaScript or Tailwind required!
  </p>
  <a href="#contact" class="ch-btn">Get Started</a>
</div>`
  },
  {
    id: "tailwind-js-checkout",
    name: "LUMINA JS Demo",
    description: "Uses Tailwind CSS for rapid styling and Sandboxed JS.",
    allowJavascript: true,
    useTailwind: true,
    code: `<!-- Tailwind CSS is injected automatically! -->
<style>
  /* --- 1. CORE SPATIAL SETUP & DESIGN TOKENS --- */
  .ucp-wrapper {
    /* Centralized Design Tokens */
    --ucp-bg: #030712;
    --ucp-surface: rgba(255, 255, 255, 0.02);
    --ucp-surface-hover: rgba(255, 255, 255, 0.05);
    --ucp-border: rgba(255, 255, 255, 0.08);
    --ucp-border-glow: rgba(255, 255, 255, 0.2);
    --ucp-primary: #38bdf8;
    --ucp-secondary: #a855f7;
    --ucp-accent: #10b981;
    --ucp-text-main: #f8fafc;
    --ucp-text-muted: #94a3b8;

    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: var(--ucp-bg);
    color: var(--ucp-text-main);
    width: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    position: relative;
    box-sizing: border-box;
    scroll-behavior: smooth;
    /* Smooth scrolling for anchor links */
  }

  .ucp-wrapper *,
  .ucp-wrapper *::before,
  .ucp-wrapper *::after {
    box-sizing: inherit;
  }

  /* Dynamic Glowing Ambient Background Orbs */
  .ucp-orb-1,
  .ucp-orb-2,
  .ucp-orb-3 {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
    pointer-events: none;
    opacity: 0.6;
  }

  .ucp-orb-1 {
    top: 10%;
    left: -5%;
    width: 50vw;
    height: 50vw;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%);
    animation: ucp-float-complex 20s ease-in-out infinite;
  }

  .ucp-orb-2 {
    bottom: 20%;
    right: -5%;
    width: 60vw;
    height: 60vw;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 60%);
    animation: ucp-float-complex 25s ease-in-out infinite reverse;
  }

  .ucp-orb-3 {
    top: 60%;
    left: 30%;
    width: 30vw;
    height: 30vw;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
    animation: ucp-float-complex 18s ease-in-out infinite 2s;
  }

  @keyframes ucp-float-complex {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    33% {
      transform: translate(3%, -5%) scale(1.05);
    }

    66% {
      transform: translate(-2%, 4%) scale(0.95);
    }
  }

  /* --- 2. ADVANCED HEADER & NAVIGATION FIXES --- */
  .ucp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 5%;
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(3, 7, 18, 0.5);
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);
    border-bottom: 1px solid var(--ucp-border);
  }

  .ucp-logo {
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: -0.05em;
    text-decoration: none;
    background: linear-gradient(to right, #fff, var(--ucp-text-muted));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    position: relative;
    z-index: 200;
  }

  .ucp-logo::after {
    content: "6.0";
    position: absolute;
    top: -5px;
    right: -25px;
    font-size: 0.6rem;
    color: var(--ucp-primary);
    -webkit-text-fill-color: var(--ucp-primary);
  }

  .ucp-mobile-toggle,
  .ucp-hamburger {
    display: none;
  }

  .ucp-nav {
    display: flex;
    gap: 2.5rem;
    align-items: center;
  }

  .ucp-nav a {
    color: var(--ucp-text-muted);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.3s ease;
    position: relative;
  }

  .ucp-nav a:hover {
    color: var(--ucp-text-main);
  }

  .ucp-nav a::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--ucp-primary);
    transition: width 0.3s ease;
  }

  .ucp-nav a:hover::after {
    width: 100%;
  }

  @media (max-width: 768px) {
    .ucp-hamburger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      z-index: 200;
      position: relative;
    }

    .ucp-hamburger span {
      display: block;
      width: 100%;
      height: 2px;
      background: var(--ucp-text-main);
      border-radius: 2px;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: center left;
    }

    .ucp-mobile-toggle:checked~.ucp-hamburger span:nth-child(1) {
      transform: rotate(45deg) translate(0px, -2px);
      background: var(--ucp-primary);
    }

    .ucp-mobile-toggle:checked~.ucp-hamburger span:nth-child(2) {
      opacity: 0;
      transform: translateX(20px);
    }

    .ucp-mobile-toggle:checked~.ucp-hamburger span:nth-child(3) {
      transform: rotate(-45deg) translate(0px, 2px);
      background: var(--ucp-primary);
    }

    .ucp-nav {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(3, 7, 18, 0.95);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      z-index: 150;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateY(-20px) scale(0.98);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ucp-mobile-toggle:checked~.ucp-nav {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .ucp-nav a {
      font-size: 2.25rem;
      font-weight: 800;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s ease;
      text-align: center;
    }

    .ucp-nav label {
      cursor: pointer;
      display: block;
      width: 100%;
      padding: 10px;
    }

    .ucp-mobile-toggle:checked~.ucp-nav a {
      opacity: 1;
      transform: translateY(0);
    }

    .ucp-mobile-toggle:checked~.ucp-nav a:nth-child(1) {
      transition-delay: 0.1s;
    }

    .ucp-mobile-toggle:checked~.ucp-nav a:nth-child(2) {
      transition-delay: 0.15s;
    }

    .ucp-mobile-toggle:checked~.ucp-nav a:nth-child(3) {
      transition-delay: 0.2s;
    }

    .ucp-mobile-toggle:checked~.ucp-nav a:nth-child(4) {
      transition-delay: 0.25s;
    }

    .ucp-nav a::after {
      display: none;
    }

    .ucp-nav a:hover {
      background: linear-gradient(135deg, var(--ucp-primary), var(--ucp-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      transform: scale(1.05);
    }
  }

  .ucp-section {
    padding: 6rem 5%;
    position: relative;
    z-index: 10;
    scroll-margin-top: 80px;
  }

  .ucp-section-header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .ucp-section-title {
    font-size: 2.75rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }

  .ucp-section-desc {
    color: var(--ucp-text-muted);
    max-width: 550px;
    margin: 0 auto;
    font-size: 1.1rem;
  }

  /* --- 3. FULL-SCREEN CINEMATIC HERO SLIDER --- */
  .ucp-hero-wrapper {
    position: relative;
    width: 100%;
    height: 100vh;
    min-height: 700px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-top: -80px;
  }

  .ucp-hero-radio {
    display: none;
  }

  .ucp-hero-bg {
    position: absolute;
    inset: 0;
    opacity: 0;
    z-index: 1;
    transition: opacity 1.5s ease-in-out, transform 4s ease-out;
    transform: scale(1.1);
  }

  .ucp-hero-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(3, 7, 18, 0.7) 0%, rgba(3, 7, 18, 0.4) 50%, rgba(3, 7, 18, 1) 100%);
  }

  .ucp-hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  #ucp-hs-1:checked~.ucp-bg-1,
  #ucp-hs-2:checked~.ucp-bg-2,
  #ucp-hs-3:checked~.ucp-bg-3 {
    opacity: 1;
    transform: scale(1);
    z-index: 2;
  }

  .ucp-hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 0 5%;
    width: 100%;
    transform: translateY(20px);
  }

  .ucp-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    backdrop-filter: blur(10px);
    color: var(--ucp-text-main);
    margin-bottom: 2rem;
  }

  .ucp-pill-dot {
    width: 8px;
    height: 8px;
    background: var(--ucp-primary);
    border-radius: 50%;
    box-shadow: 0 0 12px var(--ucp-primary);
    animation: ucp-pulse 2s infinite;
  }

  .ucp-title {
    font-size: clamp(3rem, 7vw, 6.5rem);
    font-weight: 800;
    line-height: 1.05;
    margin: 0 auto 1.5rem;
    max-width: 1100px;
    letter-spacing: -0.04em;
  }

  .ucp-text-glow {
    background: linear-gradient(to right, var(--ucp-primary), var(--ucp-secondary), var(--ucp-accent), var(--ucp-primary));
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: ucp-gradient-shift 5s linear infinite;
  }

  .ucp-subtitle {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--ucp-text-muted);
    max-width: 650px;
    margin: 0 auto 3.5rem;
    line-height: 1.7;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  .ucp-btn-group {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .ucp-btn-primary {
    background: var(--ucp-text-main);
    color: var(--ucp-bg);
    padding: 1rem 2.5rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    box-shadow: 0 10px 30px -10px rgba(255, 255, 255, 0.4);
  }

  .ucp-btn-primary:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 20px 40px -10px rgba(255, 255, 255, 0.6);
  }

  .ucp-hero-controls {
    position: absolute;
    bottom: 3rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.75rem;
    z-index: 10;
  }

  .ucp-hero-dot {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  #ucp-hs-1:checked~.ucp-hero-controls label[for="ucp-hs-1"],
  #ucp-hs-2:checked~.ucp-hero-controls label[for="ucp-hs-2"],
  #ucp-hs-3:checked~.ucp-hero-controls label[for="ucp-hs-3"] {
    background: var(--ucp-primary);
    box-shadow: 0 0 10px var(--ucp-primary);
  }

  /* --- 4. NETFLIX-STYLE CINEMATIC GALLERY --- */
  .ucp-netflix-wrapper {
    margin-top: 2rem;
    position: relative;
  }

  .ucp-netflix-wrapper::before,
  .ucp-netflix-wrapper::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 80px;
    z-index: 5;
    pointer-events: none;
  }

  .ucp-netflix-wrapper::before {
    left: 0;
    background: linear-gradient(to right, var(--ucp-bg), transparent);
  }

  .ucp-netflix-wrapper::after {
    right: 0;
    background: linear-gradient(to left, var(--ucp-bg), transparent);
  }

  .ucp-netflix-scroll {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 3rem 5%;
    scrollbar-width: none;
  }

  .ucp-netflix-scroll::-webkit-scrollbar {
    display: none;
  }

  .ucp-netflix-item {
    flex: 0 0 calc(33.333% - 1rem);
    min-width: 300px;
    max-width: 450px;
    aspect-ratio: 16/9;
    scroll-snap-align: center;
    border-radius: 1rem;
    overflow: hidden;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s;
    position: relative;
    z-index: 1;
    cursor: pointer;
    border: 1px solid var(--ucp-border);
  }

  .ucp-netflix-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ucp-netflix-item:hover {
    transform: scale(1.15) translateY(-10px);
    z-index: 10;
    box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .ucp-netflix-item:hover img {
    transform: scale(1.05);
  }

  .ucp-netflix-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.4s;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1.5rem;
  }

  .ucp-netflix-item:hover .ucp-netflix-overlay {
    opacity: 1;
  }

  .ucp-netflix-title {
    color: white;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    transform: translateY(10px);
    transition: transform 0.4s;
  }

  .ucp-netflix-tag {
    color: var(--ucp-primary);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transform: translateY(10px);
    transition: transform 0.4s;
    transition-delay: 0.05s;
  }

  .ucp-netflix-item:hover .ucp-netflix-title,
  .ucp-netflix-item:hover .ucp-netflix-tag {
    transform: translateY(0);
  }

  /* --- 5. INTERACTIVE CSS TESTIMONIAL SLIDER --- */
  .ucp-slider-container {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    background: var(--ucp-surface);
    border: 1px solid var(--ucp-border);
    border-radius: 1.5rem;
    overflow: hidden;
    padding: 1px;
  }

  .ucp-slide-radio {
    display: none;
  }

  .ucp-slider-track {
    display: flex;
    width: 300%;
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .ucp-slide-content {
    width: 33.333%;
    padding: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ucp-slide-content p {
    font-size: 1.25rem;
    font-style: italic;
    color: #e4e4e7;
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }

  .ucp-slide-author {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .ucp-slide-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
  }

  #ucp-ts-1:checked~.ucp-slider-track {
    transform: translateX(0%);
  }

  #ucp-ts-2:checked~.ucp-slider-track {
    transform: translateX(-33.333%);
  }

  #ucp-ts-3:checked~.ucp-slider-track {
    transform: translateX(-66.666%);
  }

  .ucp-slider-controls {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .ucp-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 3rem;
    height: 3rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    font-size: 1.2rem;
    pointer-events: auto;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .ucp-arrow:hover {
    background: var(--ucp-primary);
    border-color: var(--ucp-primary);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
  }

  .ucp-arrow-left {
    left: 1.5rem;
  }

  .ucp-arrow-right {
    right: 1.5rem;
  }

  #ucp-ts-1:checked~.ucp-slider-controls .ucp-arr-left-3,
  #ucp-ts-1:checked~.ucp-slider-controls .ucp-arr-right-2 {
    display: flex;
  }

  #ucp-ts-2:checked~.ucp-slider-controls .ucp-arr-left-1,
  #ucp-ts-2:checked~.ucp-slider-controls .ucp-arr-right-3 {
    display: flex;
  }

  #ucp-ts-3:checked~.ucp-slider-controls .ucp-arr-left-2,
  #ucp-ts-3:checked~.ucp-slider-controls .ucp-arr-right-1 {
    display: flex;
  }

  .ucp-slider-dots {
    position: absolute;
    bottom: 1.5rem;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    pointer-events: auto;
  }

  .ucp-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  #ucp-ts-1:checked~.ucp-slider-dots label[for="ucp-ts-1"],
  #ucp-ts-2:checked~.ucp-slider-dots label[for="ucp-ts-2"],
  #ucp-ts-3:checked~.ucp-slider-dots label[for="ucp-ts-3"] {
    background: var(--ucp-primary);
    width: 20px;
    border-radius: 5px;
  }

  /* --- 6. CONTACT FORM & FULL-WIDTH MAP --- */
  .ucp-contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (min-width: 900px) {
    .ucp-contact-grid {
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
  }

  .ucp-contact-form {
    background: var(--ucp-surface);
    border: 1px solid var(--ucp-border);
    border-radius: 1.5rem;
    padding: 3rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .ucp-form-group {
    margin-bottom: 1.5rem;
  }

  .ucp-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ucp-text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ucp-input {
    width: 100%;
    padding: 1rem 1.25rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--ucp-border);
    border-radius: 0.75rem;
    color: var(--ucp-text-main);
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .ucp-input:focus {
    outline: none;
    border-color: var(--ucp-primary);
    background: rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15);
  }

  textarea.ucp-input {
    resize: vertical;
    min-height: 150px;
  }

  .ucp-btn-submit {
    width: 100%;
    background: linear-gradient(135deg, var(--ucp-primary), var(--ucp-secondary));
    color: #fff;
    border: none;
    padding: 1rem;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .ucp-btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.5);
  }

  .ucp-contact-info h3 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 1rem;
  }

  .ucp-contact-info p {
    color: var(--ucp-text-muted);
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  .ucp-info-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 1rem;
  }

  .ucp-info-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--ucp-surface);
    border: 1px solid var(--ucp-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ucp-primary);
  }

  /* Full Width Dark Map */
  .ucp-map-container {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    height: 450px;
    position: relative;
    margin-top: 4rem;
    border-top: 1px solid var(--ucp-border);
    border-bottom: 1px solid var(--ucp-border);
  }

  .ucp-map-container iframe {
    width: 100%;
    height: 100%;
    border: 0;
    filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(120%) saturate(150%);
  }

  /* --- 7. FOOTER --- */
  .ucp-footer {
    padding: 4rem 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(3, 7, 18, 0.9);
    position: relative;
    z-index: 10;
  }

  .ucp-footer-text {
    color: var(--ucp-text-muted);
    font-size: 0.9rem;
  }

  @media (max-width: 600px) {
    .ucp-footer {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style>

<div class="ucp-wrapper">

  <header class="ucp-header">
    <a href="#" class="ucp-logo">LUMINA</a>

    <input type="checkbox" id="ucp-mobile-menu" class="ucp-mobile-toggle">
    <label for="ucp-mobile-menu" class="ucp-hamburger">
      <span></span><span></span><span></span>
    </label>

    <nav class="ucp-nav">
      <a href="#gallery"><label for="ucp-mobile-menu">Gallery</label></a>
      <a href="#testimonials"><label for="ucp-mobile-menu">Testimonials</label></a>
      <a href="#contact"><label for="ucp-mobile-menu">Contact</label></a>
    </nav>
  </header>

  <section class="ucp-hero-wrapper">
    <input type="radio" name="ucp-hs" id="ucp-hs-1" class="ucp-hero-radio" checked>
    <input type="radio" name="ucp-hs" id="ucp-hs-2" class="ucp-hero-radio">
    <input type="radio" name="ucp-hs" id="ucp-hs-3" class="ucp-hero-radio">

    <div class="ucp-hero-bg ucp-bg-1">
      <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop" alt="Hero 1">
    </div>
    <div class="ucp-hero-bg ucp-bg-2">
      <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2000&auto=format&fit=crop" alt="Hero 2">
    </div>
    <div class="ucp-hero-bg ucp-bg-3">
      <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" alt="Hero 3">
    </div>

    <div class="ucp-hero-content">
      <div class="ucp-pill">
        <div class="ucp-pill-dot"></div> Cinematic Viewport Active
      </div>
      <h1 class="ucp-title">Design without<br><span class="ucp-text-glow">compromise.</span></h1>
      <p class="ucp-subtitle">
        Experience full-screen cinematic galleries, dark-mode filters, and state-driven interfaces crafted exclusively
        with semantic HTML. Zero dependencies.
      </p>
      <div class="ucp-btn-group">
        <a href="#gallery" class="ucp-btn-primary">Explore Features</a>
      </div>
    </div>

    <div class="ucp-hero-controls">
      <label for="ucp-hs-1" class="ucp-hero-dot"></label>
      <label for="ucp-hs-2" class="ucp-hero-dot"></label>
      <label for="ucp-hs-3" class="ucp-hero-dot"></label>
    </div>
  </section>

  <section id="gallery" class="ucp-section">
    <div class="ucp-section-header">
      <h2 class="ucp-section-title">The Gallery</h2>
      <p class="ucp-section-desc">Horizontal scroll-snapping with 3D z-index hover scaling.</p>
    </div>

    <div class="ucp-netflix-wrapper">
      <div class="ucp-netflix-scroll">
        <div class="ucp-netflix-item">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" alt="Abstract Art">
          <div class="ucp-netflix-overlay">
            <h3 class="ucp-netflix-title">Quantum State</h3>
            <span class="ucp-netflix-tag">Abstract</span>
          </div>
        </div>
        <div class="ucp-netflix-item">
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop" alt="Cyberpunk City">
          <div class="ucp-netflix-overlay">
            <h3 class="ucp-netflix-title">Neon Grid</h3>
            <span class="ucp-netflix-tag">Cyberpunk</span>
          </div>
        </div>
        <div class="ucp-netflix-item">
          <img src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop" alt="3D Render">
          <div class="ucp-netflix-overlay">
            <h3 class="ucp-netflix-title">Void Walker</h3>
            <span class="ucp-netflix-tag">3D Render</span>
          </div>
        </div>
        <div class="ucp-netflix-item">
          <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop" alt="Tech">
          <div class="ucp-netflix-overlay">
            <h3 class="ucp-netflix-title">Silicon Core</h3>
            <span class="ucp-netflix-tag">Hardware</span>
          </div>
        </div>
        <div class="ucp-netflix-item">
          <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" alt="Gradient">
          <div class="ucp-netflix-overlay">
            <h3 class="ucp-netflix-title">Prism Shift</h3>
            <span class="ucp-netflix-tag">Visuals</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="testimonials" class="ucp-section">
    <div class="ucp-section-header">
      <h2 class="ucp-section-title">Community Response</h2>
      <p class="ucp-section-desc">A fully functional slider driven entirely by hidden radio buttons.</p>
    </div>

    <div class="ucp-slider-container">
      <input type="radio" name="ucp-ts" id="ucp-ts-1" class="ucp-slide-radio" checked>
      <input type="radio" name="ucp-ts" id="ucp-ts-2" class="ucp-slide-radio">
      <input type="radio" name="ucp-ts" id="ucp-ts-3" class="ucp-slide-radio">

      <div class="ucp-slider-track">
        <div class="ucp-slide-content">
          <p>"The fact that this entire carousel operates without a single event listener is a testament to modern CSS
            capabilities. It's perfectly smooth and highly accessible."</p>
          <div class="ucp-slide-author">
            <div class="ucp-slide-avatar" style="background: var(--ucp-primary);">SD</div>
            <div>
              <strong>Sarah Developer</strong><br><span style="color:var(--ucp-text-muted); font-size:12px;">Lead UI Engineer</span>
            </div>
          </div>
        </div>
        <div class="ucp-slide-content">
          <p>"Using the radio hack to create stateful arrow navigation provides a premium feel while maintaining strict
            security compliance. It cannot break the host."</p>
          <div class="ucp-slide-author">
            <div class="ucp-slide-avatar" style="background: var(--ucp-accent);">MK</div>
            <div>
              <strong>Marcus Kane</strong><br><span style="color:var(--ucp-text-muted); font-size:12px;">Security Architect</span>
            </div>
          </div>
        </div>
        <div class="ucp-slide-content">
          <p>"I am completely blown away by the Netflix-style hover scaling. Coupling it with native scroll-snapping
            creates an incredibly native app-like experience on the web."</p>
          <div class="ucp-slide-author">
            <div class="ucp-slide-avatar" style="background: var(--ucp-secondary);">EJ</div>
            <div>
              <strong>Elena Joy</strong><br><span style="color:var(--ucp-text-muted); font-size:12px;">Product Designer</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ucp-slider-controls">
        <label for="ucp-ts-3" class="ucp-arrow ucp-arrow-left ucp-arr-left-3">&#8592;</label>
        <label for="ucp-ts-2" class="ucp-arrow ucp-arrow-right ucp-arr-right-2">&#8594;</label>
        <label for="ucp-ts-1" class="ucp-arrow ucp-arrow-left ucp-arr-left-1">&#8592;</label>
        <label for="ucp-ts-3" class="ucp-arrow ucp-arrow-right ucp-arr-right-3">&#8594;</label>
        <label for="ucp-ts-2" class="ucp-arrow ucp-arrow-left ucp-arr-left-2">&#8592;</label>
        <label for="ucp-ts-1" class="ucp-arrow ucp-arrow-right ucp-arr-right-1">&#8594;</label>
      </div>

      <div class="ucp-slider-dots">
        <label for="ucp-ts-1" class="ucp-dot"></label>
        <label for="ucp-ts-2" class="ucp-dot"></label>
        <label for="ucp-ts-3" class="ucp-dot"></label>
      </div>
    </div>
  </section>

  <section id="contact" class="ucp-section">
    <div class="ucp-contact-grid">
      <div class="ucp-contact-info">
        <h3>Get in Touch</h3>
        <p>Ready to deploy a zero-JS architecture? Send us a message and our engineering team will get back to you
          immediately.</p>

        <div class="ucp-info-item">
          <div class="ucp-info-icon">📍</div>
          <span>128 Spatial Boulevard, Server City, TX</span>
        </div>
        <div class="ucp-info-item">
          <div class="ucp-info-icon">✉️</div>
          <span>hello@lumina-architecture.dev</span>
        </div>
        <div class="ucp-info-item">
          <div class="ucp-info-icon">📞</div>
          <span>+1 (555) 019-2834</span>
        </div>
      </div>

      <!-- 🚀 THE SDK-POWERED FORM -->
      <form id="ucp-demo-form" class="ucp-contact-form" action="#" method="POST">
        <div class="ucp-form-group">
          <label class="ucp-label">Full Name</label>
          <input type="text" class="ucp-input" placeholder="John Doe" required>
        </div>
        <div class="ucp-form-group">
          <label class="ucp-label">Email Address</label>
          <input type="email" class="ucp-input" placeholder="john@example.com" required>
        </div>
        <div class="ucp-form-group">
          <label class="ucp-label">Select License</label>
          <select id="ucp-product-select" class="ucp-input" style="height: 56px; appearance: none; -moz-appearance: none; -webkit-appearance: none;" required>
            <option value="" disabled selected>Choose a license...</option>
            <option value="lic_single">Single Site License ($49)</option>
            <option value="lic_multi">Multi-Site License ($149)</option>
            <option value="lic_unlimited">Unlimited Agency ($499)</option>
          </select>
        </div>
        <button type="submit" class="ucp-btn-submit">Purchase License</button>
      </form>
    </div>

    <div class="ucp-map-container">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.2528000654!2d-74.1444874441584!3d40.69763123330685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1715000000000!5m2!1sen!2s"
        allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </section>

  <footer class="ucp-footer">
    <div style="font-weight: 800; letter-spacing: -0.05em; font-size: 1.2rem;">LUMINA
      <span style="color: var(--ucp-primary);">6.0</span>
    </div>
    <p class="ucp-footer-text">© 2026 Spatial Architecture. Engineered entirely in pure HTML & CSS.</p>
  </footer>

</div>

<script>
  // Wait for the DOM to load before attaching events
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ucp-demo-form');
    const select = document.getElementById('ucp-product-select');
    const submitBtn = document.querySelector('.ucp-btn-submit');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Prevent submission if they haven't selected a license
      if (!select.value) {
        alert('Please select a license before purchasing.');
        return;
      }

      // Check if the Sandboxed SDK is active
      if (window.UCP) {
        // Create a small loading state
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Processing...";
        submitBtn.style.opacity = "0.7";
        submitBtn.disabled = true;
        
        // Trigger the native cart drawer using the UCP SDK!
        window.UCP.addToCart(select.value, 1);
        
        // Reset the button after a second
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.style.opacity = "1";
          submitBtn.disabled = false;
        }, 1000);
        
      } else {
        alert("⚠️ SDK Not Found: Please open the Block Settings and toggle 'Sandboxed JavaScript' to ON to enable the window.UCP object.");
      }
    });
  });
</script>`
  },
  {
    id: "minimalist-resume",
    name: "Minimalist Resume",
    description: "A clean, professional, and responsive resume template using pure HTML and CSS. Perfect for the Simple HTML mode.",
    allowJavascript: false,
    useTailwind: false,
    code: `<style>
  /* Scoped CSS using the .cr- (Clean Resume) prefix */
  .cr-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    line-height: 1.6;
    background-color: #ffffff;
    border-radius: 12px;
  }
  .cr-header { 
    text-align: center; 
    border-bottom: 2px solid #f0f0f0; 
    padding-bottom: 24px; 
    margin-bottom: 32px; 
  }
  .cr-name { 
    font-size: 2.8em; 
    margin: 0; 
    color: #111; 
    font-weight: 800; 
    letter-spacing: -1px; 
  }
  .cr-title { 
    font-size: 1.1em; 
    color: #666; 
    margin: 8px 0 20px 0; 
    text-transform: uppercase; 
    letter-spacing: 2px; 
  }
  .cr-contact { 
    list-style: none; 
    padding: 0; 
    margin: 0; 
    display: flex; 
    justify-content: center; 
    gap: 12px; 
    font-size: 0.9em; 
    flex-wrap: wrap; 
  }
  .cr-contact li { 
    background: #f8f9fa; 
    padding: 6px 14px; 
    border-radius: 20px; 
    color: #444; 
    font-weight: 500;
  }
  .cr-section { margin-bottom: 32px; }
  .cr-section-title { 
    font-size: 1.4em; 
    color: #111; 
    border-bottom: 1px solid #f0f0f0; 
    padding-bottom: 8px; 
    margin-bottom: 20px; 
    font-weight: 700;
  }
  .cr-item { margin-bottom: 24px; }
  .cr-item-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: baseline; 
    margin-bottom: 6px; 
    flex-wrap: wrap; 
  }
  .cr-item-title { font-weight: 700; font-size: 1.15em; margin: 0; color: #222; }
  .cr-item-meta { color: #777; font-size: 0.9em; font-weight: 500; }
  .cr-item-desc { margin: 0; color: #555; }
  .cr-skills { display: flex; gap: 10px; flex-wrap: wrap; }
  .cr-skill-tag { 
    background: #111; 
    color: #fff; 
    padding: 6px 14px; 
    border-radius: 6px; 
    font-size: 0.85em; 
    font-weight: 600; 
  }
</style>

<div class="cr-wrapper">
  <header class="cr-header">
    <h1 class="cr-name">Hamza Kadiri-Elmaana</h1>
    <p class="cr-title">Entrepreneur • Digital Marketer • CTO</p>
    <ul class="cr-contact">
      <li>📍 Marrakesh, Morocco</li>
      <li>✉️ Hamzakadirielmaana@gmail.com</li>
      <li>📞 +212 695 121 176</li>
    </ul>
  </header>

  <section class="cr-section">
    <h2 class="cr-section-title">Experience</h2>
    <div class="cr-item">
      <div class="cr-item-header">
        <h3 class="cr-item-title">Co-Founder, CEO & CTO @ UCPMAROC</h3>
        <span class="cr-item-meta">Jul 2021 - Present</span>
      </div>
      <p class="cr-item-desc">Co-founded and lead the development of UCPMAROC, a prominent Talents Marketplace and Portfolio Builder platform. Overseeing executive business strategy alongside technological infrastructure.</p>
    </div>
    <div class="cr-item">
      <div class="cr-item-header">
        <h3 class="cr-item-title">Digital Marketing Manager @ medinal</h3>
        <span class="cr-item-meta">Jan 2025 - Nov 2025</span>
      </div>
      <p class="cr-item-desc">Led overall marketing initiatives and developed comprehensive strategies to penetrate the market. Utilized advanced marketing tactics to drive sustained brand growth.</p>
    </div>
  </section>

  <section class="cr-section">
    <h2 class="cr-section-title">Education</h2>
    <div class="cr-item">
      <div class="cr-item-header">
        <h3 class="cr-item-title">Bachelor's Degree, English Studies</h3>
        <span class="cr-item-meta">Université Cadi Ayyad</span>
      </div>
    </div>
  </section>

  <section class="cr-section">
    <h2 class="cr-section-title">Core Competencies</h2>
    <div class="cr-skills">
      <span class="cr-skill-tag">Business Development</span>
      <span class="cr-skill-tag">Media Buying</span>
      <span class="cr-skill-tag">React / TypeScript</span>
      <span class="cr-skill-tag">Management</span>
      <span class="cr-skill-tag">Copywriting</span>
    </div>
  </section>
</div>`
  }
];
