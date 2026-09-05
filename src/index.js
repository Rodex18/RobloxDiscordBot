require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('🟢 RobloxDiscordBot API funcionando');
});

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

    try {
        const canal = await client.channels.fetch('1545236516132098068');

        if (!canal) {
            return res.status(404).json({
                success: false,
                message: 'Canal de Discord no encontrado'
            });
        }

        const { tipo, jugador } = req.body;

        await canal.send(
            `🟢 **${tipo}**\n👤 Jugador: ${jugador}`
        );

        res.json({
            success: true,
            message: 'Log recibido y enviado a Discord'
        });

    } catch (error) {
        console.error('Error enviando a Discord:', error);

        res.status(500).json({
            success: false,
            message: 'Error enviando el log a Discord'
        });
    }
});
app.listen(PORT, () => {
    console.log(`🌐 API funcionando en el puerto ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);