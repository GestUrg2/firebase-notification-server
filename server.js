const express = require("express");

const {
    initializeApp,
    cert
} = require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");

const app = express();

app.use(express.json());


// 🔥 Initialisation Firebase Admin
initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
});


// 🔔 Firebase Cloud Messaging
const messaging = getMessaging();


app.get("/", (req, res) => {
    res.send("🚀 Serveur de notifications opérationnel");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});