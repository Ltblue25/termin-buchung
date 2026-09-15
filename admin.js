// Admin Panel Data Management
class AdminSystem {
    constructor() {
        this.advisors = JSON.parse(localStorage.getItem('advisors')) || [];
        this.appointments = JSON.parse(localStorage.getItem('bookedAppointments')) || [];
        this.config = JSON.parse(localStorage.getItem('systemConfig')) || this.getDefaultConfig();
        this.currentAdvisorEditId = null;
    }

    getDefaultConfig() {
        return {
            slotDuration: 20,
            workdayStart: '08:00',
            workdayEnd: '17:00',
            workdays: [1, 2, 3, 4, 5],
            roundRobinEnabled: true,
            emailNotificationsEnabled: true,
            futureBookingsOnly: true,
            minDaysAdvance: 0,
            lastRoundRobinIndex: 0
        };
    }

    saveAllData() {
        localStorage.setItem('advisors', JSON.stringify(this.advisors));
        localStorage.setItem('systemConfig', JSON.stringify(this.config));
        localStorage.setItem('bookedAppointments', JSON.stringify(this.appointments));
    }

    // Advisors Management
    addAdvisor(name, email, phone) {
        if (!name || !email) return false;
        const advisor = {
            id: Date.now(),
            name,
            email,
            phone,
            createdAt: new Date().toISOString(),
            appointmentCount: 0
        };
        this.advisors.push(advisor);
        this.saveAllData();
        return advisor;
    }

    updateAdvisor(id, name, email, phone) {
        const advisor = this.advisors.find(a => a.id === id);
        if (advisor) {
            advisor.name = name;
            advisor.email = email;
            advisor.phone = phone;
            this.saveAllData();
            return true;
        }
        return false;
    }

    deleteAdvisor(id) {
        this.advisors = this.advisors.filter(a => a.id !== id);
        this.saveAllData();
        return true;
    }

    // Round-Robin Distribution
    getNextAdvisor() {
        if (this.advisors.length === 0) return null;
        
        const index = this.config.lastRoundRobinIndex % this.advisors.length;
        const advisor = this.advisors[index];
        
        this.config.lastRoundRobinIndex = (index + 1) % this.advisors.length;
        this.saveAllData();
        
        return advisor;
    }

    assignAppointmentToAdvisor(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (appointment && this.config.roundRobinEnabled) {
            const advisor = this.getNextAdvisor();
            if (advisor) {
                appointment.advisor = advisor;
                advisor.appointmentCount = (advisor.appointmentCount || 0) + 1;
                this.saveAllData();
                return advisor;
            }
        }
        return appointment?.advisor || null;
    }

    // Timeslots Generation
    generateTimeSlots() {
        const slots = [];
        const start = this.config.workdayStart.split(':').map(Number);
        const end = this.config.workdayEnd.split(':').map(Number);
        
        let currentMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        
        while (currentMinutes < endMinutes) {
            const hours = Math.floor(currentMinutes / 60);
            const minutes = currentMinutes % 60;
            slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            currentMinutes += this.config.slotDuration;
        }
        
        return slots;
    }

    // Statistics
    getStatistics() {
        const totalAppointments = this.appointments.length;
        const totalAdvisors = this.advisors.length;
        const appointmentsThisWeek = this.appointments.filter(app => {
            const appDate = new Date(app.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return appDate > weekAgo;
        }).length;

        return {
            totalAppointments,
            totalAdvisors,
            appointmentsThisWeek,
            avgAppointmentsPerAdvisor: totalAdvisors > 0 ? (totalAppointments / totalAdvisors).toFixed(1) : 0
        };
    }

    // Export/Import
    exportData() {
        const data = {
            advisors: this.advisors,
            appointments: this.appointments,
            config: this.config,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.advisors = data.advisors || [];
            this.appointments = data.appointments || [];
            this.config = { ...this.getDefaultConfig(), ...data.config };
            this.saveAllData();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
}

// Initialize Admin System
const admin = new AdminSystem();

// DOM Elements
const advisorNameInput = document.getElementById('advisorName');
const advisorEmailInput = document.getElementById('advisorEmail');
const advisorPhoneInput = document.getElementById('advisorPhone');
const addAdvisorBtn = document.getElementById('addAdvisorBtn');
const advisorsList = document.getElementById('advisorsList');

const slotDurationInput = document.getElementById('slotDuration');
const workdayStartInput = document.getElementById('workdayStart');
const workdayEndInput = document.getElementById('workdayEnd');
const saveTimeslotsBtn = document.getElementById('saveTimeslotsBtn');
const slotsPreview = document.getElementById('slotsPreview');

const appointmentsList = document.getElementById('appointmentsList');
const appointmentFilter = document.getElementById('appointmentFilter');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const exportBtn = document.getElementById('exportBtn');

const roundRobinEnabled = document.getElementById('roundRobinEnabled');
const emailNotificationsEnabled = document.getElementById('emailNotificationsEnabled');
const futureBookingsOnly = document.getElementById('futureBookingsOnly');
const minDaysAdvanceInput = document.getElementById('minDaysAdvance');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFile = document.getElementById('restoreFile');
const clearDataBtn = document.getElementById('clearDataBtn');
const statisticsContainer = document.getElementById('statisticsContainer');

// Tab Navigation
document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'advisors') loadAdvisors();
    if (tabName === 'timeslots') loadTimeslots();
    if (tabName === 'appointments') loadAppointments();
    if (tabName === 'settings') loadSettings();
}

// ADVISORS TAB
function loadAdvisors() {
    // Load configuration
    workdayStartInput.value = admin.config.workdayStart;
    workdayEndInput.value = admin.config.workdayEnd;
    slotDurationInput.value = admin.config.slotDuration;
    
    // Load available workdays
    document.querySelectorAll('.weekdays-selector input').forEach(checkbox => {
        checkbox.checked = admin.config.workdays.includes(parseInt(checkbox.value));
    });
    
    // Render advisors list
    renderAdvisorsList();
}

function renderAdvisorsList() {
    if (admin.advisors.length === 0) {
        advisorsList.innerHTML = '<p class="empty-state">Keine Berater vorhanden</p>';
        return;
    }

    advisorsList.innerHTML = admin.advisors.map(advisor => `
        <div class="item-card">
            <div class="item-card-info">
                <div class="item-card-name">${advisor.name}</div>
                <div class="item-card-detail">📧 ${advisor.email}</div>
                ${advisor.phone ? `<div class="item-card-detail">📞 ${advisor.phone}</div>` : ''}
                <div class="item-card-detail">📋 ${advisor.appointmentCount || 0} Termine</div>
            </div>
            <div class="item-card-actions">
                <button class="btn-small btn-small-edit" onclick="editAdvisor(${advisor.id})">✏️ Bearbeiten</button>
                <button class="btn-small btn-small-delete" onclick="deleteAdvisor(${advisor.id})">🗑️ Löschen</button>
            </div>
        </div>
    `).join('');
}

addAdvisorBtn.addEventListener('click', () => {
    const name = advisorNameInput.value.trim();
    const email = advisorEmailInput.value.trim();
    const phone = advisorPhoneInput.value.trim();
    
    if (!name || !email) {
        alert('Bitte füllen Sie Name und E-Mail aus');
        return;
    }
    
    admin.addAdvisor(name, email, phone);
    advisorNameInput.value = '';
    advisorEmailInput.value = '';
    advisorPhoneInput.value = '';
    renderAdvisorsList();
    alert('✅ Berater erfolgreich hinzugefügt');
});

function editAdvisor(id) {
    admin.currentAdvisorEditId = id;
    const advisor = admin.advisors.find(a => a.id === id);
    if (!advisor) return;
    
    document.getElementById('editAdvisorName').value = advisor.name;
    document.getElementById('editAdvisorEmail').value = advisor.email;
    document.getElementById('editAdvisorPhone').value = advisor.phone || '';
    document.getElementById('editAdvisorModal').classList.add('active');
}

function deleteAdvisor(id) {
    if (confirm('Berater wirklich löschen?')) {
        admin.deleteAdvisor(id);
        renderAdvisorsList();
        alert('✅ Berater gelöscht');
    }
}

document.getElementById('updateAdvisorBtn').addEventListener('click', () => {
    const name = document.getElementById('editAdvisorName').value.trim();
    const email = document.getElementById('editAdvisorEmail').value.trim();
    const phone = document.getElementById('editAdvisorPhone').value.trim();
    
    if (!name || !email) {
        alert('Bitte füllen Sie Name und E-Mail aus');
        return;
    }
    
    admin.updateAdvisor(admin.currentAdvisorEditId, name, email, phone);
    document.getElementById('editAdvisorModal').classList.remove('active');
    renderAdvisorsList();
    alert('✅ Berater aktualisiert');
});

// TIMESLOTS TAB
function loadTimeslots() {
    slotDurationInput.value = admin.config.slotDuration;
    workdayStartInput.value = admin.config.workdayStart;
    workdayEndInput.value = admin.config.workdayEnd;
    
    document.querySelectorAll('.weekdays-selector input').forEach(checkbox => {
        checkbox.checked = admin.config.workdays.includes(parseInt(checkbox.value));
    });
    
    updateSlotsPreview();
}

function updateSlotsPreview() {
    const slots = admin.generateTimeSlots();
    slotsPreview.innerHTML = slots.map(slot => `
        <div class="slot-item">${slot}</div>
    `).join('');
}

slotDurationInput.addEventListener('change', updateSlotsPreview);
workdayStartInput.addEventListener('change', updateSlotsPreview);
workdayEndInput.addEventListener('change', updateSlotsPreview);

saveTimeslotsBtn.addEventListener('click', () => {
    admin.config.slotDuration = parseInt(slotDurationInput.value);
    admin.config.workdayStart = workdayStartInput.value;
    admin.config.workdayEnd = workdayEndInput.value;
    
    const workdays = [];
    document.querySelectorAll('.weekdays-selector input:checked').forEach(checkbox => {
        workdays.push(parseInt(checkbox.value));
    });
    admin.config.workdays = workdays;
    
    admin.saveAllData();
    alert('✅ Zeitslots aktualisiert');
    updateSlotsPreview();
});

// APPOINTMENTS TAB
function loadAppointments() {
    renderAppointmentsList(admin.appointments);
}

function renderAppointmentsList(appointmentsToShow) {
    if (appointmentsToShow.length === 0) {
        appointmentsList.innerHTML = '<p class="empty-state">Keine Termine vorhanden</p>';
        return;
    }

    appointmentsList.innerHTML = appointmentsToShow.map(app => `
        <div class="appointment-card" onclick="showAppointmentDetails(${app.id})">
            <div class="appointment-card-header">
                <span class="appointment-card-title">${app.name}</span>
                <span class="appointment-card-status">✓ Gebucht</span>
            </div>
            <div class="appointment-card-details">
                <div class="appointment-detail-item">
                    <span class="appointment-detail-label">Datum</span>
                    <span class="appointment-detail-value">${new Date(app.date).toLocaleDateString('de-DE')}</span>
                </div>
                <div class="appointment-detail-item">
                    <span class="appointment-detail-label">Uhrzeit</span>
                    <span class="appointment-detail-value">${app.time}</span>
                </div>
                <div class="appointment-detail-item">
                    <span class="appointment-detail-label">Berater</span>
                    <span class="appointment-detail-value">${app.advisor?.name || 'Nicht zugewiesen'}</span>
                </div>
                <div class="appointment-detail-item">
                    <span class="appointment-detail-label">E-Mail</span>
                    <span class="appointment-detail-value">${app.email}</span>
                </div>
            </div>
        </div>
    `).join('');
}

appointmentFilter.addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = admin.appointments.filter(app => {
        return app.name.toLowerCase().includes(searchTerm) ||
               app.email.toLowerCase().includes(searchTerm) ||
               (app.advisor?.name || '').toLowerCase().includes(searchTerm);
    });
    renderAppointmentsList(filtered);
});

clearFilterBtn.addEventListener('click', () => {
    appointmentFilter.value = '';
    renderAppointmentsList(admin.appointments);
});

function showAppointmentDetails(appointmentId) {
    const appointment = admin.appointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const detailsDiv = document.getElementById('appointmentDetails');
    detailsDiv.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${appointment.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">E-Mail:</span>
            <span class="detail-value">${appointment.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Datum:</span>
            <span class="detail-value">${new Date(appointment.date).toLocaleDateString('de-DE')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Uhrzeit:</span>
            <span class="detail-value">${appointment.time}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Berater:</span>
            <span class="detail-value">${appointment.advisor?.name || 'Nicht zugewiesen'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Gebucht am:</span>
            <span class="detail-value">${new Date(appointment.bookedAt).toLocaleDateString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;
    
    document.getElementById('deleteAppointmentBtn').onclick = () => {
        if (confirm('Termin wirklich löschen?')) {
            admin.appointments = admin.appointments.filter(a => a.id !== appointmentId);
            admin.saveAllData();
            document.getElementById('appointmentModal').classList.remove('active');
            renderAppointmentsList(admin.appointments);
            alert('✅ Termin gelöscht');
        }
    };
    
    document.getElementById('appointmentModal').classList.add('active');
}

exportBtn.addEventListener('click', () => {
    const data = admin.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termin-buchung-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
});

// SETTINGS TAB
function loadSettings() {
    roundRobinEnabled.checked = admin.config.roundRobinEnabled;
    emailNotificationsEnabled.checked = admin.config.emailNotificationsEnabled;
    futureBookingsOnly.checked = admin.config.futureBookingsOnly;
    minDaysAdvanceInput.value = admin.config.minDaysAdvance;
    
    updateStatistics();
}

function updateStatistics() {
    const stats = admin.getStatistics();
    statisticsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalAppointments}</div>
            <div class="stat-label">Gesamt Termine</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalAdvisors}</div>
            <div class="stat-label">Aktive Berater</div>
        </div>
        <div class="stat-card alternate">
            <div class="stat-value">${stats.appointmentsThisWeek}</div>
            <div class="stat-label">Diese Woche</div>
        </div>
        <div class="stat-card alternate">
            <div class="stat-value">${stats.avgAppointmentsPerAdvisor}</div>
            <div class="stat-label">Ø pro Berater</div>
        </div>
    `;
}

saveSettingsBtn.addEventListener('click', () => {
    admin.config.roundRobinEnabled = roundRobinEnabled.checked;
    admin.config.emailNotificationsEnabled = emailNotificationsEnabled.checked;
    admin.config.futureBookingsOnly = futureBookingsOnly.checked;
    admin.config.minDaysAdvance = parseInt(minDaysAdvanceInput.value);
    admin.saveAllData();
    alert('✅ Einstellungen gespeichert');
});

backupBtn.addEventListener('click', () => {
    const data = admin.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `termin-buchung-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    alert('✅ Sicherung erstellt');
});

restoreBtn.addEventListener('click', () => {
    restoreFile.click();
});

restoreFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        if (admin.importData(event.target.result)) {
            alert('✅ Sicherung wiederhergestellt');
            location.reload();
        } else {
            alert('❌ Fehler beim Importieren der Sicherung');
        }
    };
    reader.readAsText(file);
});

clearDataBtn.addEventListener('click', () => {
    if (confirm('⚠️ WARNUNG: Alle Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden!') &&
        confirm('Sind Sie absolut sicher?')) {
        localStorage.clear();
        alert('✅ Alle Daten gelöscht');
        location.reload();
    }
});

// Modal close functionality
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('active');
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdvisors();
});