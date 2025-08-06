const SUPABASE_URL = 'https://aofvzgqksbhgljzowyby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnZ6Z3Frc2JoZ2xqem93eWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzAxMTEsImV4cCI6MjA3MDAwNjExMX0.XA4xgMqrMy9finlY9xvOhPdrQIsKYlRGmrNx_1D6db4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // Collect form data
  const company = document.getElementById('company').value;
  const role = document.getElementById('role').value;
  const resume_filename = document.getElementById('resume').value;
  const date_applied = document.getElementById('date').value;
  const interviewed = document.getElementById('interview').checked;
  const offered = document.getElementById('offer').checked;
  const got_job = document.getElementById('gotJob').checked;
  const mood = document.getElementById('mood').value; // This will be "happy", "sad", etc.

  // Insert into Supabase
  const { error } = await supabase
    .from('job_applications')
    .insert([{
      company,
      role,
      resume_filename,
      date_applied,
      interviewed,
      offered,
      got_job,
      mood
    }]);

  if (error) {
    alert('Error saving job: ' + error.message);
    return;
  }

  this.reset();
  renderJobsTable();
});

// --- FETCH JOBS ---
async function fetchJobs() {
  const { data: jobs, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('date_applied', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return [];
  }
  return jobs || [];
}

// --- UPDATE JOB FIELDS ---
async function updateJobField(id, field, value) {
  const { error } = await supabase
    .from('job_applications')
    .update({ [field]: value })
    .eq('id', id);

  if (error) console.error('Update error:', error.message);
  renderJobsTable();
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
