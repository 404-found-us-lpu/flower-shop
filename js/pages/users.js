/* Made by: Yash */
/* Bloom & Petal - js/pages/users.js - the owner's list of people: search, role tabs, add, edit and remove accounts. */
FS.ready(function (me) {
  const ROLES = ['customer', 'florist', 'owner'];
  const ROLE_ORDER = { owner: 0, florist: 1, customer: 2 };
  const WORDS = { customer: ['customer', 'customers'], florist: ['florist', 'florists'], owner: ['owner', 'owners'] };
  const CHIP_ICON = { customer: 'user', florist: 'flower', owner: 'shield' };

  const search = document.getElementById('user-search');
  const tabs = document.getElementById('role-tabs');
  const chips = document.getElementById('role-chips');
  const tableWrap = document.getElementById('users-table');
  const rows = document.getElementById('user-rows');
  const empty = document.getElementById('users-empty');
  let activeRole = 'all';   // the open tab: 'all' or one role

  // "1 florist" or "3 florists"
  function countText(n, role) {
    return n + ' ' + WORDS[role][n === 1 ? 0 : 1];
  }

  // How many people have each role: { all, customer, florist, owner }
  function countRoles(users) {
    const counts = { all: users.length, customer: 0, florist: 0, owner: 0 };
    users.forEach(function (u) { counts[u.role] += 1; });
    return counts;
  }

  // People who match the search box and the open tab: owners, then florists, then customers, each A-Z
  function visibleUsers(users) {
    const q = search.value.trim().toLowerCase();
    return users.filter(function (u) {
      const text = (u.name + ' ' + u.email + ' ' + u.phone).toLowerCase();
      return (activeRole === 'all' || u.role === activeRole) && text.indexOf(q) !== -1;
    }).sort(function (a, b) {
      return ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name);
    });
  }

  // One table row. The owner's own row says "You" and has no remove button.
  function rowHTML(u) {
    const isMe = u.id === me.id;
    const name = FS.esc(u.name);
    const remove = isMe ? '' :
      `<button type="button" class="btn-icon danger" data-act="delete" data-id="${u.id}" aria-label="Remove ${name}" title="Remove">${FS.icon('trash', 18)}</button>`;
    return `<tr>
      <td>
        <div class="cell-flower">
          <span class="avatar" aria-hidden="true">${FS.esc(FS.initials(u.name))}</span>
          <div>
            <div class="cell-main">${name}${isMe ? ' <span class="chip chip-gold">You</span>' : ''}</div>
            <div class="cell-sub">${FS.esc(u.email)}</div>
          </div>
        </div>
      </td>
      <td class="num">${FS.esc(u.phone)}</td>
      <td>${FS.roleBadge(u.role)}</td>
      <td class="right num">${FS.esc(u.orders)}</td>
      <td>${FS.esc(FS.fmtDate(u.joined))}</td>
      <td>
        <div class="t-actions">
          <button type="button" class="btn-icon" data-act="edit" data-id="${u.id}" aria-label="Edit ${name}" title="Edit">${FS.icon('edit', 18)}</button>
          ${remove}
        </div>
      </td>
    </tr>`;
  }

  // What to show when no row matches, with a button that helps
  function emptyHTML() {
    const q = search.value.trim();
    if (q) {
      return `<span class="empty-icon">${FS.icon('search', 28)}</span>
        <h3>No one matches "${FS.esc(q)}"</h3>
        <p>Check the spelling, or try an email address or phone number.</p>
        <button type="button" class="btn btn-ghost" data-act="clear">Clear search</button>`;
    }
    return `<span class="empty-icon">${FS.icon('users', 28)}</span>
      <h3>No ${activeRole === 'all' ? 'users' : WORDS[activeRole][1]} yet</h3>
      <p>Add someone and they can log in straight away.</p>
      <button type="button" class="btn btn-primary" data-act="add">${FS.icon('plus', 18)}Add user</button>`;
  }

  // Draw the hero chips, the tab counts and the table from the saved data
  function render() {
    const users = FS.getUsers();
    const counts = countRoles(users);
    chips.innerHTML = ROLES.map(function (r) {
      return `<span class="chip">${FS.icon(CHIP_ICON[r], 16)}${countText(counts[r], r)}</span>`;
    }).join('');
    tabs.querySelectorAll('.tab').forEach(function (tab) {
      const on = tab.dataset.role === activeRole;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-pressed', String(on));
      tab.querySelector('.count').textContent = counts[tab.dataset.role];
    });
    const list = visibleUsers(users);
    rows.innerHTML = list.map(rowHTML).join('');
    tableWrap.hidden = list.length === 0;
    empty.hidden = list.length > 0;
    empty.innerHTML = list.length ? '' : emptyHTML();
  }

  // The form inside the add / edit dialog
  function formHTML(u, editing, isMe) {
    const options = ROLES.map(function (r) {
      return `<option value="${r}"${u.role === r ? ' selected' : ''}>${FS.esc(FS.ROLE_LABEL[r])}</option>`;
    }).join('');
    return `<form class="form-grid">
      <div class="field">
        <label for="u-name">Full name</label>
        <input id="u-name" name="name" type="text" value="${FS.esc(u.name)}" required minlength="2" maxlength="60" autocomplete="off">
        <p class="error"></p>
      </div>
      <div class="field">
        <label for="u-email">Email</label>
        <input id="u-email" name="email" type="email" value="${FS.esc(u.email)}" required maxlength="80" autocomplete="off">
        <p class="error"></p>
      </div>
      <div class="field">
        <label for="u-phone">Mobile number</label>
        <input id="u-phone" name="phone" type="tel" value="${FS.esc(u.phone)}" required pattern="[6-9][0-9]{9}" maxlength="10"
          title="10 digits, starting with 6, 7, 8 or 9" autocomplete="off">
        <p class="error"></p>
      </div>
      <div class="field">
        <label for="u-role">Role</label>
        <select id="u-role" name="role" required${isMe ? ' disabled' : ''}>${options}</select>
        ${isMe ? '<p class="hint">You cannot change your own role.</p>' : ''}
        <p class="error"></p>
      </div>
      <div class="field full">
        <label for="u-password">${editing ? 'New password' : 'Password'}</label>
        <input id="u-password" name="password" type="password" minlength="6" maxlength="64" autocomplete="new-password"${editing ? '' : ' required'}>
        <p class="hint">${editing ? 'Leave empty to keep it.' : 'At least 6 characters. Share it with them so they can log in.'}</p>
        <p class="error"></p>
      </div>
      <div class="field full">
        <label for="u-address">Address <span class="muted">(optional)</span></label>
        <textarea id="u-address" name="address" rows="3" maxlength="200" autocomplete="off">${FS.esc(u.address)}</textarea>
        <p class="error"></p>
      </div>
      <div class="modal-actions full">
        <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">${editing ? 'Save changes' : 'Add user'}</button>
      </div>
    </form>`;
  }

  // Open the add / edit dialog. user = null adds someone new (with the role of the open tab).
  function openEditor(user) {
    const editing = !!user;
    const isMe = editing && user.id === me.id;
    const u = user || { name: '', email: '', phone: '', address: '', role: activeRole === 'all' ? 'customer' : activeRole };
    const modal = FS.openModal({ title: editing ? 'Edit ' + user.name : 'Add user', wide: true, html: formHTML(u, editing, isMe) });
    const form = modal.el.querySelector('form');
    form.querySelector('[data-act="cancel"]').addEventListener('click', function () { modal.close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = FS.formData(form);
      if (editing) data.id = user.id;
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      const r = FS.saveUser(data);
      button.disabled = false;
      if (!r.ok) { FS.showErrors(form, r.errors); return; }
      FS.toast(editing ? 'Saved the changes for ' + r.user.name + '.' : r.user.name + ' was added and can log in now.');
      modal.close();
    });
  }

  // Ask first, then remove the account. FS refuses your own account and people who have orders.
  function removeUser(user) {
    FS.confirm('Remove ' + user.name + ' (' + user.email + ')? This cannot be undone.',
      { title: 'Remove this user?', okText: 'Remove', danger: true })
      .then(function (yes) {
        if (!yes) return;
        const r = FS.deleteUser(user.id);
        if (r.ok) FS.toast(user.name + ' was removed.');
        else FS.toast(r.error, 'error');
      });
  }

  // Edit and remove buttons in the table (one listener for every row)
  rows.addEventListener('click', function (e) {
    const button = e.target.closest('button[data-act]');
    if (!button) return;
    const user = FS.getUsers().find(function (u) { return u.id === Number(button.dataset.id); });
    if (!user) return;
    if (button.dataset.act === 'edit') openEditor(user);
    else removeUser(user);
  });

  // Buttons inside the empty state
  empty.addEventListener('click', function (e) {
    const button = e.target.closest('button[data-act]');
    if (!button) return;
    if (button.dataset.act === 'clear') { search.value = ''; render(); search.focus(); }
    else openEditor(null);
  });

  // Role tabs
  tabs.addEventListener('click', function (e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    activeRole = tab.dataset.role;
    render();
  });

  search.addEventListener('input', render);
  document.getElementById('add-user').addEventListener('click', function () { openEditor(null); });
  window.addEventListener('fs:change', render);
  render();
});
