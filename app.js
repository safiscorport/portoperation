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
        let data = await res.json();
        // Live data injected here without page refresh
        console.log("Live JSON data parsed:", data);
    } catch (err) {
        console.error("Polling error:", err);
    }
}

fetchLiveMetrics();
setInterval(fetchLiveMetrics, 10000); // Poll every 10 seconds
