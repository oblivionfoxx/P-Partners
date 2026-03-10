const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { User, Post, Comment, Battle, Notification, StudySession, MatchingQueue,
        Swipe, Match, StudyRoom, RoomMessage, Message, GameScore, Report } = require('../models');

const genToken = id => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const createNotif = async (userId, type, fromId, message, extra={}) => {
  try { await Notification.create({ userId, type, fromId, message, ...extra }); } catch(e) {}
};

// ── BATTLE QUESTIONS ──────────────────────────────────────────────────────────
const BATTLE_QUESTIONS = {
  Mathematics: [
    { question:"What is 15% of 200?", options:["25","30","35","40"], correctIndex:1, explanation:"15/100 × 200 = 30" },
    { question:"Solve: 2x + 5 = 17", options:["x=5","x=6","x=7","x=4"], correctIndex:1, explanation:"2x=12, x=6" },
    { question:"What is √144?", options:["11","12","13","14"], correctIndex:1, explanation:"12×12=144" },
    { question:"What is 3² + 4²?", options:["25","24","49","50"], correctIndex:0, explanation:"9+16=25" },
    { question:"What is the area of a circle with radius 5? (π≈3.14)", options:["78.5","62.8","31.4","94.2"], correctIndex:0, explanation:"πr²=3.14×25=78.5" },
    { question:"What is 8! (8 factorial)?", options:["40320","5040","720","362880"], correctIndex:0, explanation:"8×7×6×5×4×3×2×1=40320" },
    { question:"What is log₁₀(1000)?", options:["2","3","4","10"], correctIndex:1, explanation:"10³=1000" },
    { question:"Solve: x² - 5x + 6 = 0", options:["x=2,3","x=1,6","x=2,4","x=3,4"], correctIndex:0, explanation:"(x-2)(x-3)=0" },
    { question:"What is the sum of angles in a triangle?", options:["90°","180°","270°","360°"], correctIndex:1, explanation:"Always 180°" },
    { question:"What is 2¹⁰?", options:["512","1024","2048","256"], correctIndex:1, explanation:"2¹⁰=1024" },
  ],
  Physics: [
    { question:"What is the unit of force?", options:["Joule","Newton","Pascal","Watt"], correctIndex:1, explanation:"Force is measured in Newtons (N)" },
    { question:"What is the speed of light?", options:["3×10⁶ m/s","3×10⁷ m/s","3×10⁸ m/s","3×10⁹ m/s"], correctIndex:2, explanation:"c ≈ 3×10⁸ m/s" },
    { question:"F = ma is Newton's which law?", options:["First","Second","Third","Fourth"], correctIndex:1, explanation:"F=ma is Newton's Second Law" },
    { question:"What is the unit of electrical resistance?", options:["Volt","Ampere","Ohm","Watt"], correctIndex:2, explanation:"Resistance is measured in Ohms (Ω)" },
    { question:"What is kinetic energy formula?", options:["mgh","½mv²","mv","Fd"], correctIndex:1, explanation:"KE = ½mv²" },
    { question:"What is absolute zero in Celsius?", options:["-100°C","-200°C","-273°C","-373°C"], correctIndex:2, explanation:"0K = -273.15°C" },
    { question:"Which wave type needs a medium?", options:["Light","Radio","Sound","X-ray"], correctIndex:2, explanation:"Sound is a mechanical wave" },
    { question:"What is Ohm's Law?", options:["V=IR","P=IV","F=ma","E=mc²"], correctIndex:0, explanation:"V = I × R" },
    { question:"Unit of frequency?", options:["Meter","Second","Hertz","Joule"], correctIndex:2, explanation:"Frequency is measured in Hertz (Hz)" },
    { question:"What is gravitational acceleration on Earth?", options:["8.9 m/s²","9.8 m/s²","10.8 m/s²","11.2 m/s²"], correctIndex:1, explanation:"g ≈ 9.8 m/s²" },
  ],
  Chemistry: [
    { question:"What is the atomic number of Carbon?", options:["4","6","8","12"], correctIndex:1, explanation:"Carbon has 6 protons" },
    { question:"What is H₂O?", options:["Hydrogen Peroxide","Heavy Water","Water","Hydroxide"], correctIndex:2, explanation:"H₂O is the chemical formula for water" },
    { question:"What is the pH of pure water?", options:["5","6","7","8"], correctIndex:2, explanation:"Pure water has pH = 7 (neutral)" },
    { question:"Which element has symbol 'Fe'?", options:["Fluorine","Iron","Francium","Fermium"], correctIndex:1, explanation:"Fe comes from Latin 'Ferrum' meaning iron" },
    { question:"What is the most abundant gas in Earth's atmosphere?", options:["Oxygen","Carbon Dioxide","Argon","Nitrogen"], correctIndex:3, explanation:"Nitrogen makes up ~78% of the atmosphere" },
    { question:"What type of bond shares electrons?", options:["Ionic","Covalent","Metallic","Hydrogen"], correctIndex:1, explanation:"Covalent bonds share electron pairs" },
    { question:"What is the chemical symbol for Gold?", options:["Go","Gd","Au","Ag"], correctIndex:2, explanation:"Au from Latin 'Aurum'" },
    { question:"How many elements are in the periodic table?", options:["108","112","118","124"], correctIndex:2, explanation:"118 confirmed elements" },
    { question:"What is NaCl?", options:["Sugar","Baking Soda","Salt","Vinegar"], correctIndex:2, explanation:"NaCl is Sodium Chloride = table salt" },
    { question:"Which particle has no charge?", options:["Proton","Electron","Neutron","Ion"], correctIndex:2, explanation:"Neutrons are electrically neutral" },
  ],
  "Computer Science": [
    { question:"What does CPU stand for?", options:["Central Processing Unit","Computer Processing Unit","Central Program Unit","Core Processing Unit"], correctIndex:0, explanation:"CPU = Central Processing Unit" },
    { question:"What is the binary of 10?", options:["1010","1001","1100","0110"], correctIndex:0, explanation:"8+2=10 → 1010 in binary" },
    { question:"What does HTTP stand for?", options:["HyperText Transfer Protocol","High Transfer Text Protocol","HyperText Transport Program","High Text Transfer Protocol"], correctIndex:0, explanation:"HTTP = HyperText Transfer Protocol" },
    { question:"What is O(n) notation?", options:["Constant time","Logarithmic time","Linear time","Quadratic time"], correctIndex:2, explanation:"O(n) means linear time complexity" },
    { question:"Which data structure uses LIFO?", options:["Queue","Stack","Tree","Graph"], correctIndex:1, explanation:"Stack uses Last In First Out" },
    { question:"What is RAM?", options:["Read Access Memory","Random Access Memory","Rapid Access Module","Read And Memorize"], correctIndex:1, explanation:"RAM = Random Access Memory" },
    { question:"What does SQL stand for?", options:["Simple Query Language","Structured Query Language","Standard Query Logic","Sequential Query Language"], correctIndex:1, explanation:"SQL = Structured Query Language" },
    { question:"Which language is used for web styling?", options:["HTML","JavaScript","CSS","Python"], correctIndex:2, explanation:"CSS = Cascading Style Sheets" },
    { question:"What is a Boolean?", options:["A number type","A text type","A true/false type","A list type"], correctIndex:2, explanation:"Boolean represents true or false values" },
    { question:"What does API stand for?", options:["Application Programming Interface","Application Protocol Integration","Advanced Programming Interface","Application Process Integration"], correctIndex:0, explanation:"API = Application Programming Interface" },
  ],
  History: [
    { question:"In which year did World War II end?", options:["1943","1944","1945","1946"], correctIndex:2, explanation:"WWII ended in 1945" },
    { question:"Who was the first US President?", options:["John Adams","Thomas Jefferson","George Washington","Benjamin Franklin"], correctIndex:2, explanation:"George Washington, 1789-1797" },
    { question:"The French Revolution began in which year?", options:["1776","1789","1799","1804"], correctIndex:1, explanation:"The French Revolution began in 1789" },
    { question:"Which empire was ruled by Julius Caesar?", options:["Greek","Ottoman","Roman","Byzantine"], correctIndex:2, explanation:"Julius Caesar ruled the Roman Empire" },
    { question:"In which year did the Berlin Wall fall?", options:["1987","1988","1989","1990"], correctIndex:2, explanation:"The Berlin Wall fell on November 9, 1989" },
    { question:"Who wrote the Declaration of Independence?", options:["George Washington","Benjamin Franklin","Thomas Jefferson","John Adams"], correctIndex:2, explanation:"Thomas Jefferson was the primary author" },
    { question:"The Renaissance began in which country?", options:["France","England","Italy","Germany"], correctIndex:2, explanation:"The Renaissance originated in Italy" },
    { question:"Which ancient wonder was in Alexandria?", options:["Colossus","Lighthouse","Hanging Gardens","Mausoleum"], correctIndex:1, explanation:"The Lighthouse of Alexandria" },
    { question:"Who was the first person to walk on the moon?", options:["Buzz Aldrin","Yuri Gagarin","Neil Armstrong","John Glenn"], correctIndex:2, explanation:"Neil Armstrong, July 20, 1969" },
    { question:"The Ottoman Empire's capital was?", options:["Baghdad","Cairo","Constantinople","Damascus"], correctIndex:2, explanation:"Constantinople (now Istanbul)" },
  ],
  Biology: [
    { question:"What is the powerhouse of the cell?", options:["Nucleus","Ribosome","Mitochondria","Golgi Apparatus"], correctIndex:2, explanation:"Mitochondria produce ATP energy" },
    { question:"DNA stands for?", options:["Deoxyribonucleic Acid","Deoxyribose Nucleic Acid","Double Nucleic Acid","Deoxyribonuclease Acid"], correctIndex:0, explanation:"DNA = Deoxyribonucleic Acid" },
    { question:"How many chromosomes do humans have?", options:["23","44","46","48"], correctIndex:2, explanation:"Humans have 46 chromosomes (23 pairs)" },
    { question:"What process do plants use to make food?", options:["Respiration","Photosynthesis","Digestion","Fermentation"], correctIndex:1, explanation:"Plants use photosynthesis" },
    { question:"What blood type is the universal donor?", options:["A","B","AB","O"], correctIndex:3, explanation:"Type O negative is the universal donor" },
    { question:"Where does protein synthesis occur?", options:["Nucleus","Mitochondria","Ribosome","Lysosome"], correctIndex:2, explanation:"Ribosomes synthesize proteins" },
    { question:"What is the largest organ in the human body?", options:["Liver","Brain","Skin","Heart"], correctIndex:2, explanation:"The skin is the largest organ" },
    { question:"What carries oxygen in blood?", options:["White blood cells","Platelets","Plasma","Hemoglobin"], correctIndex:3, explanation:"Hemoglobin in red blood cells carries oxygen" },
    { question:"What is osmosis?", options:["Movement of solute","Movement of water across membrane","Movement of proteins","Cell division"], correctIndex:1, explanation:"Osmosis is water movement through a semipermeable membrane" },
    { question:"What is the basic unit of life?", options:["Organ","Tissue","Cell","Atom"], correctIndex:2, explanation:"The cell is the basic unit of life" },
  ],
  Economics: [
    { question:"What does GDP stand for?", options:["Gross Domestic Product","General Domestic Price","Gross Demand Product","General Development Plan"], correctIndex:0, explanation:"GDP = Gross Domestic Product" },
    { question:"What is inflation?", options:["Decrease in money supply","Rise in general price levels","Fall in interest rates","Increase in employment"], correctIndex:1, explanation:"Inflation is the general rise in price levels" },
    { question:"Supply and demand is a concept of?", options:["Macroeconomics","Microeconomics","Both","Neither"], correctIndex:2, explanation:"It applies to both micro and macroeconomics" },
    { question:"What is a monopoly?", options:["Many sellers","Two sellers","One seller","No sellers"], correctIndex:2, explanation:"A monopoly has one dominant seller" },
    { question:"What does ROI stand for?", options:["Rate Of Interest","Return On Investment","Risk Of Investment","Rate Of Income"], correctIndex:1, explanation:"ROI = Return On Investment" },
    { question:"What is opportunity cost?", options:["Total cost of production","Value of next best alternative","Fixed cost","Marginal cost"], correctIndex:1, explanation:"Opportunity cost = value of the best alternative foregone" },
    { question:"Who wrote 'The Wealth of Nations'?", options:["Karl Marx","John Keynes","Adam Smith","Milton Friedman"], correctIndex:2, explanation:"Adam Smith, 1776" },
    { question:"What is fiscal policy?", options:["Central bank interest rates","Government spending and taxation","Exchange rate management","Trade regulations"], correctIndex:1, explanation:"Fiscal policy involves government spending and taxation" },
    { question:"What is a recession?", options:["1 quarter of negative growth","2 quarters of negative growth","1 year of negative growth","Any economic slowdown"], correctIndex:1, explanation:"A recession is 2 consecutive quarters of negative GDP growth" },
    { question:"What does CPI measure?", options:["Corporate Profits Index","Consumer Price Index","Capital Price Index","Currency Price Index"], correctIndex:1, explanation:"CPI = Consumer Price Index, measures inflation" },
  ],
};

const getQuestions = (subject, difficulty, count=10) => {
  const pool = BATTLE_QUESTIONS[subject] || BATTLE_QUESTIONS['Mathematics'];
  return pool.sort(() => Math.random() - 0.5).slice(0, count);
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password, country, educationLevel, subjects, languages, bio } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, country, educationLevel, subjects, languages, bio });
    const token = genToken(user._id);
    const u = user.toObject(); delete u.passwordHash;
    res.status(201).json({ token, user: u });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Account suspended. Contact support.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    await User.findByIdAndUpdate(user._id, { status: 'online' });
    const token = genToken(user._id);
    const u = user.toObject(); delete u.passwordHash;
    res.json({ token, user: u });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getMe = async (req, res) => res.json({ user: req.user });

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, country, educationLevel, subjects, languages } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, bio, country, educationLevel, subjects, languages }, { new: true, select: '-passwordHash' });
    res.json({ user });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { subjects, language, educationLevel, search } = req.query;
    const filter = { _id: { $ne: req.user._id }, isBanned: false };
    if (subjects) filter.subjects = { $in: subjects.split(',') };
    if (language) filter.languages = { $in: [language] };
    if (educationLevel) filter.educationLevel = educationLevel;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const users = await User.find(filter).select('-passwordHash').limit(50);
    res.json({ users });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const posts = await Post.find({ authorId: req.params.id, isRemoved: false }).populate('authorId','name color emoji isVerified').sort({ createdAt: -1 }).limit(20);
    res.json({ user, posts });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── FOLLOW ────────────────────────────────────────────────────────────────────
exports.followUser = async (req, res) => {
  try {
    const { targetId } = req.params;
    if (targetId === req.user._id.toString()) return res.status(400).json({ error: "Can't follow yourself" });
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });
    const isFollowing = req.user.following.includes(targetId);
    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: req.user._id } });
      res.json({ following: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.user._id } });
      await createNotif(targetId, 'follow', req.user._id, `${req.user.name} started following you`);
      res.json({ following: true });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── FEED ──────────────────────────────────────────────────────────────────────
exports.getFeed = async (req, res) => {
  try {
    const { page=1, subject, type } = req.query;
    const limit = 20;
    const skip  = (page-1)*limit;
    const filter = { isRemoved: false };
    if (subject) filter.subject = subject;
    if (type)    filter.type = type;
    const posts = await Post.find(filter)
      .populate('authorId', 'name color emoji isVerified role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip).limit(limit);
    const total = await Post.countDocuments(filter);
    res.json({ posts, total, pages: Math.ceil(total/limit) });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.createPost = async (req, res) => {
  try {
    const { type, content, subject, tags, images, poll } = req.body;
    if (!type) return res.status(400).json({ error: 'Post type required' });
    if (type === 'text' && !content?.trim()) return res.status(400).json({ error: 'Content required' });
    if (content && content.length > 2000) return res.status(400).json({ error: 'Post too long (max 2000 chars)' });

    // Basic content moderation
    const banned = ['spam','scam','hate','abuse'];
    if (content && banned.some(w => content.toLowerCase().includes(w))) {
      return res.status(400).json({ error: 'Post contains prohibited content' });
    }

    const postData = { authorId: req.user._id, type, content, subject, tags: tags||[], images: images||[] };
    if (type === 'poll' && poll) {
      postData.poll = { question: poll.question, options: poll.options.map(o=>({text:o,votes:[]})), endsAt: new Date(Date.now()+7*24*3600*1000) };
    }
    const post = await Post.create(postData);
    const populated = await Post.findById(post._id).populate('authorId','name color emoji isVerified role');
    res.status(201).json({ post: populated });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.votePost = async (req, res) => {
  try {
    const { direction } = req.body; // up or down
    const post = await Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ error: 'Post not found' });
    const uid = req.user._id;
    const hasUp   = post.upvotes.includes(uid);
    const hasDown = post.downvotes.includes(uid);
    if (direction === 'up') {
      if (hasUp) { await Post.findByIdAndUpdate(post._id, { $pull: { upvotes: uid } }); }
      else { await Post.findByIdAndUpdate(post._id, { $addToSet: { upvotes: uid }, $pull: { downvotes: uid } });
        if (post.authorId.toString() !== uid.toString()) await createNotif(post.authorId,'like',uid,`${req.user.name} upvoted your post`,{postId:post._id}); }
    } else {
      if (hasDown) { await Post.findByIdAndUpdate(post._id, { $pull: { downvotes: uid } }); }
      else { await Post.findByIdAndUpdate(post._id, { $addToSet: { downvotes: uid }, $pull: { upvotes: uid } }); }
    }
    const updated = await Post.findById(post._id);
    res.json({ upvotes: updated.upvotes.length, downvotes: updated.downvotes.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.savePost = async (req, res) => {
  try {
    const uid = req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const isSaved = req.user.savedPosts?.includes(req.params.id);
    if (isSaved) {
      await User.findByIdAndUpdate(uid, { $pull: { savedPosts: req.params.id } });
      await Post.findByIdAndUpdate(req.params.id, { $pull: { saves: uid } });
      res.json({ saved: false });
    } else {
      await User.findByIdAndUpdate(uid, { $addToSet: { savedPosts: req.params.id } });
      await Post.findByIdAndUpdate(req.params.id, { $addToSet: { saves: uid } });
      res.json({ saved: true });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role === 'user') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Post.findByIdAndUpdate(req.params.id, { isRemoved: true, removedBy: req.user._id });
    res.json({ message: 'Post removed' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.pollVote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || post.type !== 'poll') return res.status(404).json({ error: 'Poll not found' });
    if (post.poll.endsAt < new Date()) return res.status(400).json({ error: 'Poll has ended' });
    // Remove existing votes by this user from all options
    post.poll.options.forEach(opt => { opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString()); });
    post.poll.options[optionIndex].votes.push(req.user._id);
    await post.save();
    res.json({ poll: post.poll });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id, isRemoved: false, parentId: null })
      .populate('authorId','name color emoji isVerified')
      .sort({ upvotes: -1, createdAt: -1 }).limit(50);
    res.json({ comments });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    if (content.length > 500) return res.status(400).json({ error: 'Comment too long' });
    const comment = await Comment.create({ postId: req.params.id, authorId: req.user._id, content, parentId: parentId||null });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    const post = await Post.findById(req.params.id);
    if (post && post.authorId.toString() !== req.user._id.toString()) {
      await createNotif(post.authorId,'comment',req.user._id,`${req.user.name} commented on your post`,{postId:req.params.id});
    }
    const populated = await Comment.findById(comment._id).populate('authorId','name color emoji isVerified');
    res.status(201).json({ comment: populated });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.voteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    const uid = req.user._id;
    const hasUp = comment.upvotes.includes(uid);
    if (hasUp) await Comment.findByIdAndUpdate(comment._id, { $pull: { upvotes: uid } });
    else        await Comment.findByIdAndUpdate(comment._id, { $addToSet: { upvotes: uid } });
    const updated = await Comment.findById(comment._id);
    res.json({ upvotes: updated.upvotes.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── BATTLES ───────────────────────────────────────────────────────────────────
exports.createBattle = async (req, res) => {
  try {
    const { subject, difficulty, duration, opponentId } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject required' });
    const questions = getQuestions(subject, difficulty||'medium', 10);
    const battle = await Battle.create({
      challengerId: req.user._id, subject, difficulty: difficulty||'medium',
      duration: duration||180, questions, opponentId: opponentId||null,
      status: opponentId ? 'waiting' : 'waiting',
    });
    if (opponentId) {
      await createNotif(opponentId,'battle_challenge',req.user._id,`${req.user.name} challenged you to a ${subject} battle!`,{battleId:battle._id});
    }
    res.status(201).json({ battle });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getBattles = async (req, res) => {
  try {
    const { status, subject } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    const battles = await Battle.find(filter)
      .populate('challengerId','name color emoji xp battleWins')
      .populate('opponentId','name color emoji xp battleWins')
      .populate('winnerId','name color emoji')
      .sort({ createdAt: -1 }).limit(30);
    res.json({ battles });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getBattleById = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate('challengerId','name color emoji xp battleWins')
      .populate('opponentId','name color emoji xp battleWins')
      .populate('winnerId','name color emoji');
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    res.json({ battle });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.joinBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    if (battle.status !== 'waiting') return res.status(400).json({ error: 'Battle already started' });
    if (battle.challengerId.toString() === req.user._id.toString()) return res.status(400).json({ error: "Can't join your own battle" });
    await Battle.findByIdAndUpdate(battle._id, { opponentId: req.user._id, status: 'active', startedAt: new Date() });
    const updated = await Battle.findById(battle._id).populate('challengerId','name color emoji').populate('opponentId','name color emoji');
    res.json({ battle: updated });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.submitBattleAnswers = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionIndex, answerIndex, timeMs }]
    const battle = await Battle.findById(req.params.id);
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    const isChallenger = battle.challengerId.toString() === req.user._id.toString();
    const isOpponent   = battle.opponentId?.toString() === req.user._id.toString();
    if (!isChallenger && !isOpponent) return res.status(403).json({ error: 'Not a participant' });

    // Calculate score
    let score = 0;
    answers.forEach(a => {
      const q = battle.questions[a.questionIndex];
      if (q && q.correctIndex === a.answerIndex) score += 10;
    });

    const update = isChallenger
      ? { challengerAnswers: answers, challengerScore: score }
      : { opponentAnswers: answers, opponentScore: score };
    await Battle.findByIdAndUpdate(battle._id, update);

    // Check if both submitted
    const updated = await Battle.findById(battle._id);
    const bothDone = updated.challengerAnswers.length > 0 && updated.opponentAnswers.length > 0;
    if (bothDone) {
      const cScore = updated.challengerScore;
      const oScore = updated.opponentScore;
      const winnerId = cScore > oScore ? updated.challengerId : cScore < oScore ? updated.opponentId : null;
      await Battle.findByIdAndUpdate(battle._id, { status:'completed', endedAt:new Date(), winnerId, xpAwarded:50 });

      // Award XP
      if (winnerId) {
        await User.findByIdAndUpdate(winnerId, { $inc: { xp: 100, battleWins: 1 } });
        const loserId = winnerId.toString()===updated.challengerId.toString() ? updated.opponentId : updated.challengerId;
        await User.findByIdAndUpdate(loserId, { $inc: { xp: 25, battleLosses: 1 } });
        await createNotif(updated.challengerId,'battle_result',updated.opponentId,`Battle complete! ${cScore>oScore?'You won':'You lost'} ${cScore}-${oScore}`,{battleId:battle._id});
        await createNotif(updated.opponentId,'battle_result',updated.challengerId,`Battle complete! ${oScore>cScore?'You won':'You lost'} ${oScore}-${cScore}`,{battleId:battle._id});
      }
    }
    res.json({ score, battle: updated });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.spectate = async (req, res) => {
  try {
    await Battle.findByIdAndUpdate(req.params.id, { $addToSet: { spectators: req.user._id } });
    res.json({ message: 'Now spectating' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user._id })
      .populate('fromId','name color emoji')
      .sort({ createdAt: -1 }).limit(30);
    res.json({ notifications: notifs });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked read' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── REPORTS / MODERATION ──────────────────────────────────────────────────────
exports.reportContent = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) return res.status(400).json({ error: 'targetType, targetId and reason required' });
    await Report.create({ reporterId: req.user._id, targetType, targetId, reason });
    // Flag post if too many reports
    if (targetType === 'post') {
      const count = await Report.countDocuments({ targetId, status:'pending' });
      if (count >= 5) await Post.findByIdAndUpdate(targetId, { isRemoved: true, removeReason: 'Auto-removed: multiple reports' });
    }
    res.json({ message: 'Report submitted. Our team will review it.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getReports = async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Moderators only' });
    const reports = await Report.find({ status:'pending' }).populate('reporterId','name').sort({ createdAt: -1 }).limit(50);
    res.json({ reports });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.resolveReport = async (req, res) => {
  try {
    if (req.user.role === 'user') return res.status(403).json({ error: 'Moderators only' });
    const { action } = req.body; // 'remove' or 'dismiss'
    const report = await Report.findById(req.params.id).populate('reporterId');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (action === 'remove') {
      if (report.targetType === 'post') await Post.findByIdAndUpdate(report.targetId, { isRemoved: true, removedBy: req.user._id });
      if (report.targetType === 'user') await User.findByIdAndUpdate(report.targetId, { isBanned: true });
    }
    await Report.findByIdAndUpdate(report._id, { status: action==='remove'?'resolved':'dismissed', resolvedBy: req.user._id });
    res.json({ message: 'Report resolved' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// ── EXISTING FEATURES ─────────────────────────────────────────────────────────
exports.joinQueue  = async (req, res) => { try { const { subjects, languages } = req.body; await MatchingQueue.findOneAndUpdate({ userId:req.user._id },{ userId:req.user._id,subjects:subjects||req.user.subjects,educationLevel:req.user.educationLevel,languages:languages||req.user.languages,status:'searching',joinedAt:new Date() },{ upsert:true,new:true }); await User.findByIdAndUpdate(req.user._id,{status:'searching'}); res.json({message:'Joined queue'}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.leaveQueue = async (req, res) => { try { await MatchingQueue.deleteOne({userId:req.user._id}); await User.findByIdAndUpdate(req.user._id,{status:'online'}); res.json({message:'Left queue'}); } catch(e){ res.status(500).json({error:e.message}); } };

exports.swipe = async (req, res) => {
  try {
    const { targetUserId, direction } = req.body;
    await Swipe.findOneAndUpdate({swiperId:req.user._id,targetUserId},{swiperId:req.user._id,targetUserId,direction},{upsert:true,new:true});
    let matched = false;
    if (direction === 'right') {
      const reverse = await Swipe.findOne({swiperId:targetUserId,targetUserId:req.user._id,direction:'right'});
      if (reverse) {
        const exists = await Match.findOne({$or:[{user1Id:req.user._id,user2Id:targetUserId},{user1Id:targetUserId,user2Id:req.user._id}]});
        if (!exists) { await Match.create({user1Id:req.user._id,user2Id:targetUserId}); matched = true; }
      }
    }
    res.json({ matched });
  } catch(e) { res.status(500).json({error:e.message}); }
};

exports.getMatches   = async (req, res) => { try { const m = await Match.find({$or:[{user1Id:req.user._id},{user2Id:req.user._id}]}).populate('user1Id user2Id','-passwordHash'); res.json({matches:m}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.discover     = async (req, res) => { try { const s=await Swipe.find({swiperId:req.user._id}).select('targetUserId'); const ids=s.map(x=>x.targetUserId); const u=await User.find({_id:{$ne:req.user._id,$nin:ids},isBanned:false}).select('-passwordHash').limit(20); res.json({users:u}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.getRooms     = async (req, res) => { try { const f=req.query.category?{category:req.query.category}:{}; const r=await StudyRoom.find(f).populate('participants','name'); res.json({rooms:r}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.createRoom   = async (req, res) => { try { const {roomName,category,icon,color,maxParticipants}=req.body; if(!roomName||!category) return res.status(400).json({error:'roomName and category required'}); const r=await StudyRoom.create({roomName,category,icon,color,maxParticipants,creatorId:req.user._id,participants:[req.user._id]}); res.status(201).json({room:r}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.joinRoom     = async (req, res) => { try { const r=await StudyRoom.findById(req.params.id); if(!r) return res.status(404).json({error:'Room not found'}); if(r.participants.length>=r.maxParticipants) return res.status(400).json({error:'Room is full'}); if(!r.participants.includes(req.user._id)){ r.participants.push(req.user._id); await r.save(); } res.json({room:r}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.leaveRoom    = async (req, res) => { try { await StudyRoom.findByIdAndUpdate(req.params.id,{$pull:{participants:req.user._id}}); res.json({message:'Left room'}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.getRoomMessages = async (req, res) => { try { const m=await RoomMessage.find({roomId:req.params.id}).populate('senderId','name color emoji').sort({createdAt:1}).limit(100); res.json({messages:m}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.getConversation = async (req, res) => { try { const m=await Message.find({$or:[{senderId:req.user._id,receiverId:req.params.userId},{senderId:req.params.userId,receiverId:req.user._id}]}).sort({createdAt:1}).limit(100); await Message.updateMany({senderId:req.params.userId,receiverId:req.user._id,read:false},{read:true}); res.json({messages:m}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.sendMessage  = async (req, res) => { try { const {receiverId,content}=req.body; if(!receiverId||!content) return res.status(400).json({error:'receiverId and content required'}); const m=await Message.create({senderId:req.user._id,receiverId,content}); res.status(201).json({message:m}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.saveScore    = async (req, res) => { try { const {gameType,score,level,language}=req.body; const e=await GameScore.create({userId:req.user._id,gameType,score,level,language}); if(score>=100&&!req.user.badges.includes('game_master')) await User.findByIdAndUpdate(req.user._id,{$addToSet:{badges:'game_master'}}); res.status(201).json({entry:e}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.getLeaderboard = async (req, res) => { try { const f=req.query.gameType?{gameType:req.query.gameType}:{}; const s=await GameScore.find(f).populate('userId','name color emoji').sort({score:-1}).limit(20); res.json({scores:s}); } catch(e){ res.status(500).json({error:e.message}); } };
exports.endSession   = async (req, res) => { try { const {sessionId,duration}=req.body; if(sessionId) await StudySession.findByIdAndUpdate(sessionId,{status:'ended',endTime:new Date(),duration}); const dh=(duration||0)/3600; const user=await User.findById(req.user._id); const nh=user.studyHours+dh; const today=new Date().toDateString(); const last=user.lastStudyDate?new Date(user.lastStudyDate).toDateString():null; const yest=new Date(Date.now()-86400000).toDateString(); let ns=user.studyStreak; if(last===yest) ns+=1; else if(last!==today) ns=1; const badges=[...user.badges]; if(!badges.includes('first_session')) badges.push('first_session'); if(ns>=7&&!badges.includes('streak_7')) badges.push('streak_7'); if(ns>=30&&!badges.includes('streak_30')) badges.push('streak_30'); if(nh>=10&&!badges.includes('hours_10')) badges.push('hours_10'); if(nh>=100&&!badges.includes('hours_100')) badges.push('hours_100'); await User.findByIdAndUpdate(req.user._id,{studyHours:nh,studyStreak:ns,lastStudyDate:new Date(),badges}); res.json({message:'Session ended',studyHours:nh,studyStreak:ns,badges}); } catch(e){ res.status(500).json({error:e.message}); } };
