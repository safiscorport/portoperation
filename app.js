let currentScreen = 1;

function rotateScreens() {
    const screen1 = document.getElementById('screen-1');
    const screen2 = document.getElementById('screen-2');
    if (currentScreen === 1) {
        screen1.classList.remove('active');
        screen2.classList.add('active');
        currentScreen = 2;
        setTimeout(rotateScreens, 120000); // 2 mins for Screen 2
    } else {
        screen2.classList.remove('active');
        screen1.classList.add('active');
        currentScreen = 1;
        setTimeout(rotateScreens, 300000); // 5 mins for Screen 1
    }
}
setTimeout(rotateScreens, 300000);

async function fetchLiveMetrics() {
    try {
        let res = await fetch('data.json?' + new Date().getTime());
        if (!res.ok) return;
        let jsonData = await res.json();
        
        // Get the first sheet name or key dynamically from the Excel workbook export
        let sheetNames = Object.keys(jsonData);
        if (sheetNames.length === 0) return;
        
        let mainSheetData = jsonData[sheetNames[0]] || [];
        let berthsTbody = document.getElementById('berths-tbody');
        berthsTbody.innerHTML = '';

        mainSheetData.forEach(row => {
            let tr = document.createElement('tr');
            let isVacant = String(row['Vessel'] || '').toUpperCase().includes('VACANT');
            if (isVacant) tr.className = 'row-vacant';

            let progressVal = row['Progress'] || 0;
            let progressPercent = typeof progressVal === 'number' ? Math.round(progressVal * 100) : parseInt(progressVal) || 0;

            tr.innerHTML = `
                <td>${row['Berth'] || '-'}</td>
                <td>${isVacant ? '<span class="vacant-text">VACANT</span>' : (row['Vessel'] || '-')}</td>
                <td>${row['Voyage #'] || '-'}</td>
                <td>${row['Booking'] || '-'}</td>
                <td>${row['Dispatch'] || '-'}</td>
                <td>${row['Loaded'] || '-'}</td>
                <td>${row['Balance'] || '-'}</td>
                <td>${isVacant ? '-' : `<div style="display: flex; align-items: center; gap: 8px;"><span style="width: 35px; text-align: right; font-size: 12px;">${progressPercent}%</span><div class="progress-container"><div class="progress-bar-fill" style="width: ${progressPercent}%;"></div></div></div>`}</td>
                <td>${row['Stockpile'] || '-'}</td>
                <td>${row['Time'] || '-'}</td>
                <td>${row['Remarks'] || '-'}</td>
                <td>${row['Equip.'] || '0'}</td>
                <td>${row['Act Time'] || '0:00'}</td>
            `;
            berthsTbody.appendChild(tr);
        });

        document.getElementById('totals-bar').innerHTML = `TOTALS &nbsp;|&nbsp; Live Data Synced Successfully (${new Date().toLocaleTimeString()})`;

    } catch (err) {
        console.error("Polling error:", err);
    }
}

fetchLiveMetrics();
setInterval(fetchLiveMetrics, 10000);
