const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// MONGOOSE VERİTABANI BAĞLANTISI
// Lütfen BURAYA_KENDI_SIFRENI_YAZ kısmını kendi şifrenle değiştir
const mongoURI = "mongodb+srv://voddik:BURAYA_KENDI_SIFRENI_YAZ@cluster0.qfmerp6.mongodb.net/lolduo?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Atlas Bağlantısı Başarılı."))
    .catch(err => console.error("Veritabanı bağlantı hatası:", err));

// Lobi Modeli (Veritabanında Odaları Tutmak İçin)
const LobbySchema = new mongoose.Schema({
    creator: String,
    gameType: String,
    targetRank: String,
    targetRole: String,
    players: [String], // Lobiye katılanların listesi
    createdAt: { type: Date, default: Date.now }
});
const Lobby = mongoose.model('Lobby', LobbySchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API: Mevcut Lobileri Çekme
app.get('/api/lobbies', async (req, res) => {
    try {
        const lobbies = await Lobby.find().sort({ createdAt: -1 });
        res.json(lobbies);
    } catch (err) {
        res.status(500).json({ error: "Lobiler çekilemedi" });
    }
});

// CANLI BAĞLANTI (SOCKET.IO) ODALARI VE DAVETLERİ
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // Yeni Oda Kurulduğunda
    socket.on('createLobby', async (data) => {
        try {
            const newLobby = new Lobby({
                creator: data.username,
                gameType: data.gameType,
                targetRank: data.targetRank,
                targetRole: data.targetRole,
                players: [data.username]
            });
            await newLobby.save();
            
            // Tüm herkese yeni lobiyi bildir
            const allLobbies = await Lobby.find().sort({ createdAt: -1 });
            io.emit('updateLobbies', allLobbies);
        } catch (err) {
            console.error(err);
        }
    });

    // Bir Lobiye Katılma İsteği
    socket.on('joinLobby', async (data) => {
        try {
            const lobby = await Lobby.findById(data.lobbyId);
            if (lobby && !lobby.players.includes(data.username) && lobby.players.length < 5) {
                lobby.players.push(data.username);
                await lobby.save();
                
                const allLobbies = await Lobby.find().sort({ createdAt: -1 });
                io.emit('updateLobbies', allLobbies);
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Boştaki Oyuncuya Davet Atma Simülasyonu
    socket.on('sendInvite', (data) => {
        // Hedef oyuncuya canlı bildirim yollar
        io.emit('receiveInvite', {
            from: data.from,
            to: data.to,
            lobbyId: data.lobbyId
        });
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
