const express = require("express");

const {
    initializeApp,
    cert
} = require("firebase-admin/app");

const {
    getFirestore
} = require("firebase-admin/firestore");

const {
    getMessaging
} = require("firebase-admin/messaging");

const app = express();

app.use(express.json());


// =====================================================
// 🔥 INITIALISATION FIREBASE ADMIN
// =====================================================

initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
});


const db = getFirestore();
const messaging = getMessaging();


// =====================================================
// 🏠 TEST SERVEUR
// =====================================================

app.get("/", (req, res) => {
    res.send("🚀 Serveur de notifications opérationnel");
});


// =====================================================
// 🔔 ENVOI DIRECT À UN TOKEN
// =====================================================

app.post("/send-notification-user", async (req, res) => {

    try {

        const {
            userId,
            title,
            body
        } = req.body;

        if (!userId) {

            return res.status(400).json({
                success: false,
                error: "userId manquant"
            });

        }

        console.log(
            "🔎 Recherche des tokens pour :",
            userId
        );


        // 🔎 Recherche des tokens Firestore
        const snapshot = await db
            .collection("fcmTokens")
            .where("userId", "==", userId)
            .get();


        if (snapshot.empty) {

            console.log(
                "📭 Aucun appareil trouvé"
            );

            return res.json({
                success: true,
                message: "Aucun appareil trouvé",
                devices: 0,
                sent: 0,
                deleted: 0
            });

        }


        const tokens = [];

        snapshot.forEach((document) => {

            const data = document.data();

            if (data.token) {

                tokens.push({
                    token: data.token,
                    documentId: document.id
                });

            }

        });


        console.log(
            `📱 ${tokens.length} appareil(s) trouvé(s)`
        );


        let sent = 0;
        let deleted = 0;


        // 📲 Envoi à chaque appareil
        for (const item of tokens) {

            try {

                await messaging.send({

                    token: item.token,

                    notification: {
                        title: title || "GestUrg2",
                        body: body || "Nouvelle notification"
                    },

                    data: {
                        type: "notification"
                    }

                });


                sent++;

                console.log(
                    "✅ Notification envoyée à :",
                    item.documentId
                );


            } catch (error) {

                console.error(
                    "❌ Erreur token :",
                    item.documentId,
                    error.code
                );


                // 🧹 Suppression des tokens invalides
                if (
                    error.code ===
                        "messaging/registration-token-not-registered" ||
                    error.code ===
                        "messaging/invalid-registration-token"
                ) {

                    await db
                        .collection("fcmTokens")
                        .doc(item.documentId)
                        .delete();

                    deleted++;

                    console.log(
                        "🗑️ Token invalide supprimé :",
                        item.documentId
                    );

                }

            }

        }


        res.json({

            success: true,

            userId: userId,

            devices: tokens.length,

            sent: sent,

            deleted: deleted

        });


    } catch (error) {

        console.error(
            "❌ Erreur générale :",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});

// =====================================================
// 👤 ENVOI À TOUS LES APPAREILS D'UN UTILISATEUR
// =====================================================

app.post("/send-notification-user", async (req, res) => {

    try {

        const {
            userId,
            title,
            body
        } = req.body;


        if (!userId) {

            return res.status(400).json({
                success: false,
                error: "userId manquant"
            });

        }


        console.log(
            "🔎 Recherche des tokens pour :",
            userId
        );


        // 🔎 Recherche des appareils
        const tokensQuery = query(
            collection(db, "fcmTokens"),
            where("userId", "==", userId)
        );


        const snapshot =
            await getDocs(tokensQuery);


        if (snapshot.empty) {

            return res.json({
                success: true,
                message: "Aucun appareil trouvé",
                sent: 0
            });

        }


        const tokens = [];

        snapshot.forEach((document) => {

            const data = document.data();

            if (data.token) {
                tokens.push({
                    token: data.token,
                    documentId: document.id
                });
            }

        });


        console.log(
            `📱 ${tokens.length} appareil(s) trouvé(s)`
        );


        let sent = 0;
        let deleted = 0;


        // =================================================
        // 📲 ENVOI À CHAQUE APPAREIL
        // =================================================

        for (const item of tokens) {

            try {

                await messaging.send({

                    token: item.token,

                    notification: {
                        title: title || "GestUrg2",
                        body: body || "Nouvelle notification"
                    },

                    data: {
                        type: "notification"
                    }

                });


                sent++;

                console.log(
                    "✅ Envoyé à :",
                    item.documentId
                );


            } catch (error) {

                console.error(
                    "❌ Token invalide :",
                    item.documentId,
                    error.code
                );


                // 🧹 Token devenu invalide
                if (
                    error.code ===
                        "messaging/registration-token-not-registered" ||
                    error.code ===
                        "messaging/invalid-registration-token"
                ) {

                 await deleteDoc(
    doc(db, "fcmTokens", item.documentId)
);

                    deleted++;

                }

            }

        }


        res.json({

            success: true,

            userId: userId,

            devices: tokens.length,

            sent: sent,

            deleted: deleted

        });


    } catch (error) {

        console.error(
            "❌ Erreur générale :",
            error
        );


        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// =====================================================
// 🚀 SERVEUR
// =====================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🚀 Serveur lancé sur le port ${PORT}`
        );

    }
);