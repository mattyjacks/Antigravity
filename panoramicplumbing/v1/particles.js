// particles.js

const initParticles = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';

    const hero = document.querySelector('.hero');
    if (hero) {
        hero.appendChild(canvas);
        hero.style.position = 'relative'; // Ensure relative sizing
    } else {
        return; // Only run on pages with hero section
    }

    const ctx = canvas.getContext('2d');
    let width = canvas.width = hero.offsetWidth;
    let height = canvas.height = hero.offsetHeight;
    const particles = [];

    window.addEventListener('resize', () => {
        width = canvas.width = hero.offsetWidth;
        height = canvas.height = hero.offsetHeight;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = `rgba(247, 127, 0, ${Math.random() * 0.5 + 0.1})`;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > width) this.x = 0;
            if (this.x < 0) this.x = width;
            if (this.y > height) this.y = 0;
            if (this.y < 0) this.y = height;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const createParticles = () => {
        for (let i = 0; i < 60; i++) {
            particles.push(new Particle());
        }
    }

    const animateParticles = () => {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Draw lines between close particles
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(247, 127, 0, ${0.1 - distance / 1000})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }

    createParticles();
    animateParticles();
};

document.addEventListener('DOMContentLoaded', initParticles);
