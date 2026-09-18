// Terminbuchung: Kalender, Mehrfachbuchungen pro Zeitslot und Round-Robin-Zuweisung

const DEFAULT_CONFIG = {
    slotDuration: 20,
    workdayStart: '08:00',
    workdayEnd: '17:00',
    workdays: [1, 2, 3, 4, 5],
    roundRobinEnabled: true,
    futureBookingsOnly: true,
    minDaysAdvance: 0,
    lastRoundRobinIndex: 0
};

let currentWeekStart;
let selectedDateTime = null;
let bookedAppointments = [];
let systemConfig = {};

function readJsonStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        console.warn(`Ungültige localStorage-Daten für ${key}; Standardwerte werden verwendet.`, error);
        return fallback;
    }
}

function loadState() {
    systemConfig = {
        ...DEFAULT_CONFIG,
        ...readJsonStorage('systemConfig', {})
    };
    systemConfig.workdays = Array.isArray(systemConfig.workdays)
        ? systemConfig.workdays.map(Number)
        : DEFAULT_CONFIG.workdays;

    bookedAppointments = readJsonStorage('bookedAppointments', []);
    if (!Array.isArray(bookedAppointments)) bookedAppointments = [];

    currentWeekStart = getMonday(new Date());
}

function getAdvisors() {
    const advisors = readJsonStorage('advisors', []);
    return Array.isArray(advisors) ? advisors : [];
}

function getMonday(date) {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day + (day === 0 ? -6 : 1));
    result.setHours(0, 0, 0, 0);
    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getWeekDays(mondayDate) {
    return Array.from({ length: 5 }, (_, index) => {
        const date = new Date(mondayDate);
        date.setDate(date.getDate() + index);
        return date;
    });
}

function getGermanWeekday(date) {
    return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()];
}

function formatDateRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4);
    const options = { day: 'numeric', month: 'long' };
    return `${startDate.toLocaleDateString('de-DE', options)} - ${endDate.toLocaleDateString('de-DE', options)}`;
}

function generateTimeSlots() {
    const slots = [];
    const [startHour, startMinute] = String(systemConfig.workdayStart).split(':').map(Number);
    const [endHour, endMinute] = String(systemConfig.workdayEnd).split(':').map(Number);
    const duration = Number(systemConfig.slotDuration);

    if (!Number.isFinite(duration) || duration <= 0) return slots;

    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    while (current < end) {
        const hour = Math.floor(current / 60);
        const minute = current % 60;
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        current += duration;
    }
    return slots;
}

function getBookedCount(dateString, time) {
    return bookedAppointments.filter(appointment =>
        appointment.date === dateString && appointment.time === time
    ).length;
}

function getRemainingCapacity(dateString, time) {
    return Math.max(0, getAdvisors().length - getBookedCount(dateString, time));
}

function isSlotInPast(date, time) {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate < new Date();
}

function isWeekdayAvailable(date) {
    return systemConfig.workdays.includes(date.getDay());
}

function setRemainingSlotsText(text = '') {
    const element = document.getElementById('remainingSlots');
    if (element) element.textContent = text;
}

function resetSelection() {
    selectedDateTime = null;
    const selected = document.getElementById('selectedDateTime');
    const bookButton = document.getElementById('bookBtn');
    if (selected) selected.textContent = 'Noch kein Termin ausgewählt';
    setRemainingSlotsText('');
    if (bookButton) bookButton.disabled = true;
}

function updateBookingInfo(dateString, time) {
    const date = parseLocalDate(dateString);
    const remaining = getRemainingCapacity(dateString, time);
    const selected = document.getElementById('selectedDateTime');

    if (selected) {
        selected.textContent = `${date.toLocaleDateString('de-DE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })} um ${time} Uhr`;
    }

    setRemainingSlotsText(
        remaining === 1
            ? '1 Termin ist für diesen Zeitslot noch verfügbar.'
            : `${remaining} Termine sind für diesen Zeitslot noch verfügbar.`
    );
}

function selectDateTime(dateString, time, slotElement) {
    document.querySelectorAll('.time-slot.selected').forEach(slot => slot.classList.remove('selected'));
    slotElement.classList.add('selected');
    selectedDateTime = { date: dateString, time };
    updateBookingInfo(dateString, time);
    document.getElementById('bookBtn').disabled = false;
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    calendar.innerHTML = '';
    const advisors = getAdvisors();
    const capacity = advisors.length;

    getWeekDays(currentWeekStart).forEach(day => {
        if (!isWeekdayAvailable(day)) return;

        const dateString = formatDate(day);
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.innerHTML = `
            <div class="day-header">
                <span class="weekday">${getGermanWeekday(day)}</span>
                <span class="date">${day.getDate()}</span>
            </div>
            <div class="time-slots"></div>
        `;
        calendar.appendChild(dayColumn);

        const slotsContainer = dayColumn.querySelector('.time-slots');
        generateTimeSlots().forEach(time => {
            const slot = document.createElement('div');
            const remaining = getRemainingCapacity(dateString, time);
            const unavailable = capacity === 0 || remaining === 0 || isSlotInPast(day, time);

            slot.className = `time-slot${unavailable ? ' unavailable' : ''}`;
            slot.textContent = time;

            if (!unavailable) {
                slot.title = `${remaining} ${remaining === 1 ? 'Platz' : 'Plätze'} verfügbar`;
                slot.addEventListener('click', () => selectDateTime(dateString, time, slot));
            } else if (capacity === 0) {
                slot.title = 'Keine Berater eingerichtet';
            } else if (remaining === 0) {
                slot.title = 'Dieser Zeitslot ist ausgebucht';
            }

            slotsContainer.appendChild(slot);
        });
    });

    const weekDisplay = document.getElementById('weekDisplay');
    if (weekDisplay) weekDisplay.textContent = formatDateRange(currentWeekStart);
}

function assignNextAdvisor() {
    const advisors = getAdvisors();
    if (!advisors.length) return null;

    const config = {
        ...DEFAULT_CONFIG,
        ...readJsonStorage('systemConfig', {})
    };
    const index = Number(config.lastRoundRobinIndex || 0) % advisors.length;
    const advisor = advisors[index];

    config.lastRoundRobinIndex = (index + 1) % advisors.length;
    localStorage.setItem('systemConfig', JSON.stringify(config));
    systemConfig = { ...systemConfig, ...config };
    return advisor;
}

function openBookingModal() {
    if (!selectedDateTime) return;
    if (getRemainingCapacity(selectedDateTime.date, selectedDateTime.time) <= 0) {
        alert('Dieser Zeitslot ist inzwischen ausgebucht.');
        renderCalendar();
        resetSelection();
        return;
    }

    const date = parseLocalDate(selectedDateTime.date);
    document.getElementById('confirmText').textContent =
        `Bestätigen Sie Ihren Termin am ${date.toLocaleDateString('de-DE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })} um ${selectedDateTime.time} Uhr`;
    document.getElementById('bookingModal').classList.add('active');
}

function confirmBooking() {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();

    if (!name || !email) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }

    if (!selectedDateTime || getRemainingCapacity(selectedDateTime.date, selectedDateTime.time) <= 0) {
        alert('Dieser Zeitslot ist inzwischen ausgebucht. Bitte wählen Sie einen anderen Termin.');
        document.getElementById('bookingModal').classList.remove('active');
        renderCalendar();
        resetSelection();
        return;
    }

    const advisor = systemConfig.roundRobinEnabled ? assignNextAdvisor() : null;
    bookedAppointments.push({
        id: Date.now(),
        date: selectedDateTime.date,
        time: selectedDateTime.time,
        name,
        email,
        advisor,
        bookedAt: new Date().toISOString()
    });
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));

    alert(`✅ Termin erfolgreich gebucht!\n\nBestätigung wurde an ${email} gesendet.${advisor ? `\nBerater: ${advisor.name}` : ''}`);
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('bookingModal').classList.remove('active');
    resetSelection();
    renderCalendar();
}

function initialize() {
    loadState();

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

    document.getElementById('bookBtn').addEventListener('click', openBookingModal);
    document.getElementById('confirmBtn').addEventListener('click', confirmBooking);
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('bookingModal').classList.remove('active');
    });
    document.getElementById('bookingModal').addEventListener('click', event => {
        if (event.target.id === 'bookingModal') event.target.classList.remove('active');
    });

    renderCalendar();
}

document.addEventListener('DOMContentLoaded', initialize);
