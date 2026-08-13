const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

// 🔥 Connexion à Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
});

const messaging = admin.messaging();

app.get("/", (req, res) => {
    res.send("🚀 Serveur de notifications opérationnel");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});