const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Not: Alttaki bağlantı Render ortamında geçicidir, sistemi ayağa kaldırmak için ekledik.
mongoose.connect('mongodb://localhost:27017/lolduo')
    .then(() => console.log('MongoDB Bağlantısı Başarılı.'))
    .catch(err => console.error('Bağlantı hatası:', err));

const PlayerSchema = new mongoose.Schema({
    name: String, rank: String, role: String, note: String, discord: String,
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});
const Player = mongoose.model('Player', PlayerSchema);

const RIOT_CLIENT_ID = 'SENIN_RIOT_CLIENT_ID';
const RIOT_CLIENT_SECRET = 'SENIN_RIOT_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

app.get('/api/players', async (req, res) => {
    try { const players = await Player.find().sort({ createdAt: -1 }); res.json(players); } 
    catch (err) { res.status(500).json({ error: 'Hata' }); }
});

app.post('/api/players', async (req, res) => {
    try { const newPlayer = new Player(req.body); await newPlayer.save(); res.status(201).json(newPlayer); } 
    catch (err) { res.status(400).json({ error: 'Hata' }); }
});

app.get('/auth/riot', (req, res) => {
    const riotAuthUrl = `https://auth.riotgames.com/authorize?client_id=${RIOT_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid+offline_access`;
    res.redirect(riotAuthUrl);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('Kod yok.');
    try {
        const tokenResponse = await axios.post('https://auth.riotgames.com/token', {
            grant_type: 'authorization_code', code: code, redirect_uri: REDIRECT_URI,
            client_id: RIOT_CLIENT_ID, client_secret: RIOT_CLIENT_SECRET
        });
        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const riotName = `${userResponse.data.gameName}#${userResponse.data.tagLine}`;
        res.redirect(`/?login=success&username=${encodeURIComponent(riotName)}`);
    } catch (error) { res.status(500).send('Riot hatası.'); }
});

// Render.com'un dinamik portunu algılaması için PORT ayarı
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
