// ====== Helpers ======
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
      // In this demo, any non-empty credentials will proceed.
      showToast('Signed in. Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'Dashboard.html'; }, 600);
    }
    form.classList.add('was-validated');
  });
})();



// ====== Travel table (add/edit/delete with event delegation) ======
(() => {
  const tbody = $('#travelTable');
  if (!tbody) return;

  const form = $('#travelForm');
  const newBtn = $('#newTravelBtn');
  const travelModalEl = document.getElementById('travelModal');
  const modal = travelModalEl ? new bootstrap.Modal(travelModalEl) : null;

  let editingRow = null;

  // Helpers
  const getFormData = () => ({
    name: $('#name').value.trim(),
    rank: $('#rank').value.trim(),
    destination: $('#destination').value.trim(),
    purpose: $('#purpose').value.trim(),
    departure: $('#departure').value,
    ret: $('#return').value,
  });

  const setFormData = (data) => {
    $('#name').value = data.name || '';
    $('#rank').value = data.rank || '';
    $('#destination').value = data.destination || '';
    $('#purpose').value = data.purpose || '';
    $('#departure').value = data.departure || '';
    $('#return').value = data.ret || '';
  };

  const actionsHTML = () => `
    <td class="text-nowrap">
      <button class="btn btn-sm btn-outline-primary" data-action="edit" title="Edit"><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Delete"><i class="bi bi-trash"></i></button>
    </td>`;

  // Search
  $('#tableSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#travelTable tr').forEach(tr => {
      tr.hidden = !tr.textContent.toLowerCase().includes(q);
    });
  });

  // Sort (skip Actions col)
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

  // New Travel button clears edit state
  newBtn?.addEventListener('click', () => {
    editingRow = null;
    form?.reset();
    form?.classList.remove('was-validated');
  });

  // Event delegation for Edit/Delete
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const tr = btn.closest('tr');
    if (!tr) return;

    const action = btn.getAttribute('data-action');
    if (action === 'edit') {
      editingRow = tr;
      const data = {
        name: tr.children[0].textContent.trim(),
        rank: tr.children[1].textContent.trim(),
        destination: tr.children[2].textContent.trim(),
        purpose: tr.children[3].textContent.trim(),
        departure: tr.children[4].textContent.trim(),
        ret: tr.children[5].textContent.trim(),
      };
      setFormData(data);
      modal?.show();
    } else if (action === 'delete') {
      tr.remove();
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

    if (editingRow) {
      editingRow.innerHTML = `
        <th scope="row">${data.name}</th>
        <td>${data.rank}</td>
        <td>${data.destination}</td>
        <td>${data.purpose}</td>
        <td class="date">${data.departure}</td>
        <td class="date">${data.ret}</td>
      ` + actionsHTML();
      showToast('Record updated', 'primary');
    } else {
      const row = document.createElement('tr');
      row.innerHTML = `
        <th scope="row">${data.name}</th>
        <td>${data.rank}</td>
        <td>${data.destination}</td>
        <td>${data.purpose}</td>
        <td class="date">${data.departure}</td>
        <td class="date">${data.ret}</td>
      ` + actionsHTML();
      tbody.appendChild(row);
      showToast('Record saved', 'success');
    }

    editingRow = null;
    form.reset();
    form.classList.remove('was-validated');
    modal?.hide();
  });
})();


// ====== Bootstrap form validation helper (global) ======
$$('.needs-validation').forEach(form => {
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
    form.classList.add('was-validated');
  }, false);
});

const travelModalEl = document.getElementById('travelModal');
const travelModal = travelModalEl ? new bootstrap.Modal(travelModalEl) : null;
// …after save/update/delete:
travelModal?.hide();

// ====== Sidebar modal triggers (Promotions, Travel, Details, Retirement, Waivers)
(() => {
  const modals = {
    openPromotions: 'promotionsModal',
    openTravel: 'travelAuthorityModal',
    openDetails: 'detailsModal',
    openRetirement: 'retirementModal',
    openWaivers: 'waiversModal',
  };

  Object.entries(modals).forEach(([btnId, modalId]) => {
    const trigger = document.getElementById(btnId);
    const modalEl = document.getElementById(modalId);
    if (!trigger || !modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      modal.show();
    });

    // Handle form submission inside each modal
    const form = modalEl.querySelector('form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      form.classList.remove('was-validated');
      showToast(`${modalId.replace('Modal','')} submitted successfully!`, 'success');
      modal.hide();
      form.reset();
    });
  });
})();
