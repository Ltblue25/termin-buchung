// Calendar range administration. The main admin logic remains in admin.js.
(function () {
    const defaults = { calendarStartDate: '', calendarEndDate: '' };

    function readConfig() {
        try {
            return { ...defaults, ...(JSON.parse(localStorage.getItem('systemConfig')) || {}) };
        } catch (error) {
            return { ...defaults };
        }
    }

    function saveConfig(config) {
        localStorage.setItem('systemConfig', JSON.stringify(config));
    }

    function loadFields() {
        const config = readConfig();
        document.getElementById('calendarStartDate').value = config.calendarStartDate || '';
        document.getElementById('calendarEndDate').value = config.calendarEndDate || '';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const start = document.getElementById('calendarStartDate');
        const end = document.getElementById('calendarEndDate');
        const saveButton = document.getElementById('saveCalendarRangeBtn');
        if (!start || !end || !saveButton) return;

        loadFields();
        saveButton.addEventListener('click', () => {
            if (start.value && end.value && start.value > end.value) {
                alert('Das Startdatum darf nicht nach dem Enddatum liegen.');
                return;
            }
            const config = readConfig();
            config.calendarStartDate = start.value;
            config.calendarEndDate = end.value;
            saveConfig(config);
            alert('✅ Kalenderzeitraum gespeichert.');
        });
    });
})();
