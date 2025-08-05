
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

    // Example: Populate table with dummy data (replace with real data logic)
    const jobs = [
      {
        company: "Acme Corp",
        role: "Frontend Developer",
        date: "2025-08-01",
        interviewed: true,
        offer: false,
        gotJob: false,
        mood: "🙂",
        followUps: 2
      },
      {
        company: "Beta Inc",
        role: "Backend Engineer",
        date: "2025-07-28",
        interviewed: false,
        offer: false,
        gotJob: false,
        mood: "😐",
        followUps: 1
      }
    ];

    function renderJobsTable() {
  const tbody = document.getElementById('jobsTableBody');
  tbody.innerHTML = '';
  jobs.forEach((job, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border px-4 py-2">${job.company}</td>
      <td class="border px-4 py-2">${job.role}</td>
      <td class="border px-4 py-2">${job.date}</td>
      <td class="border px-4 py-2 text-center">
        <input type="checkbox" ${job.interviewed ? 'checked' : ''} data-idx="${idx}" data-field="interviewed" />
      </td>
      <td class="border px-4 py-2 text-center">
        <input type="checkbox" ${job.offer ? 'checked' : ''} data-idx="${idx}" data-field="offer" />
      </td>
      <td class="border px-4 py-2 text-center">
        <input type="checkbox" ${job.gotJob ? 'checked' : ''} data-idx="${idx}" data-field="gotJob" />
      </td>
      <td class="border px-4 py-2 text-center">${job.mood}</td>
      <td class="border px-4 py-2 text-center">${job.followUps}</td>
    `;
    tbody.appendChild(tr);
  });

  // Add event listeners for checkboxes
  tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const idx = this.getAttribute('data-idx');
      const field = this.getAttribute('data-field');
      jobs[idx][field] = this.checked;
      renderJobsTable();
    });
  });
}

renderJobsTable();