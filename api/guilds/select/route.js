import { getServerSession } from 'next-auth/next';
   import axios from 'axios';
   import { authOptions } from '../../auth/[...nextauth]/route';

   export async function POST(req) {
     const session = await getServerSession(authOptions);
     if (!session) {
       return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
     }

     const { guildIds } = await req.json();
     try {
       await axios.post('https://your-render-bot.onrender.com/api/select-guilds', { guildIds }, {
         headers: { Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}` }
       });
       return new Response(JSON.stringify({ success: true }), { status: 200 });
     } catch (error) {
       return new Response(JSON.stringify({ error: 'Failed to select guilds' }), { status: 500 });
     }
   }