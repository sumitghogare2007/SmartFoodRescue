const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const {io}=require('../../node_modules/socket.io-client');
require('dotenv').config();
const base=process.env.TRACKING_TEST_API_URL || 'http://localhost:5000';
const assert=require('node:assert/strict');
const sockets=[];
const request=async(path,token)=>{const res=await fetch(base+path,{headers:token?{Authorization:'Bearer '+token}:{}});return {status:res.status,body:await res.json()};};
const tokenFor=user=>jwt.sign({id:String(user._id)},process.env.JWT_SECRET,{expiresIn:'5m'});
function event(socket,name,action){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(name+' timeout')),10000);socket.once(name,data=>{clearTimeout(timeout);resolve(data)});action?.();});}
(async()=>{try{
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});const db=mongoose.connection;
 assert.equal((await request('/api/health')).body.status,'OK');
 const p=await db.collection('pickups').findOne({});assert.ok(p);
 const r=await db.collection('donationRequests').findOne({_id:p.requestId});
 const d=await db.collection('foodDonations').findOne({_id:r.donationId});
 const donor=await db.collection('donors').findOne({_id:d.donorId});
 const ngo=await db.collection('ngos').findOne({_id:r.ngoId});
 const vol=await db.collection('volunteers').findOne({_id:p.volunteerId});
 for(const [role,profile] of [['DONOR',donor],['NGO',ngo],['VOLUNTEER',vol]]){
  if(!profile)continue;
  const u=await db.collection('users').findOne({_id:profile.userId});assert.ok(u);
  const token=tokenFor(u);
  const state=await request('/api/pickups/'+p._id+'/tracking',token);assert.equal(state.status,200);
  const socket=io(base,{auth:{token},transports:['websocket'],autoConnect:false,reconnection:false});sockets.push(socket);
  await event(socket,'connect',()=>socket.connect());
  const joined=await event(socket,'tracking:joined',()=>socket.emit('join:pickup',{pickupId:String(p._id)}));assert.equal(joined.pickupId,String(p._id));
  console.log('PASS: '+role+' real pickup tracking API and authenticated WebSocket room');
  if(role==='DONOR'){
   const route=await request('/api/pickups/'+p._id+'/route',token);
   console.log('Road route HTTP status:',route.status,route.status===200?'provider='+route.body.provider+', vertices='+route.body.coordinates.length:route.body.message);
   assert.equal(route.status, 200, 'Road route must succeed for the selected stored pickup');
   assert.ok(route.body.coordinates.length > 1);
  }
 }
 const unrelated=await db.collection('users').findOne({userType:'DONOR',_id:{$ne:donor.userId}});
 if(unrelated){const token=tokenFor(unrelated);assert.equal((await request('/api/pickups/'+p._id+'/tracking',token)).status,403);console.log('PASS: unrelated donor denied tracking API');
 const denied=io(base,{auth:{token},transports:['websocket'],autoConnect:false,reconnection:false});sockets.push(denied);
 await event(denied,'connect',()=>denied.connect());
 const error=await event(denied,'tracking:error',()=>denied.emit('join:pickup',{pickupId:String(p._id)}));assert.ok(error.message);
 console.log('PASS: unrelated donor denied pickup socket room');}
 const bad=io(base,{auth:{token:'invalid'},autoConnect:false,reconnection:false});sockets.push(bad);await event(bad,'connect_error',()=>bad.connect());console.log('PASS: invalid JWT socket rejected');
 assert.equal((await request('/api/pickups/'+p._id+'/tracking')).status,401);console.log('PASS: anonymous API rejected');
 console.log('Read-only integration complete; no GPS submissions, pickup transitions, or email sends.');
}catch(e){console.error('Verification failed:',e.message);process.exitCode=1;}finally{for(const s of sockets)s.disconnect();await mongoose.disconnect();}})();

