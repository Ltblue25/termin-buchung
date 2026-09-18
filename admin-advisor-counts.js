// Synchronisiert die angezeigten Terminzähler mit den tatsächlich gespeicherten Buchungen.
(function () {
    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function advisorMatchesBooking(advisor, booking) {
        const assigned = booking && booking.advisor;
        if (!assigned) return false;

        // Neue Buchungen enthalten die stabile ID. Die Fallbacks unterstützen
        // bereits vorhandene Buchungen mit Name oder E-Mail.
        if (assigned.id != null && advisor.id != null) {
            return String(assigned.id) === String(advisor.id);
        }
        return assigned.email === advisor.email || assigned.name === advisor.name;
    }

    function refreshAdvisorCounts() {
        const list = document.getElementById('advisorsList');
        if (!list) return;

        const advisors = readArray('advisors');
        const appointments = readArray('bookedAppointments');

        if (advisors.length === 0) {
            list.innerHTML = '<p class="empty-state">Keine Berater vorhanden</p>';
            return;
        }

        list.innerHTML = advisors.map(advisor => {
            const count = appointments.filter(booking => advisorMatchesBooking(advisor, booking)).length;
            const appointmentLabel = count === 1 ? 'Termin' : 'Termine';
            const phone = advisor.phone
                ? `<div class="item-card-detail">📞 ${advisor.phone}</div>`
                : '';

            return `
                <div class="item-card">
                    <div class="item-card-info">
                        <div class="item-card-name">${advisor.name}</div>
                        <div class="item-card-detail">📧 ${advisor.email}</div>
                        ${phone}
                        <div class="item-card-detail">📋 ${count} ${appointmentLabel}</div>
                    </div>
                    <div class="item-card-actions">
                        <button class="btn-small btn-small-edit" onclick="editAdvisor(${advisor.id})">✏️ Bearbeiten</button>
                        <button class="btn-small btn-small-delete" onclick="deleteAdvisor(${advisor.id})">🗑️ Löschen</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // admin.js rendert zunächst seine Liste. Danach überschreiben wir nur die
    // Darstellung der Zähler, ohne die bestehende Admin-Logik zu verändern.
    document.addEventListener('DOMContentLoaded', refreshAdvisorCounts);
})();
