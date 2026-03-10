const BASE = "https://p-partners-zjfl.vercel.app";
const getToken = () => localStorage.getItem("sb_token");
const headers  = () => ({ "Content-Type":"application/json", ...(getToken()?{Authorization:`Bearer ${getToken()}`}:{}) });
const req = async (method, path, body) => {
  const res = await fetch(`${BASE}/api${path}`, { method, headers:headers(), ...(body?{body:JSON.stringify(body)}:{}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const api = {
  signup: b=>req("POST","/auth/signup",b), login: b=>req("POST","/auth/login",b),
  getMe: ()=>req("GET","/auth/me"), updateProfile: b=>req("PUT","/auth/profile",b),
  getUsers: (p={})=>{ const q=new URLSearchParams(p).toString(); return req("GET",`/users${q?"?"+q:""}`); },
  getUserById: id=>req("GET",`/users/${id}`),
  followUser: id=>req("POST",`/users/${id}/follow`),
  getFeed: (p={})=>{ const q=new URLSearchParams(p).toString(); return req("GET",`/feed${q?"?"+q:""}`); },
  createPost: b=>req("POST","/feed",b), votePost: (id,b)=>req("POST",`/feed/${id}/vote`,b),
  savePost: id=>req("POST",`/feed/${id}/save`), deletePost: id=>req("DELETE",`/feed/${id}`),
  pollVote: (id,b)=>req("POST",`/feed/${id}/poll`,b),
  getComments: id=>req("GET",`/feed/${id}/comments`), addComment: (id,b)=>req("POST",`/feed/${id}/comments`,b),
  voteComment: (pid,cid)=>req("POST",`/feed/${pid}/comments/${cid}/vote`),
  createBattle: b=>req("POST","/battles",b), getBattles: (p={})=>{ const q=new URLSearchParams(p).toString(); return req("GET",`/battles${q?"?"+q:""}`); },
  getBattleById: id=>req("GET",`/battles/${id}`), joinBattle: id=>req("POST",`/battles/${id}/join`),
  submitBattle: (id,b)=>req("POST",`/battles/${id}/submit`,b), spectateBattle: id=>req("POST",`/battles/${id}/spectate`),
  getNotifications: ()=>req("GET","/notifications"), markNotificationsRead: ()=>req("POST","/notifications/read"),
  reportContent: b=>req("POST","/reports",b),
  joinQueue: b=>req("POST","/queue/join",b), leaveQueue: ()=>req("POST","/queue/leave"),
  discover: ()=>req("GET","/discover"), swipe: b=>req("POST","/swipe",b), getMatches: ()=>req("GET","/matches"),
  getRooms: (p={})=>{ const q=new URLSearchParams(p).toString(); return req("GET",`/rooms${q?"?"+q:""}`); },
  createRoom: b=>req("POST","/rooms",b), joinRoom: id=>req("POST",`/rooms/${id}/join`),
  leaveRoom: id=>req("POST",`/rooms/${id}/leave`), getRoomMessages: id=>req("GET",`/rooms/${id}/messages`),
  getConversation: id=>req("GET",`/messages/${id}`), sendMessage: b=>req("POST","/messages",b),
  saveScore: b=>req("POST","/scores",b), getLeaderboard: (p={})=>{ const q=new URLSearchParams(p).toString(); return req("GET",`/leaderboard${q?"?"+q:""}`); },
  endSession: b=>req("POST","/sessions/end",b),
  setToken: t=>localStorage.setItem("sb_token",t),
  clearToken: ()=>localStorage.removeItem("sb_token"),
  hasToken: ()=>!!localStorage.getItem("sb_token"),
};
