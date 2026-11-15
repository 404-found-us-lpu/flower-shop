/* Made by: Satyam */
/* Bloom & Petal - js/pages/stock.js - the stock page: add, edit, archive and delete flowers, and keep counts right. */
FS.ready(function (user) {
  const isOwner = !!user && user.role === 'owner';
  const MAX_STOCK = 9999;                          // the same limit FS.saveFlower checks
  const TABS = ['all', 'low', 'out', 'archived'];

  // What the table shows right now: search text, type and tab.
  const state = { q: '', type: '', tab: 'all' };

  const els = {
    add: document.getElementById('add-flower'),
    chips: document.getElementById('stock-chips'),
    search: document.getElementById('stock-search'),
    type: document.getElementById('stock-type'),
    tabs: document.getElementById('stock-tabs'),
    list: document.getElementById('stock-list'),
    live: document.getElementById('stock-live')
  };

  /* ------------------------------------------------ small checks */

  // On sale with 5 or fewer left. Out of stock counts too, the same as on the dashboards.
  function isLow(f) { return f.active && f.stock <= FS.LOW_STOCK; }

  // On sale with nothing left.
  function isOut(f) { return f.active && f.stock <= 0; }

  // Does this flower belong under the given tab?
  function inTab(f, tab) {
    if (tab === 'low') return isLow(f);
    if (tab === 'out') return isOut(f);
    if (tab === 'archived') return !f.active;
    return true;
  }

  // The flowers that match the search box and the type menu (the tabs filter after this).
  function matching(all) {
    return all.filter(function (f) {
      return (!state.q || f.name.toLowerCase().includes(state.q)) && (!state.type || f.category === state.type);
    });
  }

  // Reads a short message out to screen reader users.
  function say(text) { els.live.textContent = text; }

  /* ------------------------------------------------ drawing the page */

  // Draws the chips, the tab counts and the table (or an empty message). Returns how many rows are shown.
  function render() {
    const all = FS.getFlowers({ all: true });
    const found = matching(all);
    const rows = found.filter(function (f) { return inTab(f, state.tab); });
    if (state.tab === 'low') rows.sort(function (a, b) { return a.stock - b.stock; });   // fewest left first
    const keep = focusedButton();
    renderChips(all);
    renderTabs(found);
    els.list.innerHTML = rows.length ? tableHTML(rows) : emptyHTML(all.length);
    if (keep) refocus(keep);
    return rows.length;
  }

  // Redraws after a filter changed and says how many flowers are shown.
  function refilter() {
    const shown = render();
    say(shown === 1 ? '1 flower shown.' : shown + ' flowers shown.');
  }

  // The three numbers in the green band: all flowers, how many run low, units in stock.
  function renderChips(all) {
    const low = all.filter(isLow).length;
    const units = all.reduce(function (sum, f) { return sum + f.stock; }, 0);
    els.chips.innerHTML =
      `<span class="chip">${FS.icon('flower', 16)}${all.length} ${all.length === 1 ? 'flower' : 'flowers'}</span>` +
      `<span class="chip${low ? ' chip-gold' : ''}">${FS.icon(low ? 'alert' : 'check', 16)}${low ? low + ' running low' : 'Nothing running low'}</span>` +
      `<span class="chip">${FS.icon('box', 16)}${units.toLocaleString('en-IN')} ${units === 1 ? 'unit' : 'units'} in stock</span>`;
  }

  // Puts the right number on each tab and marks the chosen one.
  function renderTabs(found) {
    els.tabs.querySelectorAll('[data-tab]').forEach(function (btn) {
      const on = btn.dataset.tab === state.tab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.querySelector('.count').textContent = found.filter(function (f) { return inTab(f, btn.dataset.tab); }).length;
    });
  }

  // The table of flowers.
  function tableHTML(rows) {
    return `
      <div class="table-wrap">
        <table class="table stock-table">
          <caption class="sr-only">Flower stock</caption>
          <thead>
            <tr>
              <th scope="col">Flower</th>
              <th scope="col" class="col-type">Type</th>
              <th scope="col" class="right">Price</th>
              <th scope="col">Stock</th>
              <th scope="col">Status</th>
              <th scope="col"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>${rows.map(rowHTML).join('')}</tbody>
        </table>
      </div>`;
  }

  // One row: photo and name, type, price, stock with - and + buttons, status, and the action buttons.
  function rowHTML(f) {
    const name = FS.esc(f.name);
    const level = FS.stockBadge({ ...f, active: true });          // the count, even for archived flowers
    const status = f.active ? '<span class="badge badge-ok">On sale</span>' : '<span class="badge badge-archived">Archived</span>';
    const archive = f.active
      ? `<button type="button" class="btn-icon" data-act="archive" aria-label="Archive ${name}" title="Archive (hide from the shop)">${FS.icon('box', 17)}</button>`
      : `<button type="button" class="btn-icon" data-act="archive" aria-label="Restore ${name}" title="Restore (put back on sale)">${FS.icon('refresh', 17)}</button>`;
    const del = isOwner
      ? `<button type="button" class="btn-icon danger" data-act="delete" aria-label="Delete ${name}" title="Delete">${FS.icon('trash', 17)}</button>`
      : '';
    return `
      <tr data-id="${f.id}"${f.active ? '' : ' class="is-archived"'}>
        <td>
          <div class="cell-flower">
            ${FS.flowerImg(f)}
            <div>
              <div class="cell-main">${name}</div>
              <div class="cell-sub one-line" title="${FS.esc(f.description)}">${FS.esc(f.description) || 'No description yet'}</div>
            </div>
          </div>
        </td>
        <td class="col-type muted">${FS.esc(f.category)}</td>
        <td class="right num strong">${FS.money(f.price)}</td>
        <td class="col-stock">
          <div class="stock-adjust">
            <button type="button" class="btn-icon" data-act="minus" aria-label="One less ${name}" title="One less"${f.stock <= 0 ? ' disabled' : ''}>${FS.icon('minus', 16)}</button>
            ${level}
            <button type="button" class="btn-icon" data-act="plus" aria-label="One more ${name}" title="One more"${f.stock >= MAX_STOCK ? ' disabled' : ''}>${FS.icon('plus', 16)}</button>
          </div>
        </td>
        <td>${status}</td>
        <td class="col-actions">
          <div class="t-actions">
            <button type="button" class="btn-icon" data-act="edit" aria-label="Edit ${name}" title="Edit">${FS.icon('edit', 17)}</button>
            ${archive}${del}
          </div>
        </td>
      </tr>`;
  }

  // The message for an empty table, with one button that helps.
  function emptyHTML(total) {
    let icon = 'search', title = 'No flowers match', text = 'Try another name or type.';
    let button = '<button type="button" class="btn btn-ghost" data-empty="reset">Clear search</button>';
    if (!total) {
      icon = 'flower'; title = 'No flowers yet'; text = 'Add your first flower and it shows up in the shop right away.';
      button = `<button type="button" class="btn btn-primary" data-empty="add">${FS.icon('plus', 18)}Add flower</button>`;
    } else if (!state.q && !state.type) {
      const msg = {
        low: ['check', 'Nothing is running low', `Every flower on sale has more than ${FS.LOW_STOCK} left.`],
        out: ['check', 'Nothing is out of stock', 'Every flower on sale has at least one left.'],
        archived: ['box', 'No archived flowers', 'Archive a flower to hide it from the shop. Old orders still show it.']
      }[state.tab];
      icon = msg[0]; title = msg[1]; text = msg[2];
      button = '<button type="button" class="btn btn-ghost" data-empty="reset">Show all flowers</button>';
    }
    return `<div class="empty"><span class="empty-icon">${FS.icon(icon, 28)}</span><h3>${title}</h3><p>${text}</p>${button}</div>`;
  }

  // Remembers which row button has the keyboard focus, because redrawing the table loses it.
  function focusedButton() {
    const el = document.activeElement;
    if (!el || !els.list.contains(el) || !el.dataset.act) return null;
    return { id: el.closest('tr').dataset.id, act: el.dataset.act };
  }

  // Puts the focus back on the same button after the table was redrawn.
  function refocus(keep) {
    const btn = els.list.querySelector(`tr[data-id="${keep.id}"] [data-act="${keep.act}"]`);
    if (btn && !btn.disabled) btn.focus();
  }

  /* ------------------------------------------------ actions on one flower */

  // Adds one to (step 1) or takes one from (step -1) the stock count.
  function changeStock(f, step) {
    const next = f.stock + step;
    if (next < 0 || next > MAX_STOCK) return;
    const r = FS.saveFlower({ ...f, stock: next });
    if (r.ok) say(`${f.name}: ${next} in stock.`);
    else FS.toast(r.error, 'error');
  }

  // Archived flowers are hidden from the shop but kept for old orders. This switches between the two.
  function toggleArchive(f) {
    const r = FS.saveFlower({ ...f, active: !f.active });
    if (!r.ok) FS.toast(r.error, 'error');
    else if (f.active) FS.toast(`${f.name} is archived and hidden from the shop.`);
    else FS.toast(`${f.name} is back on sale.`);
  }

  // Owner only: deletes a flower after asking. app.js archives it instead when old orders use it.
  function removeFlower(f) {
    FS.confirm(`${f.name} will be removed for good. If old orders include it, it is archived instead so those orders stay correct.`,
      { title: 'Delete this flower?', okText: 'Delete', danger: true })
      .then(function (yes) {
        if (!yes) return;
        const r = FS.deleteFlower(f.id);
        if (!r.ok) FS.toast(r.error, 'error');
        else if (r.archived) FS.toast(`${f.name} was archived because old orders use it.`, 'info');
        else FS.toast(`${f.name} was deleted.`);
      });
  }

  // One click handler for every button in the table and in the empty message (event delegation).
  function onListClick(e) {
    const empty = e.target.closest('[data-empty]');
    if (empty) {
      if (empty.dataset.empty === 'add') openEditor(null);
      else resetFilters();
      return;
    }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const f = FS.getFlower(btn.closest('tr').dataset.id);
    if (!f) return;
    const act = btn.dataset.act;
    if (act === 'minus') changeStock(f, -1);
    else if (act === 'plus') changeStock(f, 1);
    else if (act === 'edit') openEditor(f);
    else if (act === 'archive') toggleArchive(f);
    else if (act === 'delete' && isOwner) removeFlower(f);
  }

  // Clears the search box, the type menu and the tab.
  function resetFilters() {
    state.q = ''; state.type = ''; state.tab = 'all';
    els.search.value = ''; els.type.value = '';
    refilter();
    els.search.focus();
  }

  /* ------------------------------------------------ add / edit dialog */

  // What sits inside the photo box: the photo, or an empty box that asks for one.
  function photoHTML(image) {
    if (image) return `<img src="${FS.esc(image)}" alt="" onerror="FS.imgError(this)">`;
    return `<span class="ph"><span class="photo-empty">${FS.icon('image', 26)}Add a photo</span></span>`;
  }

  // The add/edit form. f = the flower to change, or null for a new one. Every value is escaped.
  function formHTML(f) {
    const v = f || { name: '', category: '', price: '', stock: '', description: '', image: '' };
    const options = FS.CATEGORIES.map(function (c) {
      return `<option value="${FS.esc(c)}"${c === v.category ? ' selected' : ''}>${FS.esc(c)}</option>`;
    }).join('');
    return `
      <form id="flower-form">
        <div class="form-grid">
          <div class="field">
            <label for="f-name">Name</label>
            <input type="text" id="f-name" name="name" value="${FS.esc(v.name)}" required minlength="2" maxlength="60" autocomplete="off" placeholder="Peach Rose Bouquet">
            <p class="error"></p>
          </div>
          <div class="field">
            <label for="f-category">Type</label>
            <select id="f-category" name="category" required>
              <option value="">Choose a type</option>${options}
            </select>
            <p class="error"></p>
          </div>
          <div class="field">
            <label for="f-price">Price (₹)</label>
            <input type="number" id="f-price" name="price" value="${FS.esc(v.price)}" required min="1" max="100000" step="1" placeholder="750">
            <p class="error"></p>
          </div>
          <div class="field">
            <label for="f-stock">In stock</label>
            <input type="number" id="f-stock" name="stock" value="${FS.esc(v.stock)}" required min="0" max="${MAX_STOCK}" step="1" placeholder="12">
            <p class="error"></p>
          </div>
          <div class="field full">
            <label for="f-description">Description</label>
            <textarea id="f-description" name="description" rows="3" maxlength="200" placeholder="Six peach roses hand tied with baby's breath.">${FS.esc(v.description)}</textarea>
            <p class="hint">A sentence or two. Customers read it in the shop.</p>
            <p class="error"></p>
          </div>
          <div class="field full">
            <label for="f-image">Photo</label>
            <div class="photo-pick">
              <label class="photo-box" for="f-image">${photoHTML(v.image)}</label>
              <div class="photo-side">
                <input type="file" id="f-image" name="image" accept="image/*">
                <p class="hint">A clear photo in good light sells best. Big photos are made smaller before saving.</p>
                <button type="button" class="link-btn" data-remove-photo${v.image ? '' : ' hidden'}>Remove photo</button>
              </div>
            </div>
            <p class="error"></p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-primary">${f ? 'Save changes' : 'Add flower'}</button>
        </div>
      </form>`;
  }

  // Opens the add/edit dialog. f = the flower to change, or null for a new one.
  function openEditor(f) {
    let editId = f ? f.id : null;
    let image = f ? f.image : '';            // keeps the old photo unless a new one is picked or it is removed
    let notStored = false;                   // true when the browser had no room to store the last try
    const modal = FS.openModal({ title: f ? `Edit ${f.name}` : 'Add a flower', html: formHTML(f), wide: true });
    const form = modal.el.querySelector('form');
    const fileInput = form.querySelector('#f-image');
    const removeBtn = form.querySelector('[data-remove-photo]');
    const saveBtn = form.querySelector('button[type="submit"]');

    // Shows the photo (or the empty box), and "Remove photo" only when there is a photo.
    function showPhoto() {
      form.querySelector('.photo-box').innerHTML = photoHTML(image);
      removeBtn.hidden = !image;
    }

    // A photo was picked: FS.readImage makes it smaller (900 px at most) and gives it back as text we can save.
    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (!file) return;
      saveBtn.disabled = true;
      FS.readImage(file, 900)
        .then(function (url) { image = url; showPhoto(); FS.clearErrors(form); })
        .catch(function (err) { fileInput.value = ''; FS.showErrors(form, { image: err.message }); })
        .finally(function () { saveBtn.disabled = false; });
    });

    removeBtn.addEventListener('click', function () { image = ''; fileInput.value = ''; showPhoto(); });
    form.querySelector('[data-cancel]').addEventListener('click', function () { modal.close(false); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (editId && !FS.getFlower(editId)) {
        FS.toast('This flower was deleted in another tab.', 'error');
        modal.close(false);
        return;
      }
      const data = FS.formData(form);
      data.id = editId;
      data.image = image;
      const r = FS.saveFlower(data);
      if (r.ok) {
        FS.toast(f ? `Saved the changes to ${r.flower.name}.` : `${r.flower.name} is now in the shop.`);
        modal.close(true);
        return;
      }
      if (r.errors.image) {
        // The browser had no room to store it, but app.js keeps the flower in memory.
        // So the next try must change that flower instead of adding a second one with the same name.
        notStored = true;
        const kept = FS.getFlowers({ all: true }).find(function (x) { return x.name.toLowerCase() === data.name.toLowerCase(); });
        if (kept) editId = kept.id;
      }
      FS.showErrors(form, r.errors);
    });

    // Closed without saving after the browser ran out of room: reload, so the page shows only what is really stored.
    modal.closed.then(function (saved) { if (notStored && !saved) location.reload(); });
  }

  /* ------------------------------------------------ start */

  // Fill the type menu from the shop settings.
  els.type.insertAdjacentHTML('beforeend', FS.CATEGORIES.map(function (c) {
    return `<option value="${FS.esc(c)}">${FS.esc(c)}</option>`;
  }).join(''));

  // stock.html?tab=low opens straight on that tab (handy for links from the dashboards).
  const startTab = FS.params().get('tab');
  if (TABS.includes(startTab)) state.tab = startTab;

  els.add.addEventListener('click', function () { openEditor(null); });
  els.search.addEventListener('input', function () { state.q = els.search.value.trim().toLowerCase(); refilter(); });
  els.type.addEventListener('change', function () { state.type = els.type.value; refilter(); });
  els.tabs.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    state.tab = btn.dataset.tab;
    refilter();
  });
  els.list.addEventListener('click', onListClick);

  render();
  window.addEventListener('fs:change', render);   // data changed here or in another tab
});
