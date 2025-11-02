// Supabase initialization
const SUPABASE_URL = 'https://aofvzgqksbhgljzowyby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnZ6Z3Frc2JoZ2xqem93eWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzAxMTEsImV4cCI6MjA3MDAwNjExMX0.XA4xgMqrMy9finlY9xvOhPdrQIsKYlRGmrNx_1D6db4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authContainer = document.getElementById('authContainer');
const loginPage = document.getElementById('loginPage');
const signupPage = document.getElementById('signupPage');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignUp = document.getElementById('showSignUp');
const showLogin = document.getElementById('showLogin');
const appContent = document.getElementById('appContent');
const logoutBtn = document.getElementById('logoutBtn');

// Tabs and Sections
const jobTab = document.getElementById('jobTab');
const followUpTab = document.getElementById('followUpTab');
const analyticsTab = document.getElementById('analyticsTab');
const jobSection = document.getElementById('jobSection');
const followUpSection = document.getElementById('followUpSection');
const analyticsSection = document.getElementById('analyticsSection');

// Profile elements
const userInitials = document.getElementById('userInitials');
const userEmail = document.getElementById('userEmail');

// Stats elements
const totalApplications = document.getElementById('totalApplications');
const interviewCount = document.getElementById('interviewCount');
const offerCount = document.getElementById('offerCount');

// Analytics elements
const avgExpectation = document.getElementById('avgExpectation');
const successRate = document.getElementById('successRate');

// Storage keys
const OFFLINE_QUEUE_KEY = 'offline_job_queue';
const LOCAL_JOBS_KEY = 'local_jobs';
const SESSION_KEY = 'supabase_session';

// Global variables
let currentJobs = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  setupAuthEventListeners();
  setupJobEventListeners();
  setupTabNavigation();
  setupFileUpload();
  setupSlider();
  setupFilter();
  await checkAuthState();
}

function setupTabNavigation() {
  // Set initial active section
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  jobSection.classList.add('active');

  jobTab.addEventListener('click', () => {
    switchTab('jobTab');
  });

  followUpTab.addEventListener('click', () => {
    switchTab('followUpTab');
  });

  analyticsTab.addEventListener('click', () => {
    switchTab('analyticsTab');
  });
}

function switchTab(activeTabId) {
  // Update tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  document.getElementById(activeTabId).classList.add('active-tab');

  // Update sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  switch(activeTabId) {
    case 'jobTab':
      jobSection.classList.add('active');
      break;
    case 'followUpTab':
      followUpSection.classList.add('active');
      break;
    case 'analyticsTab':
      analyticsSection.classList.add('active');
      renderAnalytics();
      break;
  }
}

function setupSlider() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  
  const slider = document.getElementById('expectationSlider');
  const valueDisplay = document.getElementById('expectationValue');

  slider.addEventListener('input', () => {
    valueDisplay.textContent = slider.value;
  });
}

function setupFilter() {
  const filterSelect = document.getElementById('filterSelect');
  const statusFilter = document.getElementById('statusFilter'); // Add this to your HTML
  
  filterSelect.addEventListener('change', () => {
    renderApplicationsList();
  });
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      renderApplicationsList();
    });
  }
}

function setupFileUpload() {
  const dropArea = document.getElementById('fileDropArea');
  const fileInput = document.getElementById('resumeUpload');
  const fileNameDisplay = document.getElementById('fileNameDisplay');

  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');

    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      showFileName(fileInput.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showFileName(fileInput.files[0]);
    }
  });
}

function showFileName(file) {
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  fileNameDisplay.textContent = `${file.name}`;
  fileNameDisplay.style.display = 'block';
}

function clearFile() {
  const fileInput = document.getElementById('resumeUpload');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  fileInput.value = "";
  fileNameDisplay.textContent = "";
  fileNameDisplay.style.display = 'none';
}

function updateProfileSection(email) {
  if (email) {
    userEmail.textContent = email;
    userInitials.textContent = getInitials(email);
    userInitials.title = email;
  } else {
    userEmail.textContent = 'Not signed in';
    userInitials.textContent = '?';
    userInitials.title = '';
  }
}

function getInitials(email) {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[. _-]/);
  return parts.map(part => part.charAt(0)).join('').toUpperCase().substring(0, 2);
}

// ================= AUTHENTICATION FUNCTIONS =================
async function checkAuthState() {
  const session = await getSession();
  if (session) {
    showAppContent();
    updateProfileSection(session.user.email);
    await renderAll();
  } else {
    showAuthPage('login');
    updateProfileSection(null);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      storeSession(session);
      showAppContent();
      updateProfileSection(session.user.email);
      renderAll();
    } else if (event === 'SIGNED_OUT') {
      clearSession();
      updateProfileSection(null);
      showAuthPage('login');
    }
  });
}

function setupAuthEventListeners() {
  showSignUp.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthPage('signup');
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthPage('login');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      storeSession(data.session);
      showAppContent();
      updateProfileSection(data.user.email);
      await renderAll();
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Validate password match
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate terms agreement
    if (!agreeTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert('Signup failed: ' + error.message);
    } else {
      storeSession(data.session);
      showAppContent();
      updateProfileSection(data.user.email);
      await renderAll();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    clearSession();
    showAuthPage('login');
  });

  document.getElementById('openAppBtn').addEventListener('click', () => {
    window.open('https://job-dash-ashy.vercel.app/', '_blank');
  });

  // Setup password toggles
  setupPasswordToggles();
}

function setupPasswordToggles() {
  const togglePassword = (toggleId, inputId) => {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    
    if (toggle && input) {
      toggle.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Update icon
        const icon = toggle.querySelector('svg');
        if (type === 'text') {
          icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
          icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
      });
    }
  };

  togglePassword('loginPasswordToggle', 'loginPassword');
  togglePassword('signupPasswordToggle', 'signupPassword');
  togglePassword('confirmPasswordToggle', 'confirmPassword');
}

function showAuthPage(page) {
  loginPage.style.display = page === 'login' ? 'flex' : 'none';
  signupPage.style.display = page === 'signup' ? 'flex' : 'none';
  authContainer.style.display = 'flex';
  appContent.style.display = 'none';
}

function showAppContent() {
  authContainer.style.display = 'none';
  appContent.style.display = 'flex';
}

async function getSession() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

function storeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LOCAL_JOBS_KEY);
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ================= JOB TRACKING FUNCTIONS =================
function setupJobEventListeners() {
  document.getElementById('jobForm').addEventListener('submit', handleJobFormSubmit);
}

async function handleJobFormSubmit(e) {
  e.preventDefault();
  
  const session = await getSession();
  if (!session) {
    showAuthPage('login');
    return;
  }

  const formData = {
    company: document.getElementById('company').value,
    role: document.getElementById('role').value,
    date_applied: document.getElementById('date').value || new Date().toISOString().split('T')[0],
    feedback: document.getElementById('feedback')?.checked || false,
    interviewed: document.getElementById('interviewed').checked,
    offered: document.getElementById('offer').checked,
    got_job: document.getElementById('gotJob').checked,
    mood: document.getElementById('mood').value,
    application_expectation: parseInt(document.getElementById('expectationSlider').value),
    resume_filename: '',
    resume_data: '',
    user_id: session.user.id
  };

  // Handle resume upload
  const resumeFile = document.getElementById('resumeUpload').files[0];
  if (resumeFile) {
    try {
      const resumeData = await extractTextFromPDF(resumeFile);
      formData.resume_filename = resumeData.filename;
      formData.resume_data = resumeData.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      alert('Error processing resume PDF. Please try again.');
      return;
    }
  }

  if (isOnline()) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert([formData]);

      if (error) throw error;
      alert('Job application added successfully!');
    } catch (error) {
      await handleOfflineSubmission(formData);
    }
  } else {
    await handleOfflineSubmission(formData);
  }

  e.target.reset();
  clearFile();
  // Reset slider to default
  document.getElementById('expectationSlider').value = 3;
  document.getElementById('expectationValue').textContent = '3';
  
  await renderAll();
}

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdfjs/pdf.worker.min.js');
        
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        
        resolve({
          filename: file.name,
          text: text
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

async function handleOfflineSubmission(formData) {
  await saveToLocal(formData);
  await addToOfflineQueue('create', formData);
  alert('You are offline. Job application saved locally and will sync when you reconnect.');
}

async function fetchJobs() {
  const session = await getSession();
  if (!session) {
    console.log('No session found, returning empty jobs array');
    return [];
  }

  let remoteJobs = [];
  const localJobs = await getLocalJobs();

  console.log('Fetching jobs for user:', session.user.id);
  console.log('Local jobs count:', localJobs.length);

  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date_applied', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      remoteJobs = data || [];
      console.log('Remote jobs fetched:', remoteJobs.length);
      
    } catch (error) {
      console.error('Error fetching remote jobs:', error);
    }
  }

  // Filter local jobs to only include current user's jobs
  const userLocalJobs = localJobs.filter(job => job.user_id === session.user.id);
  console.log('User local jobs:', userLocalJobs.length);

  const allJobs = [...remoteJobs, ...userLocalJobs].sort((a, b) => 
    new Date(b.date_applied) - new Date(a.date_applied)
  );
  
  console.log('Total jobs after merge:', allJobs.length);
  currentJobs = allJobs;
  return allJobs;
}

async function updateJobField(id, field, value) {
  const session = await getSession();
  if (!session) {
    showAuthPage('login');
    return;
  }

  if (id.startsWith('local_')) {
    const localJobs = await getLocalJobs();
    const index = localJobs.findIndex(job => job.local_id === id);
    if (index >= 0) {
      localJobs[index][field] = value;
      await chrome.storage.local.set({ [LOCAL_JOBS_KEY]: localJobs });
    }
  } else if (isOnline()) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ [field]: value })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;
    } catch (error) {
      await addToOfflineQueue('update', { id, update: { [field]: value } });
    }
  } else {
    await addToOfflineQueue('update', { id, update: { [field]: value } });
  }

  await renderAll();
}

async function renderAll() {
  await fetchJobs();
  updateStats();
  await renderApplicationsList();
  updateSyncStatus();
}

function updateStats() {
  const jobs = currentJobs || [];
  const total = jobs.length;
  const interviews = jobs.filter(job => job.interviewed).length;
  const offers = jobs.filter(job => job.offered).length;

  totalApplications.textContent = total;
  interviewCount.textContent = interviews;
  offerCount.textContent = offers;
}

async function renderApplicationsList() {
  const jobs = currentJobs || [];
  const filterSelect = document.getElementById('filterSelect');
  const statusFilter = document.getElementById('statusFilter');
  const filterValue = filterSelect.value;
  const statusValue = statusFilter ? statusFilter.value : 'all';
  
  let filteredJobs = jobs;
  
  // Status-based filtering
  if (statusValue !== 'all') {
    filteredJobs = filteredJobs.filter(job => {
      const calculatedStatus = calculateJobStatus(job);
      return calculatedStatus === statusValue;
    });
  }
  
  // Stage-based filtering (your existing logic)
  switch(filterValue) {
    case 'interviewed':
      filteredJobs = filteredJobs.filter(job => job.interviewed);
      break;
    case 'offered':
      filteredJobs = filteredJobs.filter(job => job.offered);
      break;
    case 'hired':
      filteredJobs = filteredJobs.filter(job => job.got_job);
      break;
    case 'pending':
      filteredJobs = filteredJobs.filter(job => 
        !job.interviewed && !job.offered && !job.got_job
      );
      break;
    case 'all':
    default:
      // No additional filtering needed
  }

  const applicationsList = document.getElementById('applicationsList');
  applicationsList.innerHTML = '';

  if (filteredJobs.length === 0) {
    applicationsList.innerHTML = `
      <div class="empty-state">
        <p>No applications found</p>
        <small>Try changing your filter or add new applications</small>
      </div>
    `;
    return;
  }

  filteredJobs.forEach((job) => {
    const appCard = createApplicationCard(job);
    applicationsList.appendChild(appCard);
  });
}

// Add to your existing code
const AUTO_CLOSE_DAYS = 14;
const STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
};

function calculateJobStatus(job) {
  const appliedDate = new Date(job.date_applied);
  const today = new Date();
  const daysSinceApplication = Math.floor((today - appliedDate) / (1000 * 60 * 60 * 24));
  
  // If job is already marked as closed manually
  if (job.manual_status === STATUS.CLOSED) return STATUS.CLOSED;
  
  // Auto-close after 4 days if no positive updates
  if (daysSinceApplication > AUTO_CLOSE_DAYS && 
      !job.interviewed && 
      !job.offered && 
      !job.got_job) {
    return STATUS.EXPIRED;
  }
  
  // Archive successful applications
  if (job.got_job) return STATUS.ARCHIVED;
  
  return STATUS.ACTIVE;
}

function calculateDaysOld(dateString) {
  const appliedDate = new Date(dateString);
  const today = new Date();
  return Math.floor((today - appliedDate) / (1000 * 60 * 60 * 24));
}

function getAutoCloseWarning(daysOld, autoCloseDays) {
  if (daysOld >= autoCloseDays) {
    return '⚠️ Auto-closed due to inactivity';
  } else if (daysOld === autoCloseDays - 1) {
    return '🔔 Will auto-close tomorrow';
  } else if (daysOld === autoCloseDays - 2) {
    return '💡 Consider following up';
  }
  return '';
}

async function updateJobStatus(jobId, newStatus) {
  const session = await getSession();
  if (!session) {
    showAuthPage('login');
    return;
  }

  // Update the job's manual status
  if (isOnline()) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          manual_status: newStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('user_id', session.user.id);

      if (error) throw error;
    } catch (error) {
      await addToOfflineQueue('update', { 
        id: jobId, 
        update: { 
          manual_status: newStatus,
          status_updated_at: new Date().toISOString()
        } 
      });
    }
  } else {
    await addToOfflineQueue('update', { 
      id: jobId, 
      update: { 
        manual_status: newStatus,
        status_updated_at: new Date().toISOString()
      } 
    });
  }

  await renderAll();
}

function createApplicationCard(job) {
  const appCard = document.createElement('div');
  const jobStatus = calculateJobStatus(job);
  const daysOld = calculateDaysOld(job.date_applied);
  
  appCard.className = `application-card status-${jobStatus}`;
  appCard.setAttribute('data-status', jobStatus);
  appCard.setAttribute('data-days-old', daysOld);
  
  const progress = calculateProgress(job);
  const statusBadges = generateStatusBadges(job);
  
  appCard.innerHTML = `
    <div class="app-card-header">
      <div>
        <div class="app-company">${job.company}</div>
        <div class="app-role">${job.role}</div>
        <div class="app-age ${daysOld > AUTO_CLOSE_DAYS ? 'age-warning' : ''}">
          ${daysOld} day${daysOld !== 1 ? 's' : ''} old
          ${daysOld > AUTO_CLOSE_DAYS ? ' ⚠️' : ''}
        </div>
      </div>
      <div class="app-date">${formatDate(job.date_applied)}</div>
    </div>
    
    <!-- Status Toggle -->
    <div class="status-toggle-container">
      <div class="status-toggle">
        <button class="status-btn ${jobStatus === STATUS.ACTIVE ? 'active' : ''}" 
                data-status="active" data-id="${job.id || job.local_id}">
          🔄 Active
        </button>
        <button class="status-btn ${jobStatus === STATUS.CLOSED ? 'active' : ''}" 
                data-status="closed" data-id="${job.id || job.local_id}">
          ✅ Closed
        </button>
        <button class="status-btn ${jobStatus === STATUS.ARCHIVED ? 'active' : ''}" 
                data-status="archived" data-id="${job.id || job.local_id}">
          📁 Archive
        </button>
      </div>
      <div class="auto-close-warning ${daysOld > AUTO_CLOSE_DAYS - 1 ? 'show' : ''}">
        ${getAutoCloseWarning(daysOld, AUTO_CLOSE_DAYS)}
      </div>
    </div>
    
    <!-- Follow-up Progress -->
    <div class="follow-up-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress.percentage}%"></div>
      </div>
      <div class="progress-text">${progress.completed}/3 milestones completed</div>
    </div>
    
    <!-- Quick Follow-up Actions -->
    <div class="follow-up-actions">
      <div class="follow-up-item">
        <input type="checkbox" 
               class="follow-up-checkbox" 
               id="interviewed_${job.id || job.local_id}"
               ${job.interviewed ? 'checked' : ''}
               ${jobStatus !== STATUS.ACTIVE ? 'disabled' : ''}
               data-id="${job.id || job.local_id}"
               data-field="interviewed">
        <label class="follow-up-label" for="interviewed_${job.id || job.local_id}">Interviewed</label>
      </div>
      
      <div class="follow-up-item">
        <input type="checkbox" 
               class="follow-up-checkbox" 
               id="offered_${job.id || job.local_id}"
               ${job.offered ? 'checked' : ''}
               ${jobStatus !== STATUS.ACTIVE ? 'disabled' : ''}
               data-id="${job.id || job.local_id}"
               data-field="offered">
        <label class="follow-up-label" for="offered_${job.id || job.local_id}">Got Offer</label>
      </div>
      
      <div class="follow-up-item">
        <input type="checkbox" 
               class="follow-up-checkbox" 
               id="hired_${job.id || job.local_id}"
               ${job.got_job ? 'checked' : ''}
               ${jobStatus !== STATUS.ACTIVE ? 'disabled' : ''}
               data-id="${job.id || job.local_id}"
               data-field="got_job">
        <label class="follow-up-label" for="hired_${job.id || job.local_id}">Hired</label>
      </div>
    </div>
    
    <!-- Status Summary -->
    <div class="app-card-footer">
      <div class="app-status">
        ${statusBadges}
        <span class="status-badge status-${jobStatus}">${jobStatus.toUpperCase()}</span>
      </div>
      <div class="app-mood">${getMoodEmoji(job.mood)}</div>
    </div>
    
    <!-- Additional Actions -->
    <div class="app-actions">
      <button class="action-btn add-note" data-id="${job.id || job.local_id}">
        Add Note
      </button>
      <button class="action-btn view-details" data-id="${job.id || job.local_id}">
        Details
      </button>
      <button class="action-btn reopen-job ${jobStatus !== STATUS.ACTIVE ? 'show' : ''}" 
              data-id="${job.id || job.local_id}">
        Reopen
      </button>
    </div>
  `;

  // Add event listeners for status toggles
  const statusButtons = appCard.querySelectorAll('.status-btn');
  statusButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const status = this.getAttribute('data-status');
      updateJobStatus(id, status);
    });
  });
  
  // Add event listener for reopen button
  const reopenBtn = appCard.querySelector('.reopen-job');
  if (reopenBtn) {
    reopenBtn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      updateJobStatus(id, STATUS.ACTIVE);
    });
  }
  
  // Add event listeners for checkboxes
  const checkboxes = appCard.querySelectorAll('.follow-up-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const id = this.getAttribute('data-id');
      const field = this.getAttribute('data-field');
      const value = this.checked;
      
      // Show loading state
      this.disabled = true;
      
      updateJobField(id, field, value).then(() => {
        // Re-enable checkbox
        this.disabled = false;
        
        // Show success feedback
        showUpdateFeedback(this, 'Updated!');
      }).catch(() => {
        this.disabled = false;
        this.checked = !value; // Revert if failed
      });
    });
  });
  
  // Add event listeners for action buttons
  const addNoteBtn = appCard.querySelector('.add-note');
  const viewDetailsBtn = appCard.querySelector('.view-details');
  
  addNoteBtn.addEventListener('click', function() {
    const jobId = this.getAttribute('data-id');
    showNoteModal(jobId);
  });
  
  viewDetailsBtn.addEventListener('click', function() {
    const jobId = this.getAttribute('data-id');
    showJobDetails(jobId);
  });
  
  return appCard;
}

function calculateProgress(job) {
  const milestones = ['interviewed', 'offered', 'got_job'];
  const completed = milestones.filter(milestone => job[milestone]).length;
  const percentage = (completed / milestones.length) * 100;
  
  return {
    completed,
    total: milestones.length,
    percentage
  };
}

function generateStatusBadges(job) {
  let badges = '';
  
  if (job.interviewed) {
    badges += '<span class="status-badge status-interview">Interviewed</span>';
  }
  
  if (job.offered) {
    badges += '<span class="status-badge status-offer">Offer</span>';
  }
  
  if (job.got_job) {
    badges += '<span class="status-badge status-hired">Hired</span>';
  }
  
  if (!job.interviewed && !job.offered && !job.got_job) {
    badges += '<span class="status-badge status-pending">Pending</span>';
  }
  
  return badges;
}

function showUpdateFeedback(element, message) {
  const originalColor = element.style.accentColor;
  element.style.accentColor = '#22c55e';
  
  // Create feedback tooltip
  const tooltip = document.createElement('div');
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: absolute;
    background: #22c55e;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    z-index: 1000;
    pointer-events: none;
  `;
  
  const rect = element.getBoundingClientRect();
  tooltip.style.left = (rect.left + rect.width/2 - 20) + 'px';
  tooltip.style.top = (rect.top - 25) + 'px';
  
  document.body.appendChild(tooltip);
  
  setTimeout(() => {
    element.style.accentColor = originalColor;
    tooltip.remove();
  }, 1000);
}

function showNoteModal(jobId) {
  const job = currentJobs.find(j => (j.id || j.local_id) === jobId);
  if (!job) return;
  
  const note = prompt(`Add a note for ${job.company} - ${job.role}:`, job.notes || '');
  if (note !== null) {
    updateJobField(jobId, 'notes', note);
  }
}

function showJobDetails(jobId) {
  const job = currentJobs.find(j => (j.id || j.local_id) === jobId);
  if (!job) return;
  
  const details = `
Company: ${job.company}
Role: ${job.role}
Date Applied: ${formatDate(job.date_applied)}
Expectation: ${job.application_expectation}/5
Mood: ${job.mood}
Interviewed: ${job.interviewed ? 'Yes' : 'No'}
Offer Received: ${job.offered ? 'Yes' : 'No'}
Hired: ${job.got_job ? 'Yes' : 'No'}
${job.notes ? `Notes: ${job.notes}` : ''}
  `.trim();
  
  alert(details);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMoodEmoji(mood) {
  switch(mood) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'neutral': return '😐';
    default: return '😐';
  }
}

function renderAnalytics() {
  const jobs = currentJobs || [];
  
  if (jobs.length === 0) {
    document.getElementById('jobsPerDayChart').style.display = 'none';
    avgExpectation.textContent = '0';
    successRate.textContent = '0%';
    return;
  }

  // Calculate status distribution
  const statusCounts = {
    active: 0,
    closed: 0,
    expired: 0,
    archived: 0
  };

  jobs.forEach(job => {
    const status = calculateJobStatus(job);
    statusCounts[status]++;
  });

  // Update your analytics with status information
  renderStatusChart(statusCounts);
  
  // Calculate success rate including closed jobs
  const totalClosedJobs = statusCounts.closed + statusCounts.expired + statusCounts.archived;
  const successfulClosures = jobs.filter(job => 
    (job.got_job || job.offered) && 
    ['closed', 'archived'].includes(calculateJobStatus(job))
  ).length;
  
  const closureSuccessRate = totalClosedJobs > 0 ? 
    (successfulClosures / totalClosedJobs * 100).toFixed(1) : 0;
    
  successRate.textContent = `${closureSuccessRate}%`;

  renderJobsPerDayChart();
}

function renderStatusChart(statusCounts) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.statusChartInstance) {
    window.statusChartInstance.destroy();
  }
  
  window.statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Manually Closed', 'Auto-Closed', 'Archived'],
      datasets: [{
        data: [
          statusCounts.active,
          statusCounts.closed,
          statusCounts.expired,
          statusCounts.archived
        ],
        backgroundColor: [
          '#e67600', // Active - orange
          '#22c55e', // Closed - green
          '#ef4444', // Expired - red
          '#6b7280'  // Archived - gray
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}


function renderJobsPerDayChart() {
  const jobs = currentJobs || [];
  const counts = {};
  
  jobs.forEach(job => {
    if (job.date_applied) {
      counts[job.date_applied] = (counts[job.date_applied] || 0) + 1;
    }
  });

  const dates = Object.keys(counts).sort();
  const values = dates.map(date => counts[date]);

  const ctx = document.getElementById('jobsPerDayChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.jobsPerDayChartInstance) {
    window.jobsPerDayChartInstance.destroy();
  }
  
  window.jobsPerDayChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(date => formatChartDate(date)),
      datasets: [{
        label: 'Applications per Day',
        data: values,
        fill: true,
        borderColor: '#e67600',
        backgroundColor: 'rgba(230, 118, 0, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#e67600',
        pointBorderColor: '#052525',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(5, 37, 37, 0.9)',
          titleColor: '#e67600',
          bodyColor: 'white',
          borderColor: '#e67600',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#a0aec0',
            maxTicksLimit: 6
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#a0aec0',
            stepSize: 1
          }
        }
      }
    }
  });
}

function formatChartDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ================= STORAGE FUNCTIONS =================
async function saveToLocal(jobData) {
  const localJobs = await getLocalJobs();
  // Make sure we're saving with the correct user_id
  const jobWithUser = {
    ...jobData,
    local_id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  };
  
  localJobs.push(jobWithUser);
  await chrome.storage.local.set({ [LOCAL_JOBS_KEY]: localJobs });
  console.log('Saved job locally:', jobWithUser.local_id);
}

async function getLocalJobs() {
  try {
    const result = await chrome.storage.local.get(LOCAL_JOBS_KEY);
    const jobs = result[LOCAL_JOBS_KEY] || [];
    console.log('Retrieved local jobs:', jobs.length);
    return jobs;
  } catch (error) {
    console.error('Error getting local jobs:', error);
    return [];
  }
}

async function addToOfflineQueue(operation, data) {
  const queue = await getOfflineQueue();
  queue.push({ operation, data, timestamp: new Date().toISOString() });
  await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: queue });
}

async function getOfflineQueue() {
  const result = await chrome.storage.local.get(OFFLINE_QUEUE_KEY);
  return result[OFFLINE_QUEUE_KEY] || [];
}

async function processOfflineQueue() {
  if (!isOnline()) return;

  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const session = await getSession();
  if (!session) return;

  for (const item of queue) {
    try {
      if (item.operation === 'create') {
        await supabase.from('job_applications').insert([{ ...item.data, user_id: session.user.id }]);
      } else if (item.operation === 'update') {
        await supabase.from('job_applications')
          .update(item.data.update)
          .eq('id', item.data.id)
          .eq('user_id', session.user.id);
      }
    } catch (error) {
      console.error('Sync error:', error);
      break;
    }
  }

  const remainingQueue = queue.slice(1);
  await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: remainingQueue });
}

// ================= UTILITY FUNCTIONS =================
function isOnline() {
  return navigator.onLine;
}

function updateSyncStatus() {
  const statusElement = document.getElementById('syncStatus');
  const statusText = document.getElementById('syncStatusText');
  
  if (!isOnline()) {
    statusElement.className = 'sync-indicator sync-offline';
    statusText.textContent = 'Offline';
  } else {
    statusElement.className = 'sync-indicator sync-online';
    statusText.textContent = 'Online';
  }
}

// ================= EVENT LISTENERS =================
window.addEventListener('online', () => {
  updateSyncStatus();
  processOfflineQueue();
  renderAll();
});

window.addEventListener('offline', () => {
  updateSyncStatus();
});

// Initial sync status
updateSyncStatus();