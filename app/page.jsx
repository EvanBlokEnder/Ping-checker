'use client';
   import { useState, useEffect } from 'react';
   import axios from 'axios';
   import { signIn, signOut, useSession } from 'next-auth/react';

   export default function Home() {
     const { data: session } = useSession();
     const [guilds, setGuilds] = useState([]);
     const [selectedGuilds, setSelectedGuilds] = useState([]);
     const [messages, setMessages] = useState([]);
     const [emailNotifications, setEmailNotifications] = useState(false);

     useEffect(() => {
       if (session) {
         // Fetch guilds
         axios.get('/api/guilds').then(res => {
           setGuilds(res.data.guilds);
         }).catch(err => console.error(err));

         // Subscribe to push notifications
         if ('serviceWorker' in navigator && 'PushManager' in window) {
           navigator.serviceWorker.register('/sw.js').then(reg => {
             reg.pushManager.subscribe({
               userVisibleOnly: true,
               applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
             }).then(sub => {
               axios.post('/api/notifications/subscribe', sub);
             });
           });
         }

         // WebSocket connection to bot
         const ws = new WebSocket(process.env.NEXT_PUBLIC_BOT_WEBSOCKET_URL);
         ws.onmessage = (event) => {
           const data = JSON.parse(event.data);
           setMessages(prev => [...prev, data]);
           if (Notification.permission === 'granted') {
             new Notification(data.content, { body: `From ${data.author} in ${data.guild}` });
           }
         };
         return () => ws.close();
       }
     }, [session]);

     const handleGuildSelect = async (guildId) => {
       const newSelected = selectedGuilds.includes(guildId)
         ? selectedGuilds.filter(id => id !== guildId)
         : [...selectedGuilds, guildId];
       setSelectedGuilds(newSelected);
       await axios.post('/api/guilds/select', { guildIds: newSelected });
     };

     const toggleEmailNotifications = async () => {
       setEmailNotifications(!emailNotifications);
       await axios.post('/api/notifications/email', { enabled: !emailNotifications });
     };

     return (
       <div className="min-h-screen bg-gray-100 p-4">
         <div className="max-w-4xl mx-auto">
           <h1 className="text-3xl font-bold mb-4">Discord Ping Notifier</h1>
           {!session ? (
             <button
               onClick={() => signIn('discord')}
               className="bg-blue-500 text-white px-4 py-2 rounded"
             >
               Login with Discord
             </button>
           ) : (
             <div>
               <p className="mb-4">Welcome, {session.user.name}!</p>
               <button
                 onClick={() => signOut()}
                 className="bg-red-500 text-white px-4 py-2 rounded mb-4"
               >
                 Logout
               </button>
               <h2 className="text-xl font-semibold mb-2">Select Servers</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 {guilds.map(guild => (
                   <div key={guild.id} className="flex items-center">
                     <input
                       type="checkbox"
                       checked={selectedGuilds.includes(guild.id)}
                       onChange={() => handleGuildSelect(guild.id)}
                       className="mr-2"
                     />
                     <span>{guild.name}</span>
                   </div>
                 ))}
               </div>
               <div className="mb-4">
                 <label className="flex items-center">
                   <input
                     type="checkbox"
                     checked={emailNotifications}
                     onChange={toggleEmailNotifications}
                     className="mr-2"
                   />
                   <span>Enable Email Notifications</span>
                 </label>
               </div>
               <h2 className="text-xl font-semibold mb-2">Messages</h2>
               <div className="bg-white p-4 rounded shadow">
                 {messages.map((msg, index) => (
                   <div key={index} className="mb-2">
                     <p><strong>{msg.author}</strong> in <strong>{msg.guild}</strong>: {msg.content}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       </div>
     );
   }