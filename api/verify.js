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

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(firebaseApp);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { botname, userid } = req.body;
  if (!botname || !userid) {
    return res.status(400).json({ status: 'fail' });
  }

  // Server-side securely fetching IP and Device info
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
  const userAgent = req.headers['user-agent'] || "Unknown Device";

  try {
    const dbRef = ref(db);
    
    // Step 1: Check if this exact UserID already exists in database
    const userSnapshot = await get(child(dbRef, `${botname}/${userid}`));
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      return res.status(200).json({ status: userData.status, mode: "already" });
    }

    // Step 2: If it's a new user, check if this exact IP + Device combination exists for another verified user
    const botSnapshot = await get(child(dbRef, `${botname}`));
    let deviceExists = false;

    if (botSnapshot.exists()) {
      const allUsers = botSnapshot.val();
      for (const key in allUsers) {
        if (allUsers[key].ip === userIp && allUsers[key].device === userAgent && allUsers[key].status === "success") {
          deviceExists = true;
          break;
        }
      }
    }

    if (deviceExists) {
      // Same device detected trying to verify another user ID -> Block it
      await set(ref(db, `${botname}/${userid}`), {
        status: "fail",
        ip: userIp,
        device: userAgent,
        timestamp: Date.now()
      });
      return res.status(200).json({ status: 'fail', mode: 'new' });
    } else {
      // Fresh unique device -> Verify successfully
      await set(ref(db, `${botname}/${userid}`), {
        status: "success",
        ip: userIp,
        device: userAgent,
        timestamp: Date.now()
      });
      return res.status(200).json({ status: 'success', mode: 'new' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'fail', error: error.message });
  }
};
