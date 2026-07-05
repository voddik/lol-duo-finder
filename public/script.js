JavaScript
let loggedInUser = null;
window.onload = () => { checkRiotLogin(); fetchPlayersFromServer(); };

function checkRiotLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (urlParams.get('login') === 'success' && username) {
        loggedInUser = { name: username, rank: "Doğrulanıyor..." };
        document.getElementById("nav-auth").innerHTML = `<span style="color:#fff;">Hoş geldin, ${loggedInUser.name}</span>`;
        document.getElementById("quick-ad-section").style.display = "block";
        document.getElementById("user-display-name").innerText = loggedInUser.name;
        window.history.replaceState({}, document.title, "/");
    }
}
function loginWithRiot() { window.location.href = '/auth/riot'; }

async function fetchPlayersFromServer() {
    try {
        const response = await fetch('/api/players');
        const players = await response.json();
        displayPlayers(players);
    } catch (e) { console.log("Hata:", e); }
}
function displayPlayers(data) {
    const list = document.getElementById("player-list");
    list.innerHTML = "";
    data.forEach(p => {
        list.innerHTML += `
            <div class="card">
                <div class="card-user">${p.name}</div>
                <div class="badges"><span class="badge rank">${p.rank}</span><span class="badge role">${p.role}</span></div>
                <div class="card-note">${p.note}</div>
                <a href="#" class="btn-discord">Discord: ${p.discord}</a>
            </div>`;
    });
}
async function submitQuickAd() {
    if(!loggedInUser) return;
    const newAd = {
        name: loggedInUser.name, rank: "Gold", role: document.getElementById("ad-role").value,
        note: document.getElementById("ad-note").value || "Duo aranıyor.", discord: document.getElementById("ad-discord").value || "Yok"
    };
    try {
        await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAd) });
        document.getElementById("ad-note").value = "";
        fetchPlayersFromServer();
    } catch (e) { console.log(e); }
}