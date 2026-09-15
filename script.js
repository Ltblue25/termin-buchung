// State Management
let currentWeekStart = getMonday(new Date());
let selectedDateTime = null;
let bookedAppointments = JSON.parse(localStorage.getItem('bookedAppointments')) || [];
let systemConfig = JSON.parse(localStorage.getItem('systemConfig')) || getDefaultConfig();

function getDefaultConfig() {
    return {
        slotDuration: 20,
        workdayStart: '08:00',
        workdayEnd: '17:00',
        workdays: [1, 2, 3, 4, 5],
        roundRobinEnabled: true,
        futureBookingsOnly: true,
        minDaysAdvance: 0
    };
}

// Helper Functions
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
    const start = startDate.toLocaleDateString('de-DE', options);
    const end = endDate.toLocaleDateString('de-DE', options);
    
    return `${start} - ${end}`;
}

function getGermanWeekday(date) {
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return weekdays[date.getDay()];
}

function isSlotBooked(dateStr, timeSlot) {
    return bookedAppointments.some(
        app => app.date === dateStr && app.time === timeSlot
    );
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
    const start = systemConfig.workdayStart.split(':').map(Number);
    const end = systemConfig.workdayEnd.split(':').map(Number);
    
    let currentMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        currentMinutes += systemConfig.slotDuration;
    }
    
    return slots;
}

// Render Calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    const weekDays = getWeekDays(currentWeekStart);
    
    weekDays.forEach((day, index) => {
        // Skip days that are not in workdays
        if (!isWeekdayAvailable(day)) {
            return;
        }
        
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const dateStr = formatDate(day);
        const weekday = getGermanWeekday(day);
        const dayNum = day.getDate();
        
        dayColumn.innerHTML = `
            <div class="day-header">
                <span class="weekday">${weekday}</span>
                <span class="date">${dayNum}</span>
            </div>
            <div class="time-slots" id="slots-${dateStr}"></div>
        `;
        
        calendar.appendChild(dayColumn);
        
        // Add time slots
        const slotsContainer = document.getElementById(`slots-${dateStr}`);
        const timeSlots = generateTimeSlots();
        timeSlots.forEach(timeSlot => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = timeSlot;
            
            const isBooked = isSlotBooked(dateStr, timeSlot);
            const isPast = isSlotInPast(day, timeSlot);
            
            if (isBooked || isPast) {
                slot.classList.add('unavailable');
            } else {
                slot.addEventListener('click', () => selectDateTime(dateStr, timeSlot, slot));
            }
            
            slotsContainer.appendChild(slot);
        });
    });
    
    updateWeekDisplay();
}

function selectDateTime(dateStr, timeSlot, slotElement) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot
    slotElement.classList.add('selected');
    
    // Update state
    selectedDateTime = { date: dateStr, time: timeSlot };
    
    // Update UI
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('selectedDateTime').textContent = 
        `${dateFormatted} um ${timeSlot} Uhr`;
    
    document.getElementById('bookBtn').disabled = false;
}

function updateWeekDisplay() {
    const weekDisplay = document.getElementById('weekDisplay');
    weekDisplay.textContent = formatDateRange(currentWeekStart);
}

// Navigation
document.getElementById('prevWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    selectedDateTime = null;
    document.getElementById('selectedDateTime').textContent = 'Noch kein Termin ausgewählt';
    document.getElementById('bookBtn').disabled = true;
    renderCalendar();
});

document.getElementById('nextWeek').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    selectedDateTime = null;
    document.getElementById('selectedDateTime').textContent = 'Noch kein Termin ausgewählt';
    document.getElementById('bookBtn').disabled = true;
    renderCalendar();
});

// Booking Modal
const modal = document.getElementById('bookingModal');
const closeBtn = document.querySelector('.close');
const bookBtn = document.getElementById('bookBtn');
const confirmBtn = document.getElementById('confirmBtn');

bookBtn.addEventListener('click', () => {
    if (selectedDateTime) {
        const date = new Date(selectedDateTime.date);
        const dateFormatted = date.toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('confirmText').textContent = 
            `Bestätigen Sie Ihren Termin am ${dateFormatted} um ${selectedDateTime.time} Uhr`;
        modal.classList.add('active');
    }
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});

confirmBtn.addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    
    if (!name || !email) {
        alert('Bitte füllen Sie alle Felder aus');
        return;
    }
    
    // Get advisor using Round-Robin from admin system
    const advisors = JSON.parse(localStorage.getItem('advisors')) || [];
    let advisor = null;
    
    if (advisors.length > 0 && systemConfig.roundRobinEnabled) {
        const lastIndex = JSON.parse(localStorage.getItem('systemConfig') || '{}').lastRoundRobinIndex || 0;
        const nextIndex = lastIndex % advisors.length;
        advisor = advisors[nextIndex];
        
        // Update index
        const config = JSON.parse(localStorage.getItem('systemConfig') || '{}');
        config.lastRoundRobinIndex = (nextIndex + 1) % advisors.length;
        localStorage.setItem('systemConfig', JSON.stringify(config));
    }
    
    // Save booking
    const appointment = {
        id: Date.now(),
        date: selectedDateTime.date,
        time: selectedDateTime.time,
        name: name,
        email: email,
        advisor: advisor,
        bookedAt: new Date().toISOString()
    };
    
    bookedAppointments.push(appointment);
    localStorage.setItem('bookedAppointments', JSON.stringify(bookedAppointments));
    
    // Show success message
    const advisorName = advisor ? ` mit ${advisor.name}` : '';
    alert(`✅ Termin erfolgreich gebucht!\n\nBestätigung wurde an ${email} gesendet.${advisorName ? '\n' + advisorName : ''}`);
    
    // Reset form
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    modal.classList.remove('active');
    
    // Reset selection
    selectedDateTime = null;
    document.getElementById('selectedDateTime').textContent = 'Noch kein Termin ausgewählt';
    document.getElementById('bookBtn').disabled = true;
    
    // Refresh calendar
    renderCalendar();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    systemConfig = JSON.parse(localStorage.getItem('systemConfig')) || getDefaultConfig();
    renderCalendar();
});