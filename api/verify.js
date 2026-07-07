const { initializeApp, getApps } = require("firebase/app");
const { getDatabase, ref, get, set, child } = require("firebase/database");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Prevent duplicate initialization in serverless environments
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(firebaseApp);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { botname, userid } = req.body;
  if (!botname || !userid) {
    return res.status(400).json({ status: 'fail', message: 'Missing parameters' });
  }

  // Pure Server-Side Secure IP Collection (Client isse spoof nahi kar sakta)
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";

  try {
    const dbRef = ref(db);
    const botSnapshot = await get(child(dbRef, `${botname}`));
    let ipExists = false;

    if (botSnapshot.exists()) {
      const allUsers = botSnapshot.val();
      for (const key in allUsers) {
        if (allUsers[key].ip === userIp && allUsers[key].status === "success") {
          ipExists = true;
          break;
        }
      }
    }

    if (ipExists) {
      // 3 clean items updated in database
      await set(ref(db, `${botname}/${userid}`), {
        status: "fail",
        ip: userIp,
        timestamp: Date.now()
      });
      return res.status(200).json({ status: 'fail' });
    } else {
      // 3 clean items saved in database
      await set(ref(db, `${botname}/${userid}`), {
        status: "success",
        ip: userIp,
        timestamp: Date.now()
      });
      return res.status(200).json({ status: 'success' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'fail', error: error.message });
  }
};
