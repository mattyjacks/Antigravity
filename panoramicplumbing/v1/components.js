// Components and Interactions for V1 Site

const DISCLAIMER_TEXT = "THIS IS A DEMO WEBSITE PREPARED BY MATTYJACKS.COM AND IS NOT AUTHORIZED BY PANORAMIC PLUMBING. This is a sales pitch site.";

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const activePage = this.getAttribute('active') || 'home';
    
    this.innerHTML = `
      <div class="disclaimer-banner">
        🚨 ${DISCLAIMER_TEXT} 🚨
      </div>
      <header class="site-header" id="mainHeader">
        <a href="index.html" class="logo">
          <i class="fas fa-tint"></i> Panoramic
        </a>
        <nav>
          <ul class="nav-links" id="navLinks">
            <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
            <li><a href="services.html" class="${activePage === 'services' ? 'active' : ''}">Services</a></li>
            <li><a href="contact.html" class="${activePage === 'contact' ? 'active' : ''}">Contact</a></li>
          </ul>
        </nav>
        <div class="menu-toggle" id="menuToggle">
          <i class="fas fa-bars"></i>
        </div>
      </header>
    `;

    // Mobile Menu Toggle
    const menuToggle = this.querySelector('#menuToggle');
    const navLinks = this.querySelector('#navLinks');
    
    if(menuToggle) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if(navLinks.classList.contains('active')) {
          icon.classList.replace('fa-bars', 'fa-times');
        } else {
          icon.classList.replace('fa-times', 'fa-bars');
        }
      });
    }

    // Scroll Effect for Header
    window.addEventListener('scroll', () => {
      const header = this.querySelector('#mainHeader');
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="site-footer">
        <div class="footer-grid">
          <div class="footer-col animate-on-scroll fade-in-up">
            <h3>Panoramic Plumbing</h3>
            <p>Third generation plumbing company serving Manchester, NH and surrounding areas. From leaks to full rehab construction, we're your trusted solution providers.</p>
          </div>
          <div class="footer-col animate-on-scroll fade-in-up delay-100">
            <h3>Quick Links</h3>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="services.html">Our Services</a></li>
              <li><a href="contact.html">Contact Us</a></li>
            </ul>
          </div>
          <div class="footer-col animate-on-scroll fade-in-up delay-200">
            <h3>Contact Info</h3>
            <ul class="footer-contact footer-links">
              <li><i class="fas fa-map-marker-alt"></i> 673 Bell Street #22, Manchester, NH 03103</li>
              <li><i class="fas fa-phone-alt"></i> <a href="tel:6036009969">(603) 600-9969</a></li>
              <li><i class="fas fa-envelope"></i> <a href="mailto:panoramicplumbingnh@gmail.com">Email Us</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom animate-on-scroll fade-in-up delay-300">
          <p>&copy; ${new Date().getFullYear()} Panoramic Plumbing Demo (V1).</p>
          <p class="footer-disclaimer">** ${DISCLAIMER_TEXT} **</p>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);

// Intersection Observer for Scroll Animations
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  // Re-query in case components injected content late
  setTimeout(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
  }, 100);
});
