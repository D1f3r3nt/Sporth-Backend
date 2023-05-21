// Cloud Function
const functions = require("firebase-functions");
// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

// ==========
// Eventos
// ==========

exports.event_all = functions.https.onRequest(async (req, res) => {
  const result = await admin.firestore().collection("eventos").get();

  let eventos = result.docs.map((res) =>
    JSON.parse(JSON.stringify(res.data())),
  );

  eventos = eventos
      .filter((evento) => parseInt(evento.maximo) >
      (evento.participantes.length + 1));

  for (let i = 0; i < eventos.length; i++) {
    const evento = eventos[i];
    evento.anfitrion = await getUser(evento.anfitrion);

    const participantes = [];
    for (let j = 0; j < evento.participantes.length; j++) {
      const participante = evento.participantes[j];

      participantes.push(await getUser(participante));
    }
    evento.participantes = participantes;
  }

  res.send(eventos);
});

exports.event_one = functions.https.onRequest(async (req, res) => {
  const idEvent = req.query.idEvent;

  const evento = await getEvent(idEvent);

  evento.anfitrion = await getUser(evento.anfitrion);

  const participantes = [];
  for (let j = 0; j < evento.participantes.length; j++) {
    const participante = evento.participantes[j];

    participantes.push(await getUser(participante));
  }
  evento.participantes = participantes;

  res.send(evento);
});

exports.events_by_anfitrion = functions.https.onRequest(async (req, res) => {
  const idAnfitrion = req.query.idAnfitrion;

  const result = await admin
      .firestore()
      .collection("eventos")
      .where("anfitrion", "==", idAnfitrion)
      .get();

  const eventos = result.docs.map((res) =>
    JSON.parse(JSON.stringify(res.data())),
  );

  for (let i = 0; i < eventos.length; i++) {
    const evento = eventos[i];
    evento.anfitrion = await getUser(evento.anfitrion);

    const participantes = [];
    for (let j = 0; j < evento.participantes.length; j++) {
      const participante = evento.participantes[j];

      participantes.push(await getUser(participante));
    }
    evento.participantes = participantes;
  }

  res.send(eventos);
});

exports.event_save = functions.https.onRequest(async (req, res) => {
  const evento = JSON.parse(req.body);
  const docRef = admin.firestore().collection("eventos").doc();
  evento.id = docRef.id;

  await docRef.set(evento);
  res.sendStatus(200);
});

exports.event_inscribe = functions.https.onRequest(async (req, res) => {
  const idEvent = req.query.idEvent;
  const idUser = req.query.idUser;

  const evento = await getEvent(idEvent);
  evento.participantes.push(idUser);

  await admin.firestore().collection("eventos").doc(idEvent).update(evento);
  res.sendStatus(200);
});

// ==========
// Chats
// ==========

exports.chat_all = functions.https.onRequest(async (req, res) => {
  const result = await admin.firestore().collection("chats").get();

  const chats = result.docs.map((res) =>
    JSON.parse(JSON.stringify(res.data())),
  );

  for (let i = 0; i < chats.length; i++) {
    const chat = chats[i];

    const anfitriones = [];
    for (let j = 0; j < chat.anfitriones.length; j++) {
      const anfitrion = chat.anfitriones[j];

      anfitriones.push(await getUser(anfitrion));
    }
    chat.anfitriones = anfitriones;
  }

  res.send(chats);
});

exports.chat_by_event = functions.https.onRequest(async (req, res) => {
  const idEvent = req.query.idEvent;

  const result = await admin
      .firestore()
      .collection("chats")
      .where("idEvent", "==", idEvent)
      .get();

  const chats = result.docs.map((res) =>
    JSON.parse(JSON.stringify(res.data())),
  );

  for (let i = 0; i < chats.length; i++) {
    const chat = chats[i];

    const anfitriones = [];
    for (let j = 0; j < chat.anfitriones.length; j++) {
      const anfitrion = chat.anfitriones[j];

      anfitriones.push(await getUser(anfitrion));
    }
    chat.anfitriones = anfitriones;
  }

  res.send(chats);
});

exports.any_chat_user = functions.https.onRequest(async (req, res) => {
  const idUser = req.query.idUser;
  const idOtherUser = req.query.idOtherUser;

  const result = await admin
      .firestore()
      .collection("chats")
      .where("anfitriones", "array-contains", [idUser, idOtherUser])
      .where("idEvent", "==", null)
      .get();

  functions.logger.log(result.docs.length == 0);

  res.send(result.docs.length == 0 ? "" : result.docs[0].id);
});

exports.chat_save = functions.https.onRequest(async (req, res) => {
  const chat = JSON.parse(req.body);
  const docRef = admin.firestore().collection("chats").doc();
  chat.idChat = docRef.id;

  await docRef.set(chat);
  res.sendStatus(200);
});

exports.chat_update = functions.https.onRequest(async (req, res) => {
  const chat = JSON.parse(req.body);
  const idChat = req.query.idChat;

  await admin.firestore().collection("chats").doc(idChat).update(chat);
  res.sendStatus(200);
});

exports.message_save = functions.https.onRequest(async (req, res) => {
  const message = JSON.parse(req.body);
  const idChat = req.query.idChat;

  await admin
      .firestore()
      .collection(`chats/${idChat}/mensajes`)
      .doc()
      .set(message);
  res.sendStatus(200);
});

// ==========
// User
// ==========

exports.user_one = functions.https.onRequest(async (req, res) => {
  const idUser = req.query.idUser;

  const user = await getUser(idUser);

  res.send(user);
});

exports.user_exists = functions.https.onRequest(async (req, res) => {
  const idUser = req.query.idUser;
  const userReference = admin.firestore().collection("users").doc(idUser);

  const exists = await userReference.get().then((val) => val.exists);

  res.send(exists);
});

exports.username_exists = functions.https.onRequest(async (req, res) => {
  const username = req.query.username;

  const response = await admin
      .firestore()
      .collection("users")
      .where("username", "==", username)
      .get();

  const exists = response.docs.length != 0;

  res.send(exists);
});

exports.user_save = functions.https.onRequest(async (req, res) => {
  const user = JSON.parse(req.body);
  await admin.firestore().collection("users").doc(user.idUser).set(user);
  res.sendStatus(200);
});

exports.user_update = functions.https.onRequest(async (req, res) => {
  const user = JSON.parse(req.body);

  await admin
      .firestore()
      .collection("users")
      .doc(user.idUser)
      .update(user);
  res.sendStatus(200);
});

exports.seguidor_upgrade = functions.https.onRequest(async (req, res) => {
  const user = JSON.parse(req.body);
  const idFollower = req.query.idFollower;

  user.seguidos.push(idFollower);
  await admin
      .firestore()
      .collection("users")
      .doc(user.idUser)
      .update(user);

  const otherBadUser = await getUser(idFollower);

  const otherUser = JSON.parse(JSON.stringify(otherBadUser));

  otherUser.seguidores.push(user.idUser);
  await admin
      .firestore()
      .collection("users")
      .doc(otherUser.idUser)
      .update(otherUser);

  res.sendStatus(200);
});

exports.seguidor_degrade = functions.https.onRequest(async (req, res) => {
  const user = JSON.parse(req.body);
  const idFollower = req.query.idFollower;

  user.seguidos = user.seguidos.filter((users) => users != idFollower);
  await admin
      .firestore()
      .collection("users")
      .doc(user.idUser)
      .update(user);

  const otherBadUser = await getUser(idFollower);

  const otherUser = JSON.parse(JSON.stringify(otherBadUser));

  otherUser.seguidos = otherUser.seguidos.filter(
      (users) => users != user.idUser,
  );
  await admin
      .firestore()
      .collection("users")
      .doc(otherUser.idUser)
      .update(otherUser);

  res.sendStatus(200);
});

exports.user_logro = functions.https.onRequest(async (req, res) => {
  const user = JSON.parse(req.body);
  const idLogro = req.query.idLogro;

  user.logros.push(parseInt(idLogro));
  await admin
      .firestore()
      .collection("users")
      .doc(user.idUser)
      .update(user);

  res.sendStatus(200);
});

exports.maintenceEvents = functions.pubsub
    .schedule("every day 23:55")
    .timeZone("Europe/Madrid")
    .onRun(async (context) => {
      functions.logger.log("Check events");
      const hoy = Date.now();

      const result = await admin.firestore().collection("eventos").get();

      const eventos = result.docs.map((res) => {
        const element = JSON.parse(JSON.stringify(res.data()));
        element.ref = res.ref;
        element.id = res.id;
        return element;
      });

      functions.logger.log(`Eventos ${eventos.length}`);

      const eliminados = eventos.filter((evento) => {
        const fechaString = evento.dia;
        const partesFecha = fechaString.split("/");
        const fecha = new Date(
            partesFecha[2], partesFecha[0]-1, partesFecha[1]);

        return fecha < hoy;
      });
      functions.logger.log(`Eliminados ${eliminados.length}`);

      const batch = admin.firestore().batch();
      for (let i = 0; i < eliminados.length; i++) {
        const eliminar = eliminados[i];

        const result = await admin
            .firestore()
            .collection("chats")
            .where("idEvent", "==", eliminar.id)
            .get();

        functions.logger.log(`Chats eliminados ${result.docs.length}`);

        result.docs.map((res) => {
          batch.delete(res.ref);
          const collection = admin
              .firestore()
              .collection(`chats/${res.id}/mensajes`);

          collection.get()
              .then((val) => val.docs.map((rid) => rid.ref.delete()));
        });

        batch.delete(eliminar.ref);
      }
      return batch.commit();
    });

/**
 * Funcion para recoger un unico evento
 * @param {string} idEvent
 * @return {Map} Devuelve un evento
 */
async function getEvent(idEvent) {
  const documentReference = admin
      .firestore()
      .collection("eventos")
      .doc(idEvent);

  const evento = await documentReference
      .get()
      .then((res) => JSON.parse(JSON.stringify(res.data())));

  return evento;
}

/**
 * Funcion para recoger un unico usuario
 * @param {string} idUser
 * @return {string} Devuelve un usuario
 */
function getUser(idUser) {
  return admin
      .firestore()
      .collection("users")
      .doc(idUser)
      .get()
      .then((val) => val.data());
}
