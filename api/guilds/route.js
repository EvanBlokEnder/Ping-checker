import { getServerSession } from 'next-auth/next';
   import axios from 'axios';
   import { authOptions } from '../auth/[...nextauth]/route';

   export async function GET(req) {
     const session = await getServerSession(authOptions);
     if (!session) {
       return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
     }

     try {
       const response = await axios.get('https://discord.com/api/users/@me/guilds', {
         headers: { Authorization: `Bearer ${session.accessToken}` }
       });
       return new Response(JSON.stringify({ guilds: response.data }), { status: 200 });
     } catch (error) {
       return new Response(JSON.stringify({ error: 'Failed to fetch guilds' }), { status: 500 });
     }
   }