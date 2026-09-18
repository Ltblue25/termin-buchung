// Keep advisor appointment totals synchronized with the actual bookings.
(function () {
    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function getAppointmentCount(advisor, appointments) {
        return appointments.filter(appointment => {
            const assigned = appointment.advisor;
            if (!assigned) return false;

            // Prefer the stable advisor ID. The fallbacks also support older bookings.
            if (assigned.id !== undefined && advisor.id !== undefined) {
                return String(assigned.id) === String(advisor.id);
            }
            return assigned.email === advisor.email || assigned.name === advisor.name;
        }).length;
    }

    function renderAdvisorsWithCurrentCounts() {
        if (!window.admin || !window.advisorsList) return;

        const advisors = window.admin.advisors || [];
        const appointments = readArray('bookedAppointments');

        if (!advisors.length) {
            window.advisorsList.innerHTML = '<p class="empty-state">Keine Berater vorhanden</p>';
            return;
        }

        window.advisorsList.innerHTML = advisors.map(advisor => {
            const count = getAppointmentCount(advisor, appointments);
            const phone = advisor.phone
                ? `<div class="item-card-detail">📞 ${advisor.phone}</div>`
                : '';

            return `
                <div class="item-card">
                    <div class="item-card-info">
                        <div class="item-card-name">${advisor.name}</div>
                        <div class="item-card-detail">📧 ${advisor.email}</div>
                        ${phone}
                        <div class="item-card-detail">📋 ${count} ${count === 1 ? 'Termin' : 'Termine'}</div>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn-small btn-small-edit" onclick="editAdvisor(${advisor.id})">✏️ Bearbeiten</button>
                        <button class="btn-small btn-small-delete" onclick="deleteAdvisor(${advisor.id})">🗑️ Löschen</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', () => {
        // admin.js registers its initialization listener first. This replaces the
        // renderer before that listener executes.
        if (window.admin && window.advisorsList) {
            window.renderAdvisorsList = renderAdvisorsWithCurrentCounts;
            renderAdvisorsWithCurrentCounts();
        }
    });
})();
