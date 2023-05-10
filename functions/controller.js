// Cloud Function
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.getUsers = functions.https.onRequest(async (req, res) => {
    const data = await admin.firestore().collection('users').get();

    data.docs.forEach(e => res.send(e.data()));
});
