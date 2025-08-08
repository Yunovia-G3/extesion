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

const jobTab = document.getElementById('jobTab');
const followUpTab = document.getElementById('followUpTab');
const jobSection = document.getElementById('jobSection');
const followUpSection = document.getElementById('followUpSection');
const chartSection = document.getElementById('chartSection');
const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
 const slider = document.getElementById('expectationSlider');
  const valueDisplay = document.getElementById('expectationValue');

  slider.addEventListener('input', () => {
    valueDisplay.textContent = slider.value;
  });

// Storage keys
const OFFLINE_QUEUE_KEY = 'offline_job_queue';
const LOCAL_JOBS_KEY = 'local_jobs';
const SESSION_KEY = 'supabase_session';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  createProfileSection();
  initializeApp();
});

async function initializeApp() {
  setupAuthEventListeners();
  await checkAuthState();
  setupJobEventListeners();
}

function createProfileSection() {
  const profileSection = document.createElement('div');
  profileSection.id = 'profileSection';
  profileSection.className = 'flex items-center justify-between mb-4 p-2 bg-gray-100 rounded';

  profileSection.innerHTML = `
    <div class ="profile">
      <div class="prof-initials">
        ${getInitials('')}
      </div>
      <div class="mail">
        <p id="userEmail" class="text-sm font-medium"></p>
      </div>
    </div>
  `;

  const topNav = document.querySelector('.top-nav');
topNav.prepend(profileSection);
}
const dropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('resumeUpload');

dropArea.addEventListener('click', () => {
  fileInput.click(); // open file picker on click
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
    fileInput.files = e.dataTransfer.files; // update input
    console.log("File dropped:", fileInput.files[0]);
  }
});
function showFileName(file) {
  fileNameDisplay.textContent = `📄 Uploaded: ${file.name}`;
  dropArea.classList.add('uploaded');
}
function clearFile() {
  fileInput.value = "";
  fileNameDisplay.textContent = "";
  dropArea.classList.remove('uploaded');
}


function updateProfileSection(email) {
  const userEmailElement = document.getElementById('userEmail');
  const initialsElement = document.querySelector('#profileSection div div:first-child');

  if (email) {
    userEmailElement.textContent = email;
    initialsElement.textContent = getInitials(email);
    initialsElement.title = email;
  } else {
    userEmailElement.textContent = 'Not logged in';
    initialsElement.textContent = '?';
    initialsElement.title = '';
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
    renderAll();
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
      renderAll();
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert('Signup failed: ' + error.message);
    } else {
      storeSession(data.session);
      showAppContent();
      updateProfileSection(data.user.email);
      renderAll();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    clearSession();
    showAuthPage('login');
  });
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
  jobTab.addEventListener('click', () => {
    jobSection.style.display = 'flex';
    chartSection.style.display = 'none';
    followUpSection.classList.add('hidden');
    jobTab.classList.add('active-tab');
    jobTab.classList.remove('bg-red-500', 'text-blue-500');
    followUpTab.classList.remove('active-tab');
    followUpTab.classList.add('bg-red-500', 'text-blue-500');
  });

  followUpTab.addEventListener('click', () => {
    jobSection.style.display = 'none';
    chartSection.style.display = 'flex';
    followUpSection.classList.remove('hidden');
    followUpTab.classList.add('active-tab');
    followUpTab.classList.remove('bg-red-500', 'text-blue-500');
    jobTab.classList.remove('active-tab');
    jobTab.classList.add('bg-red-500', 'text-blue-500');
  });

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
  feedback: document.getElementById('feedback').checked,
  interviewed: document.getElementById('interviewed').checked,
  offered: document.getElementById('offer').checked,
  got_job: document.getElementById('gotJob').checked,
  mood: document.getElementById('mood').value,
  application_expectation: parseInt(document.getElementById('expectationSlider').value), // 👈 NEW LINE
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
    } catch (error) {
      await handleOfflineSubmission(formData);
    }
  } else {
    await handleOfflineSubmission(formData);
  }

  e.target.reset();
  renderAll();
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
  if (!session) return [];

  let remoteJobs = [];
  const localJobs = await getLocalJobs();

  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date_applied', { ascending: false });

      if (!error) remoteJobs = data || [];
    } catch (error) {
      console.error('Error fetching remote jobs:', error);
    }
  }

  return [...remoteJobs, ...localJobs].sort((a, b) => 
    new Date(b.date_applied) - new Date(a.date_applied)
  );
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

  renderAll();
}

async function renderAll() {
  await renderJobsTable();
  await renderJobsPerDayGraph();
  updateSyncStatus();
}

async function renderJobsTable() {
  const jobs = await fetchJobs();
  const tbody = document.getElementById('jobsTableBody');
  tbody.innerHTML = '';

  jobs.forEach((job) => {
    const checkedCount = 
      (job.interviewed ? 1 : 0) + 
      (job.offered ? 1 : 0) + 
      (job.got_job ? 1 : 0);

    const tr = document.createElement('tr');
   tr.innerHTML = `
  <td class="border px-4 py-2">${job.company}</td>
  <td class="border px-4 py-2">${job.role}</td>
  <td class="border px-4 py-2">${job.date_applied || ''}</td>
  <td class="border px-4 py-2 text-center">
    <input type="checkbox" ${job.interviewed ? 'checked' : ''} 
           data-id="${job.id || job.local_id}" data-field="interviewed" />
  </td>
  <td class="border px-4 py-2 text-center">
    <input type="checkbox" ${job.offered ? 'checked' : ''} 
           data-id="${job.id || job.local_id}" data-field="offered" />
  </td>
  <td class="border px-4 py-2 text-center">
    <input type="checkbox" ${job.got_job ? 'checked' : ''} 
           data-id="${job.id || job.local_id}" data-field="got_job" />
  </td>
  <td class="border px-4 py-2 text-center">
    <select data-id="${job.id || job.local_id}" data-field="mood" class="mood-select">
      <option value="">--</option>
      <option value="happy" ${job.mood === 'happy' ? 'selected' : ''}>😊 Happy</option>
      <option value="sad" ${job.mood === 'sad' ? 'selected' : ''}>😢 Sad</option>
      <option value="angry" ${job.mood === 'angry' ? 'selected' : ''}>😠 Angry</option>
      <option value="neutral" ${job.mood === 'neutral' ? 'selected' : ''}>😐 Neutral</option>
    </select>
  </td>
  <td class="border px-4 py-2 text-center">
    <input type="text" value="${job.feedback || ''}" 
           data-id="${job.id || job.local_id}" data-field="feedback" 
           class="feedback-input border border-gray-300 px-1 py-1 rounded w-full" />
  </td>
  <td class="border px-4 py-2 text-center">${checkedCount} / 3</td>
`;
    tbody.appendChild(tr);
  });


  tbody.querySelectorAll('select.mood-select').forEach(select => {
  select.addEventListener('change', function() {
    const id = this.getAttribute('data-id');
    const field = this.getAttribute('data-field');
    const value = this.value;
    updateJobField(id, field, value);
  });
});

tbody.querySelectorAll('input.feedback-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', function () {
    const id = this.getAttribute('data-id');
    
    const relatedCheckboxes = [...tbody.querySelectorAll(`input.feedback-checkbox[data-id="${id}"]`)];
    const selectedValues = relatedCheckboxes
      .filter(cb => cb.checked)
      .map(cb => cb.getAttribute('data-value'));

    updateJobField(id, 'feedback', selectedValues.join(','));
  });
});

  // Add event listeners for checkboxes
  tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const id = this.getAttribute('data-id');
      const field = this.getAttribute('data-field');
      const value = this.checked;
      updateJobField(id, field, value);
    });
  });
}

function getMoodEmoji(mood) {
  switch(mood) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'neutral': return '😐';
    default: return '';
  }
}

async function renderJobsPerDayGraph() {
  const jobs = await fetchJobs();
  const counts = {};
  
  jobs.forEach(job => {
    if (job.date_applied) {
      counts[job.date_applied] = (counts[job.date_applied] || 0) + 1;
    }
  });

  const dates = Object.keys(counts).sort();
  const values = dates.map(date => counts[date]);

  const ctx = document.getElementById('jobsPerDayChart').getContext('2d');
  if (window.jobsPerDayChartInstance) {
    window.jobsPerDayChartInstance.destroy();
  }
  
  window.jobsPerDayChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Jobs Applied',
        data: values,
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { 
          title: { display: true, text: 'Applications' },
          beginAtZero: true,
          ticks: { stepSize: 1, padding: 0 }
        }
      }
    }
  });
}

// ================= STORAGE FUNCTIONS =================
async function saveToLocal(jobData) {
  const localJobs = await getLocalJobs();
  localJobs.push({
    ...jobData,
    local_id: 'local_' + Date.now()
  });
  await chrome.storage.local.set({ [LOCAL_JOBS_KEY]: localJobs });
}

async function getLocalJobs() {
  const result = await chrome.storage.local.get(LOCAL_JOBS_KEY);
  return result[LOCAL_JOBS_KEY] || [];
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

  const remainingQueue = queue.slice(1); // Remove processed item
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
    statusElement.className = 'sync-offline';
    statusText.textContent = 'Offline';
    statusElement.classList.remove('hidden');
  } else {
    statusElement.className = 'sync-online';
    statusText.textContent = 'Online';
    statusElement.classList.remove('hidden');
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