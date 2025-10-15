// ====== Helpers ======
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ====== Config ======
const TRAVEL_KEY = 'hrmis_travel_records_v1';

// ====== Theme toggle ======
const applyTheme = (name) => {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('theme', name);
};
$('#darkToggle')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ====== Sidebar toggle (Dashboard) ======
const sidebar = $('#sidebar');
const backdrop = $('#backdrop');
$('#sidebarToggle')?.addEventListener('click', () => {
  sidebar?.classList.toggle('show');
  if (backdrop) {
    backdrop.classList.toggle('show');
    backdrop.hidden = !backdrop.classList.contains('show');
  }
});
backdrop?.addEventListener('click', () => {
  sidebar?.classList.remove('show');
  backdrop.classList.remove('show');
  backdrop.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar?.classList.remove('show');
    if (backdrop) { backdrop.classList.remove('show'); backdrop.hidden = true; }
  }
});

// ====== Toasts ======
const toastContainer = $('.toast-container');
function showToast(message, variant='primary') {
  if (!toastContainer) return alert(message);
  const div = document.createElement('div');
  div.className = `toast align-items-center text-bg-${variant} border-0`;
  div.role = 'status';
  div.ariaLive = 'polite';
  div.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  toastContainer.appendChild(div);
  const toast = new bootstrap.Toast(div, { delay: 2500 });
  toast.show();
  div.addEventListener('hidden.bs.toast', () => div.remove());
}

// ====== Login (client-side demo) ======
(() => {
  const form = $('#loginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault(); e.stopPropagation();
    } else {
      e.preventDefault();
      showToast('Signed in. Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'Dashboard.html'; }, 600);
    }
    form.classList.add('was-validated');
  });
})();

// ====== Travel table with localStorage + event delegation ======
(() => {
  const tbody = $('#travelTable');
  if (!tbody) return;

  const form = $('#travelForm');
  const newBtn = $('#newTravelBtn');
  const travelModalEl = document.getElementById('travelModal');
  const modal = travelModalEl ? new bootstrap.Modal(travelModalEl) : null;

  let editingId = null;

  // Storage helpers
  const loadRecords = () => {
    try { return JSON.parse(localStorage.getItem(TRAVEL_KEY)) || []; }
    catch { return []; }
  };
  const saveRecords = (rows) => localStorage.setItem(TRAVEL_KEY, JSON.stringify(rows));

  const actionsHTML = () => `
    <td class="text-nowrap">
      <button class="btn btn-sm btn-outline-primary" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
    </td>`;

  const render = () => {
    const rows = loadRecords();
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.dataset.id = r.id;
      tr.innerHTML = `
        <th scope="row">${r.name}</th>
        <td>${r.rank}</td>
        <td>${r.destination}</td>
        <td>${r.purpose}</td>
        <td class="date">${r.departure}</td>
        <td class="date">${r.ret}</td>
        ${actionsHTML()}`;
      tbody.appendChild(tr);
    });
  };

  const getFormData = () => ({
    id: editingId ?? crypto.randomUUID?.() ?? String(Date.now()),
    name: $('#name').value.trim(),
    rank: $('#rank').value.trim(),
    destination: $('#destination').value.trim(),
    purpose: $('#purpose').value.trim(),
    departure: $('#departure').value,
    ret: $('#return').value,
  });

  const setFormData = (d) => {
    $('#name').value = d.name || '';
    $('#rank').value = d.rank || '';
    $('#destination').value = d.destination || '';
    $('#purpose').value = d.purpose || '';
    $('#departure').value = d.departure || '';
    $('#return').value = d.ret || '';
  };

  // Initial render (empty by default unless localStorage has data)
  render();

  // Search
  $('#tableSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#travelTable tr').forEach(tr => {
      tr.hidden = !tr.textContent.toLowerCase().includes(q);
    });
  });

  // Column sort
  $$('thead th').forEach((th, idx) => {
    if (th.hasAttribute('data-nosort')) return;
    th.style.cursor = 'pointer';
    th.title = 'Click to sort';
    th.addEventListener('click', () => {
      const rows = $$('#travelTable tr');
      const asc = !th.classList.toggle('sort-desc');
      rows.sort((a, b) => a.children[idx].textContent
        .localeCompare(b.children[idx].textContent, undefined, { numeric: true, sensitivity: 'base' }));
      if (!asc) rows.reverse();
      rows.forEach(r => r.parentNode.appendChild(r));
    });
  });

  // New Travel clears edit state
  newBtn?.addEventListener('click', () => {
    editingId = null;
    form?.reset();
    form?.classList.remove('was-validated');
  });

  // Event delegation for Edit/Delete
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const tr = btn.closest('tr'); if (!tr) return;

    const id = tr.dataset.id;
    const all = loadRecords();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;

    const action = btn.getAttribute('data-action');
    if (action === 'edit') {
      editingId = id;
      setFormData(all[idx]);
      modal?.show();
    } else if (action === 'delete') {
      all.splice(idx, 1);
      saveRecords(all);
      render();
      showToast('Record deleted', 'danger');
    }
  });

  // Save (create or update)
  form?.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault(); e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    e.preventDefault();
    const data = getFormData();
    const all = loadRecords();
    const idx = all.findIndex(r => r.id === data.id);
    if (idx >= 0) {
      all[idx] = data;
      showToast('Record updated', 'primary');
    } else {
      all.push(data);
      showToast('Record saved', 'success');
    }
    saveRecords(all);
    render();
    editingId = null;
    form.reset();
    form.classList.remove('was-validated');
    modal?.hide();
  });
})();


// ====== Sidebar section modals ======
(() => {
  const info = {
    openDashboard: { title: 'Dashboard', body: 'Welcome! Choose a section or perform a quick action.' },
    openPromotions: { title: 'Promotions', body: 'Add or edit promotion details here.' },
    openDetails: { title: 'Personnel Details', body: 'View or update personnel information here.' },
    openRetirement: { title: 'Retirement', body: 'Manage retirement records here.' },
    openWaivers: { title: 'Waivers', body: 'Process waivers or exemptions here.' },
  };
  const sectionModalEl = document.getElementById('sectionModal');
  const sectionTitle = document.getElementById('sectionModalLabel');
  const sectionBody = document.getElementById('sectionModalBody');
  const sectionModal = sectionModalEl ? new bootstrap.Modal(sectionModalEl) : null;

  // Wire sidebar links
  Object.keys(info).forEach(id => {
    const link = document.getElementById(id);
    link?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!sectionModal) return;
      sectionTitle.textContent = info[id].title;
      sectionBody.textContent = info[id].body;
      sectionModal.show();
    });
  });

  // Travel link opens the real Travel modal
  const travelLink = document.getElementById('openTravel');
  const travelModalEl = document.getElementById('travelModal');
  const travelModal = travelModalEl ? new bootstrap.Modal(travelModalEl) : null;
  travelLink?.addEventListener('click', (e) => {
    e.preventDefault();
    travelModal?.show();
  });


})();

// ====== Global validation helper ======
$$('.needs-validation').forEach(form => {
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
    form.classList.add('was-validated');
  }, false);
});