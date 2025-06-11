import webPush from 'web-push';

   export async function POST(req) {
     const { title, body } = await req.json();
     webPush.setVapidDetails(
       'mailto:your_email@gmail.com',
       process.env.VAPID_PUBLIC_KEY,
       process.env.VAPID_PRIVATE_KEY
     );

     // TODO: Fetch subscriptions from database
     const subscriptions = []; // Replace with actual subscriptions
     for (const subscription of subscriptions) {
       try {
         await webPush.sendNotification(subscription, JSON.stringify({ title, body }));
       } catch (error) {
         console.error('Push notification failed:', error);
       }
     }
     return new Response(JSON.stringify({ success: true }), { status: 200 });
   }