const SUPABASE_URL = 'https://aofvzgqksbhgljzowyby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnZ6Z3Frc2JoZ2xqem93eWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzAxMTEsImV4cCI6MjA3MDAwNjExMX0.XA4xgMqrMy9finlY9xvOhPdrQIsKYlRGmrNx_1D6db4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Offline queue and local storage functions
const OFFLINE_QUEUE_KEY = 'offline_job_queue';
const LOCAL_JOBS_KEY = 'local_jobs';


// Tab switching logic
const jobTab = document.getElementById('jobTab');
const followUpTab = document.getElementById('followUpTab');
const jobSection = document.getElementById('jobSection');
const followUpSection = document.getElementById('followUpSection');

jobTab.addEventListener('click', () => {
  jobSection.classList.remove('hidden');
  followUpSection.classList.add('hidden');
  jobTab.classList.add('bg-blue-500', 'text-white');
  jobTab.classList.remove('bg-white', 'text-blue-500');
  followUpTab.classList.remove('bg-blue-500', 'text-white');
  followUpTab.classList.add('bg-white', 'text-blue-500');
});

followUpTab.addEventListener('click', () => {
  jobSection.classList.add('hidden');
  followUpSection.classList.remove('hidden');
  followUpTab.classList.add('bg-blue-500', 'text-white');
  followUpTab.classList.remove('bg-white', 'text-blue-500');
  jobTab.classList.remove('bg-blue-500', 'text-white');
  jobTab.classList.add('bg-white', 'text-blue-500');
});

// --- JOB FORM SUBMISSION ---
document.getElementById('jobForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get form values
  const formData = {
    company: document.getElementById('company').value,
    role: document.getElementById('role').value,
    date_applied: document.getElementById('date').value,
    interviewed: document.getElementById('interview').checked,
    offered: document.getElementById('offer').checked,
    got_job: document.getElementById('gotJob').checked,
    mood: document.getElementById('mood').value,
    resume_filename: '',
    resume_data: ''
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
      // Fallback to offline if Supabase fails
      await handleOfflineSubmission(formData);
    }
  } else {
    await handleOfflineSubmission(formData);
  }

  this.reset();
  renderAll();
});

async function handleOfflineSubmission(formData) {
  await saveToLocal(formData);
  await addToOfflineQueue('create', formData);
  alert('You are offline. Job application saved locally and will sync when you reconnect.');
}

// --- FETCH JOBS ---
async function fetchJobs() {
  let remoteJobs = [];
  const localJobs = await getLocalJobs();

  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('date_applied', { ascending: false });

      if (!error) remoteJobs = data || [];
    } catch (error) {
      console.error('Error fetching remote jobs:', error);
    }
  }

  // Merge and sort all jobs (remote + local)
  return [...remoteJobs, ...localJobs].sort((a, b) => 
    new Date(b.date_applied) - new Date(a.date_applied)
  );
}

// --- UPDATE JOB FIELDS ---
async function updateJobField(id, field, value) {
  const updateData = { [field]: value };

  if (id.startsWith('local_')) {
    // Update local job
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
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      // Fallback to offline if Supabase fails
      await addToOfflineQueue('update', { id, update: updateData });
    }
  } else {
    await addToOfflineQueue('update', { id, update: updateData });
  }

  renderAll();
}

function getMoodEmoji(mood) {
  switch (mood) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'neutral': return '😐';
    default: return '';
  }
}



async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        // Load PDF.js
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdfjs/pdf.worker.min.js');
        
        // Load the PDF
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        
        // Extract text from all pages
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




// --- RENDER JOBS TABLE ---
// ...existing code...

async function renderJobsTable() {
  const jobs = await fetchJobs();
  const tbody = document.getElementById('jobsTableBody');
  tbody.innerHTML = '';

  jobs.forEach((job) => {
    // Count checked follow-up fields
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
        <input type="checkbox" ${job.interviewed ? 'checked' : ''} data-id="${job.id}" data-field="interviewed" />
      </td>
      <td class="border px-4 py-2 text-center">
        <input type="checkbox" ${job.offered ? 'checked' : ''} data-id="${job.id}" data-field="offered" />
      </td>
      <td class="border px-4 py-2 text-center">
        <input type="checkbox" ${job.got_job ? 'checked' : ''} data-id="${job.id}" data-field="got_job" />
      </td>
      <td class="border px-4 py-2 text-center">
        <select data-id="${job.id}" data-field="mood" class="border rounded px-2 py-1">
          <option value="happy" ${job.mood === 'happy' ? 'selected' : ''}>😊 Happy</option>
          <option value="sad" ${job.mood === 'sad' ? 'selected' : ''}>😢 Sad</option>
          <option value="angry" ${job.mood === 'angry' ? 'selected' : ''}>😠 Angry</option>
          <option value="neutral" ${job.mood === 'neutral' ? 'selected' : ''}>😐 Neutral</option>
        </select>
      </td>
      <td class="border px-4 py-2 text-center">${checkedCount} / 3</td>
    `;
    tbody.appendChild(tr);
  });

  // Add event listeners for checkboxes
  tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const id = this.getAttribute('data-id');
      const field = this.getAttribute('data-field');
      const value = this.checked;
      updateJobField(id, field, value);
    });
  });

  // Add event listeners for mood select
  tbody.querySelectorAll('select[data-field="mood"]').forEach(select => {
    select.addEventListener('change', function () {
      const id = this.getAttribute('data-id');
      const value = this.value;
      updateJobField(id, 'mood', value);
    });
  });
}

// Initial render
renderJobsTable();



async function renderJobsPerDayGraph() {
  const jobs = await fetchJobs();
  // Count jobs per day
  const counts = {};
  jobs.forEach(job => {
    if (job.date_applied) {
      counts[job.date_applied] = (counts[job.date_applied] || 0) + 1;
    }
  });

  // Sort dates
  const dates = Object.keys(counts).sort();
  const values = dates.map(date => counts[date]);

  // Prepare chart data
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
        tension: 0.2,
        pointRadius: 3
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date' }
        },
        y: {
          title: { display: true, text: 'Applications' },
          beginAtZero: true,
          precision: 0,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// Call this after rendering the table
async function renderAll() {
  await renderJobsTable();
  await renderJobsPerDayGraph();
}

// Initial render
renderAll();

// Replace all calls to renderJobsTable() with renderAll()
// For example, after form submission:
document.getElementById('jobForm').addEventListener('submit', async function (e) {
  // ...existing code...
  this.reset();
  renderAll();
});

// And after updating job fields:
async function updateJobField(id, field, value) {
  const { error } = await supabase
    .from('job_applications')
    .update({ [field]: value })
    .eq('id', id);

  if (error) console.error('Update error:', error.message);
  renderAll();
}





// Check online status
function isOnline() {
  return navigator.onLine;
}

// Save to local storage
async function saveToLocal(jobData) {
  const localJobs = await getLocalJobs();
  localJobs.push({
    ...jobData,
    local_id: Date.now().toString(), // Unique ID for local items
    is_local: true
  });
  await chrome.storage.local.set({ [LOCAL_JOBS_KEY]: localJobs });
}

// Get local jobs
async function getLocalJobs() {
  const result = await chrome.storage.local.get(LOCAL_JOBS_KEY);
  return result[LOCAL_JOBS_KEY] || [];
}

// Save to offline queue
async function addToOfflineQueue(operation, data) {
  const queue = await getOfflineQueue();
  queue.push({ operation, data, timestamp: new Date().toISOString() });
  await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: queue });
}

// Get offline queue
async function getOfflineQueue() {
  const result = await chrome.storage.local.get(OFFLINE_QUEUE_KEY);
  return result[OFFLINE_QUEUE_KEY] || [];
}

// Process offline queue when coming online
async function processOfflineQueue() {
  if (!isOnline()) return;

  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      if (item.operation === 'create') {
        await supabase.from('job_applications').insert([item.data]);
      } else if (item.operation === 'update') {
        await supabase.from('job_applications')
          .update(item.data.update)
          .eq('id', item.data.id);
      }
    } catch (error) {
      console.error('Sync error:', error);
      // Retry later
      break;
    }
  }

  // Remove processed items
  const remainingQueue = queue.slice(queue.findIndex(x => x === item) + 1);
  await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: remainingQueue });
}

// Listen for online/offline events
window.addEventListener('online', processOfflineQueue);


function updateSyncStatus() {
  const statusElement = document.getElementById('syncStatus');
  const statusText = document.getElementById('syncStatusText');
  
  if (!isOnline()) {
    statusElement.classList.remove('hidden', 'sync-online', 'sync-error');
    statusElement.classList.add('sync-offline');
    statusText.textContent = 'Offline - Changes will sync when you reconnect';
    statusElement.classList.remove('hidden');
  } else {
    statusElement.classList.remove('hidden', 'sync-offline', 'sync-error');
    statusElement.classList.add('sync-online');
    statusText.textContent = 'Online - Changes are syncing';
    statusElement.classList.remove('hidden');
  }
}

// Initial status update
updateSyncStatus();

// Update on network changes
window.addEventListener('online', () => {
  updateSyncStatus();
  processOfflineQueue();
});
window.addEventListener('offline', updateSyncStatus);


// Sync every 5 minutes when online
const SYNC_INTERVAL = 5 * 60 * 1000;

chrome.alarms.create('periodicSync', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicSync' && navigator.onLine) {
    try {
      await chrome.runtime.sendMessage({ type: 'SYNC_QUEUE' });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
});