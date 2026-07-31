document.addEventListener('DOMContentLoaded', () => {
    // Highlight Active Link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a, .footer-links a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });

    // Toast Notification System
    const showNotification = (message, title = 'Notification') => {
        let notif = document.getElementById('toast-notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'toast-notification';
            notif.className = 'notification';
            document.body.appendChild(notif);
        }
        notif.innerHTML = `
            <div style="font-size: 1.25rem;">✨</div>
            <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${title}</div>
                <div style="font-size: 0.8rem; color: #a1a1aa;">${message}</div>
            </div>
        `;
        notif.classList.add('active');
        setTimeout(() => {
            notif.classList.remove('active');
        }, 4000);
    };

    // Contact Form Logic
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Sending Message...';
            btn.disabled = true;

            setTimeout(() => {
                showNotification('Your message has been received. Our team will contact you shortly.', 'Message Sent!');
                contactForm.reset();
                btn.textContent = originalText;
                btn.disabled = false;
            }, 1200);
        });
    }

    // Demo Page Generator Logic
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
        const keywordInput = document.getElementById('niche-keyword');
        const platformSelect = document.getElementById('platform-select');
        const toneSelect = document.getElementById('tone-select');
        
        const placeholderView = document.getElementById('placeholder-view');
        const loadingView = document.getElementById('loading-view');
        const resultsList = document.getElementById('results-list');
        const loadingText = document.getElementById('loading-steps');

        const stepMessages = [
            '🔍 Scanning current social media trend graphs...',
            '📊 Analyzing video viral patterns for similar keywords...',
            '💡 Hook optimization engine processing ideas...',
            '✨ Drafting scripts & high-retention outlines...'
        ];

        generateBtn.addEventListener('click', () => {
            const niche = keywordInput.value.trim() || 'Tech trends';
            const platform = platformSelect.value;
            const tone = toneSelect.value;

            // UI Transitions
            placeholderView.style.display = 'none';
            resultsList.style.display = 'none';
            loadingView.style.display = 'block';

            // Simulate AI steps
            let currentStep = 0;
            loadingText.textContent = stepMessages[0];
            const interval = setInterval(() => {
                currentStep++;
                if (currentStep < stepMessages.length) {
                    loadingText.textContent = stepMessages[currentStep];
                } else {
                    clearInterval(interval);
                    renderMockupResults(niche, platform, tone);
                }
            }, 800);
        });

        function renderMockupResults(niche, platform, tone) {
            loadingView.style.display = 'none';
            resultsList.style.display = 'flex';
            resultsList.innerHTML = ''; // Clear previous results

            // Dummy database of templates to fill depending on niche & platform
            const ideas = [
                {
                    title: `The 3 Biggest Lies about ${niche} Everyone Believes`,
                    badge: 'Trending Hook',
                    score: '96%',
                    hook: `"If you're still doing this in 2026, stop immediately. Here are the three massive lies they told you about ${niche}..."`,
                    outline: `<strong>0:00 - 0:03</strong> Fast-cut intro with text overlay on hook.<br>
                              <strong>0:03 - 0:15</strong> Reveal Lie #1 with rapid visual evidence.<br>
                              <strong>0:15 - 0:30</strong> Debunk Lie #2 & Lie #3 with dynamic zooms and sound effects.<br>
                              <strong>0:30 - 0:45</strong> Value-packed takeaway and CTA asking viewers for their opinion.`
                },
                {
                    title: `The Lazy Way to Master ${niche} (Fast)`,
                    badge: 'High Retention',
                    score: '93%',
                    hook: `"Here's the exact blueprint I used to automate my entire ${niche} process. It literally takes 5 minutes..."`,
                    outline: `<strong>0:00 - 0:03</strong> Over-the-shoulder video demonstration showing high-speed results.<br>
                              <strong>0:03 - 0:12</strong> Introduce the 1-click shortcut tool/method.<br>
                              <strong>0:12 - 0:25</strong> Walk through step-by-step simple instructions with arrows.<br>
                              <strong>0:25 - 0:40</strong> CTA directing viewers to save the video for later.`
                },
                {
                    title: `Why 99% of people fail at ${niche} (And how to fix it)`,
                    badge: 'Curiosity Gap',
                    score: '91%',
                    hook: `"Almost everybody starts ${niche} the wrong way. Avoid this fatal mistake before it destroys your growth..."`,
                    outline: `<strong>0:00 - 0:03</strong> Bold head-shaking intro and immediate warning.<br>
                              <strong>0:03 - 0:15</strong> Point out the common mistake clearly with relatable analogies.<br>
                              <strong>0:15 - 0:28</strong> Give the actionable 1-step corrective action.<br>
                              <strong>0:28 - 0:40</strong> CTA asking users to comment if they've made this mistake.`
                }
            ];

            ideas.forEach((idea, idx) => {
                const card = document.createElement('div');
                card.className = 'idea-card';
                card.innerHTML = `
                    <div class="idea-header">
                        <span class="idea-badge">${idea.badge}</span>
                        <span class="score-badge">🔥 Virality: ${idea.score}</span>
                    </div>
                    <div class="idea-body">
                        <h4>${idea.title}</h4>
                        <div class="idea-hook">${idea.hook}</div>
                        <p class="idea-outline">${idea.outline}</p>
                    </div>
                    <div class="idea-footer">
                        <button class="btn-secondary btn-small btn-refine" data-index="${idx}">✏️ Refine Script</button>
                        <button class="btn-cta btn-small btn-schedule" data-title="${idea.title}">📅 Schedule Post</button>
                    </div>
                `;
                resultsList.appendChild(card);
            });

            // Re-bind click event on newly added buttons
            bindCardButtons();
        }
    }

    // Modal Control Logic
    const modal = document.getElementById('schedule-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalConfirm = document.getElementById('modal-confirm');
    const scheduleForm = document.getElementById('schedule-form');

    function bindCardButtons() {
        document.querySelectorAll('.btn-schedule').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const title = e.currentTarget.getAttribute('data-title');
                const modalTitle = document.getElementById('modal-post-title');
                if (modalTitle) modalTitle.textContent = title;
                openModal();
            });
        });

        document.querySelectorAll('.btn-refine').forEach(btn => {
            btn.addEventListener('click', () => {
                showNotification('AIScript editor is opening. Custom AI adjustments ready.', 'Refinement Tool');
            });
        });
    }

    function openModal() {
        if (modal) modal.classList.add('active');
    }

    function closeModal() {
        if (modal) modal.classList.remove('active');
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('post-date').value;
            const time = document.getElementById('post-time').value;
            closeModal();
            showNotification(`Video idea scheduled for auto-posting on ${date} at ${time}.`, 'Post Scheduled!');
        });
    }
});
