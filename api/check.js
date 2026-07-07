const { initializeApp, getApps } = require("firebase/app");
const { getDatabase, ref, get, child } = require("firebase/database");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(firebaseApp);

module.exports = async (req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { botname, userid } = req.query;

  if (!botname || !userid) {
    return res.status(200).json({ status: "fail" });
  }

  try {
    const dbRef = ref(db);
    
    // FIX: Yahan se 'dbname' hata kar sirf 'botname' kar diya hai
    const snapshot = await get(child(dbRef, `${botname}/${userid}`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Yeh exact aapka saved status (success/fail) return karega ka bina crash huye
      return res.status(200).json({ status: data.status }); 
    } else {
      return res.status(200).json({ status: "pending" });
    }
  } catch (error) {
    // Agar koi real internal database error aaye tabhi yeh fail dega
    return res.status(200).json({ status: "fail" });
  }
};
