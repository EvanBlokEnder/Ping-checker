const { Client, GatewayIntentBits } = require('discord.js');
   const WebSocket = require('ws');
   const nodemailer = require('nodemailer');
   const axios = require('axios');
   const express = require('express');

   const app = express();
   app.use(express.json());

   const client = new Client({
     intents: [
       GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildMessages,
       GatewayIntentBits.MessageContent
     ]
   });

   const wss = new WebSocket.Server({ port: 8080 });
   const selectedGuilds = new Set();

   wss.on('connection', ws => {
     console.log('WebSocket client connected');
     ws.on('close', () => console.log('WebSocket client disconnected'));
   });

   app.post('/api/select-guilds', (req, res) => {
     const { guildIds } = req.body;
     selectedGuilds.clear();
     guildIds.forEach(id => selectedGuilds.add(id));
     res.json({ success: true });
   });

   client.on('ready', () => {
     console.log(`Logged in as ${client.user.tag}`);
   });

   client.on('messageCreate', async message => {
     if (message.author.bot || !selectedGuilds.has(message.guild.id)) return;

     const guild = message.guild.name;
     const author = message.author.username;
     const content = message.content;
     const isPing = message.mentions.users.has(client.user.id);

     // Send to WebSocket clients
     wss.clients.forEach(client => {
       if (client.readyState === WebSocket.OPEN) {
         client.send(JSON.stringify({ guild, author, content, isPing }));
       }
     });

     // Email notification for pings
     // TODO: Check user’s email preference in database
     const emailEnabled = true; // Replace with database check
     if (emailEnabled && isPing) {
       const transporter = nodemailer.createTransport({
         host: process.env.SMTP_HOST,
         port: process.env.SMTP_PORT,
         auth: {
           user: process.env.SMTP_USER,
           pass: process.env.SMTP_PASS
         }
       });

       await transporter.sendMail({
         from: process.env.SMTP_USER,
         to: 'user@example.com', // Replace with user’s email
         subject: `New Ping in ${guild}`,
         text: `${author}: ${content}`
       });
     }

     // Send push notification
     await axios.post('https://your-vercel-app.vercel.app/api/notifications/push', {
       title: `New Message in ${guild}`,
       body: `${author}: ${content}`
     });
   });

   app.listen(3000, () => console.log('Bot API running on port 3000'));
   client.login(process.env.DISCORD_BOT_TOKEN);