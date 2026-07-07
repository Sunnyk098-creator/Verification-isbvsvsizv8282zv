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
  // CORS Headers for API to be accessible from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { botname, userid } = req.query;

  if (!botname || !userid) {
    return res.status(400).json({
      ok: false,
      status: "error",
      message: "botname or userid is missing in the URL parameters"
    });
  }

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `${botname}/${userid}`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Proper JSON Response for Bots
      return res.status(200).json({
        ok: true,
        status: data.status, // will be "success" or "fail"
        userid: userid,
        botname: botname,
        timestamp: data.timestamp
      });
    } else {
      // If user hasn't verified yet
      return res.status(200).json({
        ok: true,
        status: "pending",
        userid: userid,
        botname: botname
      });
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      status: "error",
      message: "Database connection failed"
    });
  }
};
