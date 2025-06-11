import { getServerSession } from 'next-auth/next';
   import { authOptions } from '../../auth/[...nextauth]/route';

   export async function POST(req) {
     const session = await getServerSession(authOptions);
     if (!session) {
       return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
     }

     const { enabled } = await req.json();
     // TODO: Store email notification preference in a database
     return new Response(JSON.stringify({ success: true }), { status: 200 });
   }