import express from "express"
import { createServer } from "http"
import { Server } from "socket.io";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import { initializeApp } from "firebase/app";
import { getFirestore, getDoc, doc, setDoc, collection, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import path from "path";
import { fileURLToPath } from 'url';

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
    console.log(username, password)
    const docSnap = await getDoc(doc(db, "users", username))

    if (docSnap.data()) {
        const user = docSnap.data()
        console.log(user)

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
    let groups = []
    let previouschats = []
    let invites = []

    await updateDoc(doc(db, "users", socket.user_name), {
        last_seen: "online"
    })

    socket.join(socket.user_name)

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

    const docSnap = await getDoc(doc(db, "users", socket.user_name));
    const act_data = docSnap.data()

    previouschats = act_data.previous_chats
    console.log("previous chats", previouschats)

    groups = act_data.groups
    console.log("groups", groups)

    invites = act_data.invites
    console.log(invites)

    socket.emit("previous_chats", previouschats)

    if (groups) {
        socket.emit("groups", groups)
        for (var i = 0; i < groups.length; i++) {
            socket.join(groups[i])
        }
    }
    else {
        console.log("user is not present in any groups")
    }

    if (invites) {
        socket.emit("invites", invites)
    }
    else {
        console.log("user doesnt have any invites")
    }

    socket.on("get_chat", async (other_id) => {
        console.log(other_id)

        let docSnap = await getDoc(doc(db, "chats", socket.user_name + other_id))

        if (docSnap.data()) {
            console.log("socket + other", docSnap.data())
            const act_data = docSnap.data()
            const arr_prev_chat = act_data.act_chats
            socket.emit("prev_message", arr_prev_chat)
        }
        else {
            let docSnap = await getDoc(doc(db, "chats", other_id + socket.user_name))
            if (docSnap.data()) {
                console.log("other + socket", docSnap.data())
                const act_data = docSnap.data()
                const arr_prev_chat = act_data.act_chats
                socket.emit("prev_message", arr_prev_chat)
            }
        }
    })

    socket.on("disconnect", async () => {
        await updateDoc(doc(db, "users", socket.user_name), {
            last_seen: Date.now()
        })
    })
})

httpserver.listen(3000, () => {
    console.log("server is running")
})