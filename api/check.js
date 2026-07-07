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
  // CORS taaki aapka bot ise kahin se bhi hit kar sake
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/plain'); // Plain text response

  const { botname, userid } = req.query;

  if (!botname || !userid) {
    return res.status(200).send("fail");
  }

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `${botname}/${userid}`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      return res.status(200).send(data.status); // Output: Only "success" or "fail"
    } else {
      return res.status(200).send("pending");   // Output: Only "pending"
    }
  } catch (error) {
    return res.status(200).send("fail");
  }
};
