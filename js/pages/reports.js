/* Made by: Satyam */
/* Bloom & Petal - js/pages/reports.js - sales reports for any dates, with CSV download and print. */
FS.ready(function () {
  const form = byId('range-form');
  const fromInput = byId('from');
  const toInput = byId('to');
  let chosen = { key: '30' };     // a preset key ('7', '30', 'year', 'all') or { key: 'custom', from, to }

  fromInput.max = toInput.max = FS.today();
  choosePreset('30');
  window.addEventListener('fs:change', render);   // data changed here or in another tab: draw again

  // A preset pill shows that range straight away
  form.addEventListener('change', function (e) {
    if (e.target.name === 'range') choosePreset(e.target.value);
    if (e.target === fromInput && fromInput.value) toInput.min = fromInput.value;   // "To" cannot be before "From"
  });

  // "Apply" checks the two dates and shows them
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = FS.formData(form);
    if (FS.showErrors(form, checkDates(data.from, data.to))) return;
    chosen = { key: 'custom', from: data.from, to: data.to };
    form.querySelectorAll('input[name="range"]').forEach(r => { r.checked = false; });
    render();
    FS.toast('Showing ' + rangeText(data.from, data.to) + '.', 'info');
  });

  byId('show-all').addEventListener('click', function () {
    form.querySelector('input[name="range"][value="all"]').checked = true;
    choosePreset('all');
  });
  byId('csv').addEventListener('click', downloadCsv);
  byId('print').addEventListener('click', function () { window.print(); });

  // Picks a preset range: fills in the two dates and draws the report
  function choosePreset(key) {
    chosen = { key: key };
    const r = presetRange(key);
    fromInput.value = r.from;
    toInput.value = r.to;
    toInput.min = r.from;
    FS.clearErrors(form);
    render();
  }

  // The dates of a preset, worked out fresh each time so "today" is always right
  function presetRange(key) {
    const today = FS.today();
    if (key === '7') return { from: FS.today(-6), to: today, title: 'Last 7 days' };
    if (key === '30') return { from: FS.today(-29), to: today, title: 'Last 30 days' };
    if (key === 'year') return { from: today.slice(0, 4) + '-01-01', to: today, title: 'This year' };
    const first = firstOrderDay();
    return { from: first && first < today ? first : today, to: today, title: 'All time' };
  }

  // The range on screen now: { from, to, title }
  function currentRange() {
    return chosen.key === 'custom' ? { from: chosen.from, to: chosen.to, title: 'Custom dates' } : presetRange(chosen.key);
  }

  // Errors for the "From" and "To" dates ({} when both are fine)
  function checkDates(from, to) {
    const errors = {};
    const today = FS.today();
    if (!from) errors.from = 'Pick a start date.';
    else if (from < '2000-01-01' || from > today) errors.from = 'Pick a date from 2000 up to today.';
    if (!to) errors.to = 'Pick an end date.';
    else if (to > today) errors.to = 'Pick a date up to today.';
    else if (from && to < from) errors.to = 'Must be on or after the start date.';
    return errors;
  }

  // Draws the whole report for the chosen dates
  function render() {
    const r = currentRange();
    const s = FS.stats({ from: r.from, to: r.to });
    if (!s) return;                                 // the page guard already sends everyone else away
    byId('range-title').textContent = r.title;
    byId('range-text').textContent = rangeText(r.from, r.to) + ' · ' + plural(s.orders, 'order');
    byId('csv').disabled = !s.orders;
    byId('csv').title = s.orders ? 'Download these ' + plural(s.orders, 'order') + ' as a spreadsheet file' : 'No orders in these dates';
    renderStats(s);
    byId('empty').hidden = s.orders > 0;
    byId('charts').hidden = !s.orders;
    if (!s.orders) { renderEmpty(); return; }
    renderSalesChart(r, s);
    byId('by-type').innerHTML = s.revenue
      ? FS.barsHTML(s.byCategory.map(c => ({ label: c.label, value: c.value, display: FS.money(c.value) })))
      : noSalesHTML();
    byId('by-status').innerHTML = FS.barsHTML(FS.STATUSES.concat('Cancelled').map(st => ({ label: st, value: s.byStatus[st] || 0 })));
    renderBest(s.topFlowers);
    renderCustomers(s.topCustomers);
  }

  // The four numbers at the top
  function renderStats(s) {
    byId('stats').innerHTML =
      stat('receipt', 'Sales', FS.money(s.revenue), 'Cancelled orders not counted') +
      stat('bag', 'Orders', s.orders, plural(s.open, 'order') + ' still open') +
      stat('chart', 'Average order', FS.money(s.average), 'Across ' + plural(s.paidOrders, 'order')) +
      stat('x', 'Cancelled', s.cancelled, s.orders ? Math.round(s.cancelled / s.orders * 100) + '% of all orders' : 'Nothing cancelled');
  }

  // One number box
  function stat(icon, label, value, note) {
    return `<div class="stat"><span class="stat-label">${FS.icon(icon, 16)}${FS.esc(label)}</span>` +
      `<span class="stat-value">${FS.esc(value)}</span><span class="stat-note">${FS.esc(note)}</span></div>`;
  }

  // The message when no orders fall in the chosen dates
  function renderEmpty() {
    const all = chosen.key === 'all';
    byId('empty-title').textContent = all ? 'No orders yet' : 'No orders in these dates';
    byId('empty-text').textContent = all ? 'Reports fill in as soon as customers place orders.' : 'Try a longer range, or look at all time.';
    byId('show-all').hidden = all;
  }

  // "Daily sales": one column a day (a month or a year when the range is long)
  function renderSalesChart(r, s) {
    const chart = chartColumns(r.from, r.to, s.byDay);
    byId('sales-title').textContent = { day: 'Daily sales', month: 'Monthly sales', year: 'Yearly sales' }[chart.unit];
    byId('sales-sub').textContent = 'One column a ' + chart.unit + '. Cancelled orders are not counted.';
    if (!s.revenue) { byId('sales-chart').innerHTML = noSalesHTML(); return; }
    const cols = chart.columns;
    const best = cols.reduce((a, b) => (b.revenue > a.revenue ? b : a));
    const rows = cols.map(c => ({ label: c.label, value: c.revenue, title: c.name + ': ' + FS.money(c.revenue) + ' from ' + plural(c.orders, 'order') }));
    // the inner min-width lets a long chart scroll sideways on a phone instead of squashing the columns
    byId('sales-chart').innerHTML =
      `<div style="overflow-x: auto;"><div style="min-width: ${rows.length * 22}px;">${FS.colsHTML(rows)}</div></div>` +
      `<div class="legend"><span>Total <strong>${FS.money(s.revenue)}</strong></span>` +
      `<span>Best ${chart.unit} <strong>${FS.esc(best.name)}</strong> with ${FS.money(best.revenue)}</span></div>`;
    const scroller = byId('sales-chart').firstElementChild;
    scroller.scrollLeft = scroller.scrollWidth;     // on a phone, start at the newest days
  }

  // Splits the dates into chart columns: days (up to 31 days), months (up to two years) or years.
  // byDay comes from FS.stats: [{ date: 'YYYY-MM-DD', revenue, orders }]
  function chartColumns(from, to, byDay) {
    const days = dayCount(from, to);
    const unit = days <= 31 ? 'day' : days <= 731 ? 'month' : 'year';
    const size = { day: 10, month: 7, year: 4 }[unit];      // how much of 'YYYY-MM-DD' names one column
    const manyYears = from.slice(0, 4) !== to.slice(0, 4);
    const columns = [];
    const d = parseDay(from);
    const end = parseDay(to);
    while (d <= end) {
      const key = dayKey(d).slice(0, size);
      const month = d.toLocaleDateString('en-IN', { month: 'short' });
      columns.push({
        key: key, revenue: 0, orders: 0,
        label: unit === 'day' ? String(d.getDate()) : unit === 'month' ? month + (manyYears ? ' ' + key.slice(2, 4) : '') : key,
        name: unit === 'day' ? FS.fmtDate(key) : unit === 'month' ? month + ' ' + key.slice(0, 4) : key
      });
      if (unit === 'day') d.setDate(d.getDate() + 1);
      else if (unit === 'month') d.setMonth(d.getMonth() + 1, 1);
      else d.setFullYear(d.getFullYear() + 1, 0, 1);
    }
    byDay.forEach(function (day) {
      const col = columns.find(c => c.key === day.date.slice(0, size));
      if (col) { col.revenue += day.revenue; col.orders += day.orders; }
    });
    return { unit: unit, columns: columns };
  }

  // "Best sellers": flowers by units sold, with their photos
  function renderBest(list) {
    if (!list.length) { byId('best').innerHTML = noSalesHTML(); return; }
    const photos = {};
    FS.getFlowers({ all: true }).forEach(f => { photos[f.name] = f; });
    byId('best').innerHTML = tableHTML(['Flower', 'Units', 'Revenue'], list.slice(0, 8).map(f =>
      `<tr><td><div class="cell-flower">${FS.flowerImg(photos[f.name] || { name: f.name })}<span class="cell-main">${FS.esc(f.name)}</span></div></td>` +
      `<td class="right num">${FS.esc(f.qty)}</td><td class="right num strong">${FS.money(f.revenue)}</td></tr>`));
  }

  // "Top customers": who spent the most
  function renderCustomers(list) {
    if (!list.length) { byId('customers').innerHTML = noSalesHTML(); return; }
    byId('customers').innerHTML = tableHTML(['Customer', 'Orders', 'Spent'], list.slice(0, 8).map(c =>
      `<tr><td><div class="cell-flower"><span class="avatar">${FS.esc(FS.initials(c.name))}</span><span class="cell-main">${FS.esc(c.name)}</span></div></td>` +
      `<td class="right num">${FS.esc(c.orders)}</td><td class="right num strong">${FS.money(c.spent)}</td></tr>`));
  }

  // A table: the first heading on the left, the number headings on the right
  function tableHTML(heads, rows) {
    return '<div class="table-wrap"><table class="table"><thead><tr>' +
      heads.map((h, i) => `<th scope="col"${i ? ' class="right"' : ''}>${FS.esc(h)}</th>`).join('') +
      '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  // Shown in a card when every order in the dates was cancelled
  function noSalesHTML() { return '<p class="muted mb-0">No sales in these dates, only cancelled orders.</p>'; }

  /* ---- CSV download ---- */

  // The orders placed in the chosen dates, newest first
  function ordersInRange(r) {
    return FS.getOrders().filter(o => { const d = dayKey(new Date(o.createdAt)); return d >= r.from && d <= r.to; });
  }

  // Builds a CSV file (opens in Excel or Google Sheets) of the orders in the chosen dates and downloads it
  function downloadCsv() {
    const r = currentRange();
    const list = ordersInRange(r);
    if (!list.length) { FS.toast('There are no orders in these dates to download.', 'info'); return; }
    const lines = [['Order', 'Date', 'Customer', 'Items', 'Total (INR)', 'Status']].concat(list.map(o =>
      [o.id, stamp(o.createdAt), o.customer, o.items.map(i => i.name + ' x ' + i.qty).join('; '), o.total, o.status]));
    const csv = lines.map(line => line.map(csvCell).join(',')).join('\r\n');
    try {
      // '﻿' at the start tells Excel the file is UTF-8 (so the ₹ sign and names show correctly)
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bloom-petal-orders-' + r.from + '-to-' + r.to + '.csv';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      FS.toast('Downloaded ' + plural(list.length, 'order') + ' as a CSV file.');
    } catch (err) {
      FS.toast('This browser could not make the file.', 'error');
    }
  }

  // One CSV cell: in quotes, with inner quotes doubled. A cell that starts with = + - @
  // gets a ' in front so a spreadsheet does not run it as a formula.
  function csvCell(value) {
    let text = String(value == null ? '' : value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  // "2026-11-15 14:05": a date and time that spreadsheets sort correctly
  function stamp(iso) {
    const d = new Date(iso);
    return dayKey(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ---- date helpers (local time, the same days FS.stats uses) ---- */

  // 'YYYY-MM-DD' for a Date
  function dayKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // A Date at midnight from 'YYYY-MM-DD'
  function parseDay(text) {
    const p = text.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  // How many days a range covers, counting both ends
  function dayCount(from, to) { return Math.round((parseDay(to) - parseDay(from)) / 86400000) + 1; }

  // The day of the oldest order, or '' when there are no orders
  function firstOrderDay() {
    const days = FS.getOrders().map(o => dayKey(new Date(o.createdAt))).sort();
    return days[0] || '';
  }

  // "9 Nov – 15 Nov 2026" (the year is written once when both dates share it)
  function rangeText(from, to) {
    if (from === to) return FS.fmtDate(to);
    const start = FS.fmtDate(from);
    return (from.slice(0, 4) === to.slice(0, 4) ? start.replace(/ \d{4}$/, '') : start) + ' – ' + FS.fmtDate(to);
  }

  /* ---- small helpers ---- */
  function byId(id) { return document.getElementById(id); }

  // "1 order", "3 orders"
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
});
