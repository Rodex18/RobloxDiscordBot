require('dotenv').config();

const express = require('express');
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('🟢 RobloxDiscordBot API funcionando');
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

    // 🔐 API Key
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
        console.log('🚨 Petición rechazada: API Key inválida');

        return res.status(401).json({
            success: false,
            message: 'API Key inválida'
        });
    }

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

        const { tipo, datos } = req.body;

        if (!tipo) {
            return res.status(400).json({
                success: false,
                message: 'Falta el tipo de log'
            });
        }

        // 🎨 Crear Embed
        const embed = new EmbedBuilder()
            .setTitle(`📋 ${tipo}`)
            .setDescription('Registro del sistema de Roblox')
            .setTimestamp();

        // 📦 Añadir los datos
        if (datos && typeof datos === 'object') {

            for (const [clave, valor] of Object.entries(datos)) {

                embed.addFields({
                    name: String(clave),
                    value: String(valor),
                    inline: true
                });

            }

        }

        await canal.send({
            embeds: [embed]
        });

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