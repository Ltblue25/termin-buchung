// Calendar range administration and Excel export.
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
        const start = document.getElementById('calendarStartDate');
        const end = document.getElementById('calendarEndDate');
        if (start) start.value = config.calendarStartDate || '';
        if (end) end.value = config.calendarEndDate || '';
    }

    // Creates a real Excel-readable .xls file without requiring an external library.
    function escapeXml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function formatAppointmentDate(date) {
        if (!date) return '';
        const parsed = new Date(`${date}T00:00:00`);
        return Number.isNaN(parsed.getTime())
            ? date
            : parsed.toLocaleDateString('de-DE');
    }

    function exportAppointmentsToExcel() {
        let appointments = [];
        try {
            appointments = JSON.parse(localStorage.getItem('bookedAppointments')) || [];
        } catch (error) {
            appointments = [];
        }

        const rows = [
            ['ID', 'Datum', 'Uhrzeit', 'Name', 'E-Mail', 'Telefon', 'Berater', 'Berater-E-Mail', 'Gebucht am']
        ];

        appointments.forEach(appointment => {
            rows.push([
                appointment.id,
                formatAppointmentDate(appointment.date),
                appointment.time || '',
                appointment.name || '',
                appointment.email || '',
                appointment.phone || '',
                appointment.advisor?.name || 'Nicht zugewiesen',
                appointment.advisor?.email || '',
                appointment.bookedAt
                    ? new Date(appointment.bookedAt).toLocaleString('de-DE')
                    : ''
            ]);
        });

        const worksheetRows = rows.map(row =>
            `<Row>${row.map(value => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join('')}</Row>`
        ).join('');

        const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Termine">
  <Table>${worksheetRows}</Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `termine-${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const start = document.getElementById('calendarStartDate');
        const end = document.getElementById('calendarEndDate');
        const saveButton = document.getElementById('saveCalendarRangeBtn');
        if (start && end && saveButton) {
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
        }
    });

    // This file loads after admin.js. Capture the click and replace the old JSON export.
    document.addEventListener('DOMContentLoaded', () => {
        const exportButton = document.getElementById('exportBtn');
        if (!exportButton) return;
        exportButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            exportAppointmentsToExcel();
        }, true);
    });
})();
