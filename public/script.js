JavaScript
const socket = io();

// HTML Elemanları
const createLobbyBtn = document.getElementById('createLobbyBtn');
const lobbiesContainer = document.getElementById('lobbiesContainer');
const usernameInput = document.getElementById('usernameInput');

// Sayfa ilk açıldığında rastgele bir isim ata (Test kolaylığı için)
if(usernameInput.value === "Oyuncu_") {
    usernameInput.value = "Oyuncu_" + Math.floor(Math.random() * 9000 + 1000);
}

// 1. ODA OLUŞTURMA TETİKLEYİCİSİ
createLobbyBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const gameType = document.getElementById('gameType').value;
    const targetRank = document.getElementById('targetRank').value;
    const targetRole = document.getElementById('targetRole').value;

    if(!username) {
        alert("Lütfen önce bir kullanıcı adı girin!");
        return;
    }

    // Sunucuya lobi oluşturma mesajı gönder
    socket.emit('createLobby', { username, gameType, targetRank, targetRole });
});

// 2. SUNUCUDAN CANLI LOBİ GÜNCELLEMELERİNİ ALMA
socket.on('updateLobbies', (lobbies) => {
    renderLobbies(lobbies);
});

// Sayfa yüklendiğinde mevcut odaları API'den çek
fetch('/api/lobbies')
    .then(res => res.json())
    .then(lobbies => renderLobbies(lobbies));

function renderLobbies(lobbies) {
    lobbiesContainer.innerHTML = "";
    
    if(lobbies.length === 0) {
        lobbiesContainer.innerHTML = `<p style="color: #888; grid-column: 1/-1;">Henüz aktif oda yok, ilk odayı sen kur!</p>`;
        return;
    }

    lobbies.forEach(lobby => {
        const lobbyCard = document.createElement('div');
        lobbyCard.className = 'lobby-card';
        
        lobbyCard.innerHTML = `
            <div class="lobby-header">
                <span class="badge">${lobby.gameType}</span>
                <span class="specs">${lobby.targetRank} - ${lobby.targetRole}</span>
            </div>
            <div class="lobby-body">
                <p><strong>Kurucu:</strong> ${lobby.creator}</p>
                <p><strong>Üyeler (${lobby.players.length}/5):</strong> ${lobby.players.join(', ')}</p>
            </div>
            <div class="lobby-actions">
                <button onclick="joinLobby('${lobby._id}')" class="join-btn" ${lobby.players.length >= 5 ? 'disabled' : ''}>
                    ${lobby.players.length >= 5 ? 'Dolu' : 'Lobiye Katıl'}
                </button>
                <button onclick="invitePlayer('${lobby._id}', '${lobby.creator}')" class="invite-btn">Davet At</button>
            </div>
        `;
        lobbiesContainer.appendChild(lobbyCard);
    });
}

// LOBİYE KATILMA FONKSİYONU
window.joinLobby = function(lobbyId) {
    const username = usernameInput.value.trim();
    socket.emit('joinLobby', { lobbyId, username });
};

// DAVET ETME SİMÜLASYONU
window.invitePlayer = function(lobbyId, creator) {
    const username = usernameInput.value.trim();
    alert(`${creator} isimli oyuncuya davet isteği gönderildi!`);
    socket.emit('sendInvite', { from: username, to: creator, lobbyId });
};

// CANLI DAVET ALMA BİLDİRİMİ
socket.on('receiveInvite', (data) => {
    const myUsername = usernameInput.value.trim();
    if (data.to === myUsername && data.from !== myUsername) {
        const notifBox = document.getElementById('inviteNotification');
        document.getElementById('inviteText').innerText = `${data.from} seni lobisine davet ediyor!`;
        notifBox.classList.remove('hidden');
        
        document.getElementById('acceptInviteBtn').onclick = function() {
            joinLobby(data.lobbyId);
            notifBox.classList.add('hidden');
        };
        
        // 10 saniye sonra bildirimi gizle
        setTimeout(() => notifBox.classList.add('hidden'), 10000);
