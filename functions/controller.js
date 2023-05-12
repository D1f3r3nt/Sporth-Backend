// Cloud Function
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// ==========
// Eventos
// ==========

exports.event_all = functions.https.onRequest(async (req, res) => {
    const result = await admin.firestore()
    .collection('eventos')
    .get();

    let eventos = result.docs.map(res => JSON.parse(JSON.stringify(res.data())));

    for (let i = 0; i < eventos.length; i++) {
        const evento = eventos[i];
        evento.anfitrion = await getUser(evento.anfitrion);

        let participantes = [];
        for (let j = 0; j < evento.participantes.length; j++) {
            let participante = evento.participantes[j];

            participantes.push(await getUser(participante));
        }
        evento.participantes = participantes;
    }

    res.send(eventos);
});

exports.event_one = functions.https.onRequest(async (req, res) => {
    const idEvent = req.query.idEvent;

    let evento = await getEvent(idEvent);

    evento.anfitrion = await getUser(evento.anfitrion);

    let participantes = [];
    for (let j = 0; j < evento.participantes.length; j++) {
        let participante = evento.participantes[j];

        participantes.push(await getUser(participante));
    }
    evento.participantes = participantes;

    res.send(evento);
});

exports.events_by_anfitrion = functions.https.onRequest(async (req, res) => {
    const idAnfitrion = req.query.idAnfitrion;

    const result = await admin.firestore()
    .collection('eventos')
    .where('anfitrion', '==', idAnfitrion)
    .get();

    let eventos = result.docs.map(res => JSON.parse(JSON.stringify(res.data())));
    
    for (let i = 0; i < eventos.length; i++) {
        const evento = eventos[i];
        evento.anfitrion = await getUser(evento.anfitrion);

        let participantes = [];
        for (let j = 0; j < evento.participantes.length; j++) {
            let participante = evento.participantes[j];

            participantes.push(await getUser(participante));
        }
        evento.participantes = participantes;
    }

    res.send(eventos);
});

exports.event_save = functions.https.onRequest(async (req, res) => {
    const evento = req.body;
    await admin.firestore().collection('eventos').doc().set(evento);
    res.sendStatus(200);
});

exports.event_inscribe = functions.https.onRequest(async (req, res) => {
    const idEvent = req.query.idEvent;
    const idUser = req.query.idUser;

    const evento = await getEvent(idEvent);
    evento.participantes.push(idUser);

    await admin.firestore().collection('eventos').doc(idEvent).update(evento);
    res.sendStatus(200);
});

// ==========
// Chats
// ==========

exports.chat_all = functions.https.onRequest(async (req, res) => {
    const result = await admin.firestore()
    .collection('chats')
    .get();

    let chats = result.docs.map(res => JSON.parse(JSON.stringify(res.data())));

    for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];

        let anfitriones = [];
        for (let j = 0; j < chat.anfitriones.length; j++) {
            let anfitrion = chat.anfitriones[j];

            anfitriones.push(await getUser(anfitrion));
        }
        chat.anfitriones = anfitriones;
    }

    res.send(chats);
});

exports.chat_by_event = functions.https.onRequest(async (req, res) => {
    const idEvent = req.query.idEvent;

    const result = await admin.firestore()
    .collection('chats')
    .where('idEvent', '==', idEvent)
    .get();

    let chats = result.docs.map(res => JSON.parse(JSON.stringify(res.data())));

    for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];

        let anfitriones = [];
        for (let j = 0; j < chat.anfitriones.length; j++) {
            let anfitrion = chat.anfitriones[j];

            anfitriones.push(await getUser(anfitrion));
        }
        chat.anfitriones = anfitriones;
    }

    res.send(chats);
});

exports.message_by_chat = functions.https.onRequest(async (req, res) => {
    const idChat = req.query.idChat;

    const response = await admin.firestore()
    .collection(`chats/${idChat}/mensajes`)
    .get();

    let mensajes = response.docs.map(res => JSON.parse(JSON.stringify(res.data())));

    for (let i = 0; i < mensajes.length; i++) {
        const mensaje = mensajes[i];
        
        mensaje.editor = await getUser(mensaje.editor);
    }

    res.send(mensajes);
});

exports.any_chat_user = functions.https.onRequest(async (req, res) => {
    const idUser = req.query.idUser;
    const idOtherUser = req.query.idOtherUser;

    const result = await admin.firestore()
    .collection('chats')
    .where('anfitriones', 'array-contains-any', [idUser, idOtherUser])
    .where('idEvent', '==', null)
    .get();

    res.send(result.docs.length == 0. ? '' : result.docs.first.id);
});

exports.chat_save = functions.https.onRequest(async (req, res) => {
    const chat = req.body;
    await admin.firestore().collection('chats').doc().set(chat);
    res.sendStatus(200);
});

exports.chat_update = functions.https.onRequest(async (req, res) => {
    const chat = req.body;
    const idChat = req.query.idChat;

    await admin.firestore().collection('chats').doc(idChat).update(chat);
    res.sendStatus(200);
});

exports.message_save = functions.https.onRequest(async (req, res) => {
    const message = req.body;
    const idChat = req.query.idChat;

    await admin.firestore().collection(`chats/${idChat}/mensajes`).doc().set(message);
    res.sendStatus(200);
});

async function getEvent(idEvent) {
    const documentReference = admin.firestore()
        .collection('eventos')
        .doc(idEvent);

    let evento = await documentReference.get().then(res => JSON.parse(JSON.stringify(res.data())));

    return evento;
}

function getUser(idUser) {
    return admin.firestore()
        .collection('users')
        .doc(idUser)
        .get()
        .then(val => val.data());
}

