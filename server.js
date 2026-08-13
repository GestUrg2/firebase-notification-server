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
app.post("/send-notification", async (req, res) => {

    try {

        const { token, title, body } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: "Token FCM manquant"
            });
        }

        const message = {
            token: token,

            notification: {
                title: title || "GestUrg2",
                body: body || "Test de notification 🔔"
            },

            data: {
                type: "test"
            }
        };

        const response = await messaging.send(message);

        console.log("✅ Notification envoyée :", response);

        res.json({
            success: true,
            messageId: response
        });

    } catch (error) {

        console.error(
            "❌ Erreur envoi notification :",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});