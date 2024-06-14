import express from "express"
import { createServer } from "http"
import { Server } from "socket.io";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, setDoc, collection, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import path from "path";
import { fileURLToPath } from 'url';
import exp from "constants";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); 

dotenv.config()

const app = express()
const httpserver = createServer(app)

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

const firebase = initializeApp(firebaseConfig);
const db = getFirestore(firebase)

app.use(bodyParser.json())
// handling cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

// app.use(express.static('../public'))
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

//login route
app.post("/login", async function (req, res) {

    const username = req.body.username
    const password = req.body.password
    // console.log(username, password)
    const docSnap = await getDoc(doc(db, "users", username))

    if (docSnap.data()) {
        const user = docSnap.data()
        // console.log(user)

        if (password == user.password) {
            var response = {
                username: user.userid,
                login_status: true
            }
            res.send(JSON.stringify(response))
        }
        else {
            var response = {
                login_status: false
            }
            res.send(JSON.stringify(response))
        }
    }
    else {
        var response = {
            username: "Invalid"
        }
        res.send(JSON.stringify(response))
    }
})

//signup route
app.post("/signup", async function (req, res) {
    const username = req.body.username
    const password = req.body.password
    const name = req.body.name
    const email = req.body.email

    const docSnap = await getDoc(doc(db, "users", username))

    if (docSnap.data()) {
        var response = {
            alreadyexists: true
        }
        console.log(response)
        res.send(JSON.stringify(response))
    }
    else {
        await setDoc(doc(db, "users", username), {
            name: name,
            userid: username,
            password: password,
            email: email
        })
        var response = {
            alreadyexists: false,
            user_created: true
        }
        console.log(response)
        res.send(JSON.stringify(response))
    }

})

//socket server for socket initialization
const io = new Server(httpserver, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
})

io.use((socket, next) => {
    const user_name = socket.handshake.auth.user_name;
    // console.log(user_name)
    socket.user_name = user_name
    next()
});

io.on("connection", async (socket) => {
    const users = []
    const previouschats = []
    const querySnapshot1 = await getDocs(collection(db, "users"));

    querySnapshot1.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots

        const act_data = doc.data()
        const userid = act_data.userid
        users.push(userid)
        console.log(userid)
        // console.log(doc.id, " => ", doc.data());
    });
    console.log(socket.user_name)

    socket.emit("all_users", users)
    socket.broadcast.emit("update_users", users)

    const querySnapshot2 = await getDocs(collection(db, "users", socket.user_name, "chats"));
    querySnapshot2.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.data());
        const prev_chats = doc.data()
        console.log(prev_chats)
        // previouschats.push(prev_chats)
        // console.log("previous chats",previouschats)
        const arr_prev_chat = prev_chats.act_chats;
        // for (var i = 0; i < arr_prev_chat.length; i++) {
        //     previouschats.push(arr_prev_chat[i])
        // }
        previouschats.push(arr_prev_chat)
        // previouschats.push(arr_prev_chat)
        // console.log(previouschats)
    });
    console.log(previouschats)
    // var date = new Date(previouschats[0].timestamp)
    // console.log(date)

    socket.emit("previous_chats", previouschats)

    socket.join(socket.user_name)

    socket.on("private_message", async (details) => {
        const receiver_id = details.receiver_id
        const sender_id = socket.user_name
        const message = details.message
        const time = Date.now()

        const docRef = doc(db, "users", receiver_id, "chats", sender_id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            console.log("updating", receiver_id, "chats", sender_id)
            await updateDoc(doc(db, "users", receiver_id, "chats", sender_id), {
                act_chats: arrayUnion({
                    message: message,
                    sender_id: sender_id,
                    receiver_id: receiver_id,
                    timestamp: time
                })
            });
        }
        else {
            // docSnap.data() will be undefined in this case
            console.log("setting", receiver_id, "chats", sender_id)
            await setDoc(doc(db, "users", receiver_id, "chats", sender_id), {
                act_chats: [{
                    message: message,
                    sender_id: sender_id,
                    receiver_id: receiver_id,
                    timestamp: time
                }]
            })
        }

        const docRef1 = doc(db, "users", sender_id, "chats", receiver_id);
        const docSnap1 = await getDoc(docRef1);

        if (docSnap1.exists()) {
            console.log("Document data:", docSnap.data());
            console.log("updating", sender_id, "chats", receiver_id)
            await updateDoc(doc(db, "users", sender_id, "chats", receiver_id), {
                act_chats: arrayUnion({
                    message: message,
                    sender_id: sender_id,
                    receiver_id: receiver_id,
                    timestamp: time
                })
            });
        }
        else {
            // docSnap.data() will be undefined in this case
            console.log("setting", sender_id, "chats", receiver_id)
            await setDoc(doc(db, "users", sender_id, "chats", receiver_id), {
                act_chats: [{
                    message: message,
                    sender_id: sender_id,
                    receiver_id: receiver_id,
                    timestamp: time
                }]
            })
        }

        const complete_message = {
            receiver_id: receiver_id,
            sender_id: sender_id,
            message: message,
            time: time
        }
        console.log(complete_message)
        socket.to(receiver_id).emit("new_message", complete_message)
    })
})

httpserver.listen(3000, () => {
    console.log("server is running")
})