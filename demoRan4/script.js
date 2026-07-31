// Global Platform tracking
let selectedPlatform = 'tiktok';
let scheduledIdeaId = null;

// Platform Selector Function
function selectPlatform(element) {
  document.querySelectorAll('.platform-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  selectedPlatform = element.getAttribute('data-platform');
}

// Show Toast message
function showToast(title, desc) {
  const toast = document.getElementById('toast');
  const titleEl = document.getElementById('toast-title');
  const descEl = document.getElementById('toast-desc');
  
  titleEl.textContent = title;
  descEl.textContent = desc;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Handle contact form mock submission
function handleContactSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('contact-name').value;
  showToast('Inquiry Received', `Thank you, ${name}! Our team will get back to you shortly.`);
  event.target.reset();
}

// Generate Mock Video Idea data based on platform and tone
function generateMockData(topic, platform, tone) {
  const platformLabel = platform === 'tiktok' ? 'TikTok' : platform === 'reels' ? 'Instagram Reels' : 'YouTube Shorts';
  
  // Custom templates based on Tone
  if (tone === 'hype') {
    return [
      {
        id: 1,
        title: `The Ultimate ${topic} Secret Nobody Tells You`,
        viralProbability: 96,
        description: `An intense, high-energy layout detailing a hidden trick or method in ${topic}. Starts with an immediate visual disruption.`,
        hooks: [
          `Stop scrolling if you care about ${topic}...`,
          `This 1 simple hack changed how I view ${topic} forever...`,
          `I bet 99% of people get this wrong about ${topic}...`
        ],
        script: `[0:00 - 0:03] (Hook - Zoom into camera, pointing down) "If you are still doing this in ${topic}, you need to stop immediately."\n\n[0:03 - 0:10] (Problem - Pointing out the mistake on a screen overlay) "Most creators think they need complex setups, but that's actually costing you views."\n\n[0:10 - 0:22] (Solution - Rapid walkthrough showing step-by-step) "Here is the exact framework I used to fix it, and it takes less than 30 seconds."\n\n[0:22 - 0:30] (CTA - Pointing to the follow button with dynamic text overlay) "Hit follow if you want to master ${topic} this month."`,
        tags: [`#${topic.replace(/\s+/g, '')}`, '#viralhack', `#${platform}tips`, '#growthhacks']
      },
      {
        id: 2,
        title: `Watch Me Double My Results in ${topic} in 24 Hours`,
        viralProbability: 92,
        description: `A fast-paced challenge video proving a concept in ${topic} using extreme hyperlapse and progress metrics.`,
        hooks: [
          `I spent 24 hours testing the weirdest ${topic} theory...`,
          `This is what happens when you combine ${topic} with trend algorithms...`
        ],
        script: `[0:00 - 0:03] (Hook - Fast slide transition, showing a high chart metric) "I tested the most controversial theory in ${topic} so you don't have to."\n\n[0:03 - 0:12] (Build up - Short timer overlay, split screen showing effort) "Here is what I started with, and here is what happened when I applied the secret formula."\n\n[0:12 - 0:25] (Reveal - Emotional reaction, showing massive success screen) "The results were actually insane. It worked 3x better than standard methods."\n\n[0:25 - 0:30] (CTA) "Save this video for your next session."`,
        tags: [`#${topic.replace(/\s+/g, '')}challenge`, '#experiment', '#trends', '#productivity']
      }
    ];
  } else if (tone === 'educational') {
    return [
      {
        id: 1,
        title: `3 Free Tools to Dominate ${topic}`,
        viralProbability: 94,
        description: `A neat, value-first listicle compiling unknown free resources or techniques that simplify ${topic} for beginners.`,
        hooks: [
          `These 3 free tools feel illegal to know if you do ${topic}...`,
          `Stop paying for tools. Use these instead for ${topic}...`
        ],
        script: `[0:00 - 0:03] (Hook - Green screen overlay showing list items) "If you are into ${topic}, these 3 completely free tools are going to save you hundreds of hours."\n\n[0:03 - 0:10] (Tool 1 - Screen recording of tool interface) "Tool number one is crucial for automating your workflow."\n\n[0:10 - 0:18] (Tool 2 - Zoom-in on premium dashboard) "Tool number two analyzes your performance instantly."\n\n[0:18 - 0:25] (Tool 3 - Showing a simple web link) "And the third one does the hardest part of the job for you."\n\n[0:25 - 0:30] (CTA) "Which tool is your favorite? Let me know in the comments."`,
        tags: [`#${topic.replace(/\s+/g, '')}tools`, '#education', '#learnontiktok', '#freeapps']
      },
      {
        id: 2,
        title: `The 2026 Roadmap to Master ${topic}`,
        viralProbability: 91,
        description: `A step-by-step masterclass outline covering essential milestones for learning ${topic} from scratch.`,
        hooks: [
          `How to learn ${topic} in 2026 (the zero-fluff guide)...`,
          `I learned ${topic} in 30 days. Here is my exact schedule...`
        ],
        script: `[0:00 - 0:04] (Hook - Holding up a written roadmap paper) "If I had to relearn ${topic} from absolute scratch in 2026, here is the exact roadmap I would follow."\n\n[0:04 - 0:12] (Step 1 - Emphasizing base foundations) "Month one, focus entirely on understanding the core parameters. Ignore the advanced stuff."\n\n[0:12 - 0:22] (Step 2 - Showing practice templates) "Month two, build 3 mini-projects to lock in the muscle memory."\n\n[0:22 - 0:30] (CTA) "All links are pinned. Save this so you don't lose the roadmap."`,
        tags: [`#${topic.replace(/\s+/g, '')}101`, '#roadmap', '#careerpath', '#growth']
      }
    ];
  } else if (tone === 'funny') {
    return [
      {
        id: 1,
        title: `Expectation vs. Reality of ${topic}`,
        viralProbability: 95,
        description: `A hilarious meme/skit comparison showing the glamorous expectation of doing ${topic} versus the messy reality.`,
        hooks: [
          `Nobody talks about how painful ${topic} actually is...`,
          `What they think ${topic} looks like vs what it actually is...`
        ],
        script: `[0:00 - 0:04] (Hook - Confident pose, upbeat music playing) "Expectation: Doing ${topic} is super calm and satisfying."\n\n[0:04 - 0:15] (Reality - Music cuts, chaotic montage of mistakes, zoomed-in frustration face) "Reality: Spending 4 hours fixing a basic issue while crying silently."\n\n[0:15 - 0:25] (Relatable resolution - Drinking coffee, staring blankly) "But we still do it anyway because we are addicted."\n\n[0:25 - 0:30] (CTA) "Share this with a fellow creator who knows this pain."`,
        tags: [`#${topic.replace(/\s+/g, '')}memes`, '#relatable', '#creatorhumor', '#funnyvideos']
      }
    ];
  } else { // dramatic
    return [
      {
        id: 1,
        title: `The Dark Side of ${topic}`,
        viralProbability: 93,
        description: `A documentary-style storytelling video showing a shocking truth or industry secret about ${topic}. Slow cinematic pacing.`,
        hooks: [
          `There is a dark truth about ${topic} that gurus won't share...`,
          `The industry is hiding this fact about ${topic}...`
        ],
        script: `[0:00 - 0:05] (Hook - Dark studio lighting, serious eye contact) "We need to talk about what is really happening in the ${topic} space right now."\n\n[0:05 - 0:15] (The Reveal - Cinematic overlay, text fades) "Behind the success stories is a system that most people are completely blind to."\n\n[0:15 - 0:25] (The Lesson - Slow speech, high background drone) "If you want to survive the next shift, you need to understand this single rule."\n\n[0:25 - 0:30] (CTA) "I'm posting the full breakdown tomorrow. Follow to stay updated."`,
        tags: [`#${topic.replace(/\s+/g, '')}exposed`, '#industrysecrets', '#behindthescenes', '#documentary']
      }
    ];
  }
}

// Generate Viral Ideas Routine
function generateViralIdeas() {
  const nicheInput = document.getElementById('niche-input');
  const topic = nicheInput.value.trim() || 'Social Media Growth';
  
  const generateBtn = document.getElementById('generate-btn');
  const welcomeBoard = document.getElementById('welcome-board');
  const loadingBoard = document.getElementById('loading-board');
  const resultsContainer = document.getElementById('results-container');
  const schedulerPanel = document.getElementById('scheduler-panel');
  
  // Hide previous results & panels
  resultsContainer.innerHTML = '';
  welcomeBoard.style.display = 'none';
  schedulerPanel.classList.remove('show');
  
  // Show Loading
  loadingBoard.classList.add('show');
  generateBtn.disabled = true;
  
  // Loading simulated steps
  const steps = [
    "Scraping current viral graphs...",
    "Analyzing trending hashtags & audio tracks...",
    "Optimizing attention retention patterns...",
    "Drafting predictive hook options...",
    "Generating structural scripts..."
  ];
  
  let currentStepIndex = 0;
  const stepInterval = setInterval(() => {
    if (currentStepIndex < steps.length) {
      document.getElementById('loading-step').textContent = steps[currentStepIndex];
      currentStepIndex++;
    }
  }, 450);

  setTimeout(() => {
    clearInterval(stepInterval);
    loadingBoard.classList.remove('show');
    generateBtn.disabled = false;
    
    const tone = document.getElementById('tone-select').value;
    const ideas = generateMockData(topic, selectedPlatform, tone);
    
    ideas.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'glass-card idea-card';
      
      const hooksList = idea.hooks.map(hook => `<li>"${hook}"</li>`).join('');
      
      card.innerHTML = `
        <div class="idea-card-header">
          <div>
            <div class="idea-badge-group">
              <span class="badge-info">${selectedPlatform.toUpperCase()}</span>
              <span class="badge-info" style="background:rgba(236,72,153,0.1); border-color:rgba(236,72,153,0.2); color:#f472b6;">${tone.toUpperCase()}</span>
            </div>
            <h3 style="margin-top:0.75rem;">${idea.title}</h3>
          </div>
          <div class="viral-meter ${idea.viralProbability >= 95 ? 'hot' : ''}">
            <div class="viral-meter-bar">
              <div class="viral-meter-fill" style="width: ${idea.viralProbability}%;"></div>
            </div>
            <span>${idea.viralProbability}% Viral Score</span>
          </div>
        </div>
        
        <p class="description">${idea.description}</p>
        <div class="section-divider"></div>
        
        <div class="idea-content-grid">
          <div class="hook-box">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
              </svg>
              High Retention Hooks
            </h4>
            <ul>${hooksList}</ul>
          </div>
          <div class="script-box">
            <h4>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Script Storyboard
            </h4>
            <p>${idea.script}</p>
          </div>
        </div>
        
        <div class="idea-card-footer">
          <div class="tags-group">
            ${idea.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="card-actions">
            <button class="btn-card" onclick="copyToClipboard('${idea.hooks[0]}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Hook
            </button>
            <button class="btn-card highlight" onclick="scheduleIdea(${idea.id}, '${idea.title}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Schedule
            </button>
          </div>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }, 2200);
}

// Copy helper
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to Clipboard', 'Primary video hook copied successfully.');
  }).catch(() => {
    showToast('Copy Failed', 'Please highlight and copy manually.');
  });
}

// Schedule handler
function scheduleIdea(id, title) {
  scheduledIdeaId = id;
  toggleScheduler(true);
  showToast('Ready to Queue', `Configuring schedule parameters for "${title}"`);
}

function toggleScheduler(show) {
  const panel = document.getElementById('scheduler-panel');
  if (show) {
    panel.classList.add('show');
    // Scroll to panel
    panel.scrollIntoView({ behavior: 'smooth' });
  } else {
    panel.classList.remove('show');
  }
}

function confirmScheduling() {
  const dateVal = document.getElementById('sched-date').value;
  const timeVal = document.getElementById('sched-time').value;
  
  toggleScheduler(false);
  showToast('Idea Scheduled!', `Successfully queued post for ${dateVal} at ${timeVal}.`);
}
