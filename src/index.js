
require('dotenv').config();

const express = require('express');
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

const CANAL_ID = '1545236516132098068';

app.use(express.json({ limit: '32kb' }));

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const COLORES = {
    PLAYER_JOIN: 0x2ECC71,
    PLAYER_LEAVE: 0x7F8C8D,
    CHAT: 0x3498DB,
    ADMIN: 0xE74C3C,
    ECONOMIA: 0xD4AC0D,
    EVENTO: 0x8E44AD,
    ERROR: 0xC0392B,
    CUSTOM: 0x566573,
    DEFAULT: 0x34495E
};

const TITULOS = {
    PLAYER_JOIN: 'Jugador conectado',
    PLAYER_LEAVE: 'Jugador desconectado',
    CHAT: 'Registro de chat',
    ECONOMIA: 'Movimiento económico',
    EVENTO: 'Evento del servidor',
    ERROR: 'Error del sistema',
    CUSTOM: 'Registro personalizado',
    ADMIN_BAN: 'Jugador sancionado',
    ADMIN_UNBAN: 'Sanción retirada',
    ADMIN_KICK: 'Jugador expulsado',
    ADMIN_KILL: 'Acción administrativa: Kill',
    ADMIN_FREEZE: 'Jugador congelado',
    ADMIN_UNFREEZE: 'Jugador descongelado',
    ADMIN_FLY: 'Vuelo activado',
    ADMIN_UNFLY: 'Vuelo desactivado',
    ADMIN_NOCLIP: 'Noclip activado',
    ADMIN_CLIP: 'Noclip desactivado',
    ADMIN_TP: 'Teletransporte ejecutado',
    ADMIN_BRING: 'Jugador trasladado'
};

function obtenerColor(tipo) {
    const t = tipo.toUpperCase();

    if (COLORES[t]) return COLORES[t];

    if (t.startsWith('ADMIN_')) return COLORES.ADMIN;
    if (t.includes('ERROR')) return COLORES.ERROR;
    if (t.includes('ECONOM')) return COLORES.ECONOMIA;
    if (t.includes('EVENT')) return COLORES.EVENTO;
    if (t.includes('JOIN')) return COLORES.PLAYER_JOIN;
    if (t.includes('LEAVE')) return COLORES.PLAYER_LEAVE;

    return COLORES.DEFAULT;
}

function obtenerTitulo(tipo) {
    const t = tipo.toUpperCase();

    if (TITULOS[t]) return TITULOS[t];

    return 'Registro: ' + tipo.replace(/_/g, ' ');
}

function formatearNombre(nombre) {
    const etiquetas = {
        userId: 'User ID',
        jugador: 'Jugador',
        administrador: 'Administrador',
        objetivo: 'Objetivo',
        mensaje: 'Mensaje',
        motivo: 'Motivo',
        cantidad: 'Cantidad',
        saldoAnterior: 'Saldo anterior',
        saldoNuevo: 'Saldo nuevo',
        articulo: 'Artículo',
        comando: 'Comando'
    };

    if (etiquetas[nombre]) return etiquetas[nombre];

    return nombre
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letra => letra.toUpperCase());
}

function formatearValor(valor) {
    if (valor === null || valor === undefined) {
        return 'No especificado';
    }

    if (typeof valor === 'object') {
        return JSON.stringify(valor, null, 2) || 'Sin datos';
    }

    if (typeof valor === 'boolean') {
        return valor ? 'Sí' : 'No';
    }

    return String(valor);
}

function limitarTexto(texto, limite) {
    texto = String(texto);

    if (texto.length <= limite) return texto;

    return texto.slice(0, limite - 3) + '...';
}

app.get('/', (req, res) => {
    res.send('RobloxDiscordBot API funcionando');
});

app.post('/roblox/log', async (req, res) => {

    // Autenticación
    const apiKey = req.headers['x-api-key'];

    if (!process.env.API_KEY ||
        !apiKey ||
        apiKey !== process.env.API_KEY) {

        console.log('Petición rechazada: API Key inválida');

        return res.status(401).json({
            success: false,
            message: 'API Key inválida'
        });
    }

    const { tipo, datos } = req.body;

    if (!tipo || typeof tipo !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Tipo de log inválido'
        });
    }

    if (datos !== undefined &&
        (datos === null || typeof datos !== 'object' || Array.isArray(datos))) {

        return res.status(400).json({
            success: false,
            message: 'Los datos deben ser un objeto'
        });
    }

    try {

        if (!client.isReady()) {
            return res.status(503).json({
                success: false,
                message: 'El bot todavía no está listo'
            });
        }

        const canal = await client.channels.fetch(CANAL_ID);

        if (!canal || !canal.isTextBased() ||
            typeof canal.send !== 'function') {

            return res.status(404).json({
                success: false,
                message: 'Canal de Discord no disponible'
            });
        }

        // Preparar campos
        const campos = [];

        if (datos) {
            for (const [clave, valor] of Object.entries(datos)) {

                if (campos.length >= 25) break;

                campos.push({
                    name: limitarTexto(formatearNombre(clave), 256),
                    value: limitarTexto(formatearValor(valor), 1024),
                    inline: true
                });
            }
        }

        // Crear Embed
        const embed = new EmbedBuilder()
            .setColor(obtenerColor(tipo))
            .setAuthor({
                name: 'MimiBot | Roblox Logging System'
            })
            .setTitle(limitarTexto(obtenerTitulo(tipo), 256))
            .setDescription('Se ha registrado una actividad en el servidor.')
            .addFields(
                campos.length > 0
                    ? campos
                    : [{
                        name: 'Información',
                        value: 'No se recibieron datos adicionales.',
                        inline: false
                    }]
            )
            .setFooter({
                text: 'Sistema de auditoría | Roblox'
            })
            .setTimestamp();

        // Enviar a Discord
        await canal.send({
            embeds: [embed],
            allowedMentions: { parse: [] }
        });

        console.log(`Log enviado: ${tipo}`);

        return res.json({
            success: true,
            message: 'Log enviado correctamente'
        });

    } catch (error) {

        console.error('Error enviando log:', error);

        return res.status(500).json({
            success: false,
            message: 'Error enviando el registro'
        });
    }
});

app.listen(PORT, () => {
    console.log(`API funcionando en el puerto ${PORT}`);
});

client.once('clientReady', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
