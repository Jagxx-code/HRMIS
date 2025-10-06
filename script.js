
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

// ====== Login (demo only) ======
(() => {
  const form = $('#loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault(); e.stopPropagation();
    } else {
      e.preventDefault();
      const user = $('#username')?.value.trim();
      const pass = $('#password')?.value.trim();
      // Demo credentials
      if (user === 'admin' && pass === 'admin') {
        showToast('Signed in. Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'Dashboard.html'; }, 600);
      } else {
        showToast('Invalid credentials (demo: admin/admin).', 'danger');
      }
    }
    form.classList.add('was-validated');
  });
})();

// ====== Table search & sort (Dashboard) ======
(() => {
  const tbody = $('#travelTable');
  if (!tbody) return;

  // search
  $('#tableSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#travelTable tr').forEach(tr => {
      tr.hidden = !tr.textContent.toLowerCase().includes(q);
    });
  });

  // sort on header click
  $$('thead th').forEach((th, idx) => {
    th.style.cursor = 'pointer';
    th.title = 'Click to sort';
    th.addEventListener('click', () => {
      const rows = $$('#travelTable tr');
      const asc = !th.classList.toggle('sort-desc');
      rows.sort((a,b) => a.children[idx].textContent
        .localeCompare(b.children[idx].textContent, undefined, {numeric:true, sensitivity:'base'}));
      if (!asc) rows.reverse();
      rows.forEach(r => r.parentNode.appendChild(r));
    });
  });

  // select row -> populate form
  const form = $('#travelForm');
  const updateBtn = $('#updateBtn');
  const deleteBtn = $('#deleteBtn');
  let selectedRow = null;

  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    selectedRow = tr;
    const [name, rank, dest, purpose, departure, ret] = [
      tr.children[0].textContent,
      tr.children[1].textContent,
      tr.children[2].textContent,
      tr.children[3].textContent,
      tr.children[4].textContent,
      tr.children[5].textContent,
    ];
    $('#name').value = name;
    $('#rank').value = rank;
    $('#destination').value = dest;
    $('#purpose').value = purpose;
    $('#departure').value = departure;
    $('#return').value = ret;
    updateBtn.disabled = deleteBtn.disabled = false;
  });

  // create/save
  form?.addEventListener('submit', (e) => {
    if (!form.checkValidity()) {
      e.preventDefault(); e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    e.preventDefault();
    const row = document.createElement('tr');
    row.innerHTML = `
      <th scope="row">${$('#name').value}</th>
      <td>${$('#rank').value}</td>
      <td>${$('#destination').value}</td>
      <td>${$('#purpose').value}</td>
      <td class="date">${$('#departure').value}</td>
      <td class="date">${$('#return').value}</td>`;
    tbody.appendChild(row);
    showToast('Record saved', 'success');
    form.reset();
    form.classList.remove('was-validated');
  });

  // update
  updateBtn?.addEventListener('click', () => {
    if (!selectedRow) return;
    selectedRow.innerHTML = `
      <th scope="row">${$('#name').value}</th>
      <td>${$('#rank').value}</td>
      <td>${$('#destination').value}</td>
      <td>${$('#purpose').value}</td>
      <td class="date">${$('#departure').value}</td>
      <td class="date">${$('#return').value}</td>`;
    showToast('Record updated', 'primary');
  });

  // delete
  deleteBtn?.addEventListener('click', () => {
    if (!selectedRow) return;
    selectedRow.remove();
    selectedRow = null;
    showToast('Record deleted', 'danger');
    updateBtn.disabled = deleteBtn.disabled = true;
  });
})();

// ====== Bootstrap form validation helper (global) ======
$$('.needs-validation').forEach(form => {
  form.addEventListener('submit', e => {
    if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
    form.classList.add('was-validated');
  }, false);
});
