// ---------------- Local JSON Portal Script ----------------

// Paths to local JSON files
const OFFICIALS_JSON = '../tools/officials.json';
const MEMBERS_JSON = '../tools/members.json';
const INSTITUTIONS_JSON = '../tools/institutions.json';

// Data storage
let officialsData = [];
let membersData = [];
let institutionsData = [];

// Utility: Fetch local JSON
async function fetchLocalJSON(path) {
    try {
        const resp = await fetch(path);
        if (!resp.ok) throw new Error(`Failed to load ${path}`);
        return await resp.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ---------------- Load Officials ----------------
async function loadOfficials() {
    officialsData = await fetchLocalJSON(OFFICIALS_JSON);
}

// ---------------- Load Members ----------------
async function loadMembers() {
    membersData = await fetchLocalJSON(MEMBERS_JSON);
}

// ---------------- Load Institutions ----------------
async function loadInstitutions() {
    institutionsData = await fetchLocalJSON(INSTITUTIONS_JSON);
    const select = document.getElementById('institution-select');
    select.innerHTML = '<option value="">--Select Institution--</option>';
    institutionsData.forEach(inst => {
        const opt = document.createElement('option');
        opt.value = inst['Institution'];
        opt.textContent = inst['Institution'];
        select.appendChild(opt);
    });
    select.onchange = loadInstitutionSummary;
}

// ---------------- Login ----------------
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('official-id').value.trim();
    const pass = document.getElementById('official-pass').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = '';

    const found = officialsData.find(x => x.id === id && x.pass === pass);
    if (!found) {
        errorDiv.textContent = "Invalid Official ID or Password.";
        return;
    }

    localStorage.setItem('official', JSON.stringify({ id: found.id, name: found.name }));
    showDashboard(found.name);
});

// ---------------- Show Dashboard ----------------
function showDashboard(name) {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('official-info').textContent = `Logged in as: ${name}`;
    loadInstitutions();
    showTab('institution-summary');
}

// ---------------- Logout ----------------
document.getElementById('logout-btn').onclick = function () {
    localStorage.removeItem('official');
    window.location.reload();
};

// ---------------- Tab Switching ----------------
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showTab(btn.dataset.tab);
    };
});

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(tab).classList.remove('hidden');
}

// ---------------- Institution Summary ----------------
function loadInstitutionSummary() {
    const instId = document.getElementById('institution-select').value;
    const detailsDiv = document.getElementById('institution-details');
    const membersDiv = document.getElementById('members-list');
    detailsDiv.innerHTML = '';
    membersDiv.innerHTML = '';

    if (!instId) return;

    const inst = institutionsData.find(i => i['Institution'] === instId);
    if (!inst) return;

    // Show institution info
    let html = `<strong>Institution:</strong> ${inst['Institution'] || "-"}<br>
                <strong>Address:</strong> ${inst['Address'] || "-"}<br>
                <strong>Email:</strong> ${inst['Email'] || "-"}<br>
                <strong>Landline:</strong> ${inst['Landline'] || "-"}<br>
                <strong>Head:</strong> ${inst['Head cell'] || "-"}<br>
                <strong>Bursar:</strong> ${inst['Bursar Cell'] || "-"}<br>`;
    detailsDiv.innerHTML = html;

    // Show members of this institution
    const members = membersData.filter(m => m['Institution'] === instId);
    membersDiv.innerHTML = members.length ? membersTable(members) :
        `<div style="color:#888;">No members found for this institution.</div>`;
}

// ---------------- Members Table ----------------
function membersTable(members) {
    let html = `<table><thead><tr>
        <th>Full Name</th><th>National ID</th><th>Job Title</th><th>Grade</th>
        <th>Status</th><th>Position</th>
    </tr></thead><tbody>`;
    members.forEach(m => {
        html += `<tr>
            <td>${m['Full Name'] || '-'}</td>
            <td>${m['National ID'] || '-'}</td>
            <td>${m['Job Title'] || '-'}</td>
            <td>${m['Grade'] || '-'}</td>
            <td>${m['Status'] || '-'}</td>
            <td>${m['Position in Union'] || '-'}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

// ---------------- Member Lookup ----------------
let memberSearchTimeout = null;
document.getElementById('member-search').addEventListener('input', function () {
    clearTimeout(memberSearchTimeout);
    const query = this.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('member-search-results');
    resultsDiv.innerHTML = '';
    if (query.length < 2) return;
    memberSearchTimeout = setTimeout(() => {
        const found = membersData.filter(m => (m['Full Name'] || '').toLowerCase().includes(query));
        resultsDiv.innerHTML = found.length ? membersTable(found) :
            `<div style="color:#888;">No members found.</div>`;
    }, 300);
});

// ---------------- Add Member (frontend only) ----------------
document.getElementById('add-member-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    const obj = {};
    for (const el of form.elements) {
        if (el.name) obj[el.name] = el.value.trim();
    }
    console.log("Add Member Data:", obj);
    document.getElementById('add-member-success').textContent =
        "Member data captured (check browser console).";
    setTimeout(() => {
        document.getElementById('add-member-success').textContent = "";
        form.reset();
    }, 2000);
});

// ---------------- Init ----------------
window.addEventListener('DOMContentLoaded', async function () {
    await loadOfficials();
    await loadMembers();
    await loadInstitutions();

    const saved = localStorage.getItem('official');
    if (saved) {
        const official = JSON.parse(saved);
        showDashboard(official.name);
    }
});
// -------------------------------------------------------
