import express from "express"
import {createServer} from "http"
import  {Server}  from "socket.io";

const app = express()
const httpserver = createServer(app)

const io = new Server(httpserver,  {
    cors: {
      origin: "http://127.0.0.1:5500",
      methods: ["GET", "POST"]
    }
  })

const users = {}

io.on("connection", (socket)=>{
    socket.on("new-user", function(name){
        console.log(name)
        users[socket.id] = name
        console.log(JSON.stringify(users))
        socket.broadcast.emit("user-joined", name)
    })

    socket.on('message_sent', function(message){
        console.log(message)
        socket.broadcast.emit("new_message", {message : message, name: users[socket.id]})
    })
})

httpserver.listen(3000, ()=>{
    console.log("server is running")
})