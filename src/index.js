require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('🟢 API de RobloxDiscordBot funcionando');
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once('clientReady', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
});

app.post('/roblox/log', async (req, res) => {
    console.log('📥 Log recibido desde Roblox:');
    console.log(req.body);

    res.json({
        success: true,
        message: 'Log recibido correctamente'
    });
});

app.listen(PORT, () => {
    console.log(`🌐 API funcionando en el puerto ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);