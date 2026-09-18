// State Management
let currentWeekStart = getMonday(new Date());
let selectedDateTime = null;
let bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || [];
let systemConfig = { ...getDefaultConfig(), ...(JSON.parse(localStorage.getItem('systemConfig')) || {}) };

function getDefaultConfig() {
    return {
        slotDuration: 20,
        workdayStart: '08:00',
        workdayEnd: '17:00',
        workdays: [1, 2, 3, 4, 5],
        roundRobinEnabled: true,
        futureBookingsOnly: true,
        minDaysAdvance: 0,
        lastRoundRobinIndex: 0
    };
}

function getAdvisors() {
    return JSON.parse(localStorage.getItem('advisors')) || [];
}

function getSlotCapacity() {
    return getAdvisors().length;
}

function getBookedCount(dateStr, timeSlot) {
    return bookedAppointments.filter(app => app.date === dateStr && app.time === timeSlot).length;
}

function getRemainingCapacity(dateStr, timeSlot) {
    return Math.max(0, getSlotCapacity() - getBookedCount(dateStr, timeSlot));
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getWeekDays(mondayDate) {
    const days = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date(mondayDate);
        date.setDate(date.getDate() + i);
        days.push(date);
    }
    return days;
}

function formatDateRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4);
    const options = { day: 'numeric', month: 'long' };
    return `${startDate.toLocaleDateString('de-DE', options)} - ${endDate.toLocaleDateString('de-DE', options)}`;
}

function getGermanWeekday(date) {
    return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
}

function isSlotInPast(date, timeSlot) {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < new Date();
}

function isWeekdayAvailable(date) {
    return systemConfig.workdays.includes(date.getDay());
}

function generateTimeSlots() {
    const slots = [];
    const [startHours, startMinutes] = systemConfig.workdayStart.split(':').map(Number);
    const [endHours, endMinutes] = systemConfig.workdayEnd.split(':').map(Number);
    let currentMinutes = startHours * 60 + startMinutes;
    const endMinutes = endHours * 60 + endMinutes;

    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        currentMinutes += systemConfig.slotDuration;
    }
    return slots;
}

function updateBookingInfo(dateStr, timeSlot) {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('de-DE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const remaining = getRemainingCapacity(dateStr, timeSlot);
    document.getElementById('selectedDateTime').textContent =
        `${dateFormatted} um ${timeSlot} Uhr`;
    document.getElementById('remainingSlots').textContent =
        `${remaining} ${remaining === 1 ? 'Termin ist' : 'Termine sind'} für diesen Zeitslot noch verfügbar.`;
}

function resetSelection() {
    selectedDateTime = null;
    document.getElementById('selectedDateTime').textContent = 'Noch kein Termin ausgewählt';
    document.getElementById('remainingSlots').textContent = '';
    document.getElementById('bookBtn').disabled = true;
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const capacity = getSlotCapacity();

    getWeekDays(currentWeekStart).forEach(day => {
        if (!isWeekdayAvailable(day)) return;
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        const dateStr = formatDate(day);
        dayColumn.innerHTML = `
            <div class="day-header">
                <span class="weekday">${getGermanWeekday(day)}</span>
                <span class="date">${day.getDate()}</span>
            </div>
            <div class="time-slots" id="slots-${dateStr}"></div>`;
        calendar.appendChild(dayColumn);

        const slotsContainer = document.getElementById(`slots-${dateStr}`);
        generateTimeSlots().forEach(timeSlot => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = timeSlot;
            const remaining = getRemainingCapacity(dateStr, timeSlot);
            const unavailable = capacity === 0 || remaining === 0 || isSlotInPast(day, timeSlot);

            if (unavailable) {
                slot.classList.add('unavailable');
                slot.title = capacity === 0 ? 'Keine Berater verfügbar' : 'Dieser Zeitslot ist ausgebucht';
            } else {
                slot.title = `${remaining} ${remaining === 1 ? 'Platz' : 'Plätze'} verfügbar`;
                slot.addEventListener('click', () => selectDateTime(dateStr, timeSlot, slot));
            }
            slotsContainer.appendChild(slot);
        });
    });
    document.getElementById('weekDisplay').textContent = formatDateRange(currentWeekStart);
}

function selectDateTime(dateStr, timeSlot, slotElement) {
    document.querySelectorAll('.time-slot.selected').forEach(slot => slot.classList.remove('selected'));
    slotElement.classList.add('selected');
    selectedDateTime = { date: dateStr, time: timeSlot };
    updateBookingInfo(dateStr, timeSlot);
    document.getElementById('bookBtn').disabled = false;
}

function assignNextAdvisor() {
    const advisors = getAdvisors();
    if (!advisors.length || !systemConfig.roundRobinEnabled) return null;
    const storedConfig = { ...getDefaultConfig(), ...(JSON.parse(localStorage.getItem('systemConfig')) || {}) };
    const index = storedConfig.lastRoundRobinIndex % advisors.length;
    const advisor = advisors[index];
    storedConfig.lastRoundRobinIndex = (index + 1) % advisors.length;
    localStorage.setItem('systemConfig', JSON.stringify(storedConfig));
    return advisor;
}

document.getElementById('prevWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    resetSelection();
    renderCalendar();
});

document.getElementById('nextWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    resetSelection();
    renderCalendar();
});

const modal = document.getElementById('bookingModal');
document.getElementById('bookBtn').addEventListener('click', () => {
    if (!selectedDateTime) return;
    const date = new Date(selectedDateTime.date);
    document.getElementById('confirmText').textContent =
        `Bestätigen Sie Ihren Termin am ${date.toLocaleDateString('de-DE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })} um ${selectedDateTime.time} Uhr`;
    modal.classList.add('active');
});

document.querySelector('.close').addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.remove('active');
});

document.getElementById('confirmBtn').addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    if (!name || !email) {
        alert('Bitte füllen Sie alle Felder aus');
        return;
    }
    if (!selectedDateTime || getRemainingCapacity(selectedDateTime.date, selectedDateTime.time) <= 0) {
        alert('Dieser Zeitslot ist inzwischen ausgebucht. Bitte wählen Sie einen anderen Termin.');
        modal.classList.remove('active');
        renderCalendar();
        resetSelection();
        return;
    }

    const advisor = assignNextAdvisor();
    const appointment = {
        id: Date.now(), date: selectedDateTime.date, time: selectedDateTime.time,
        name, email, advisor, bookedAt: new Date().toISOString()
    };
    bookedAppointments.push(appointment);
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));

    alert(`✅ Termin erfolgreich gebucht!\n\nBestätigung wurde an ${email} gesendet.${advisor ? `\nBerater: ${advisor.name}` : ''}`);
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    modal.classList.remove('active');
    resetSelection();
    renderCalendar();
});

document.addEventListener('DOMContentLoaded', () => {
    systemConfig = { ...getDefaultConfig(), ...(JSON.parse(localStorage.getItem('systemConfig')) || {}) };
    renderCalendar();
});
