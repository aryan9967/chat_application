var originserver = window.location.origin
const socket = io(originserver, { autoConnect: false })
var client_users = []
var previous_chats = []
const user_name = sessionStorage.getItem('username')
// console.log(user_name)

var current_chat_name = ""


var audio = new Audio('./ding.mp3');

socket.auth = { user_name }

// socket.onAny((event, ...args) => {
//     console.log(event, args);
// });

let previous_id = ""
function get_user_chats(element) {
    document.getElementById(element).classList.remove("unread_chat")
    
    if(previous_id == ""){
        document.getElementById(element).classList.add("focused_chat")
        previous_id = element    
    }
    else{
        if(previous_id != element){
            document.getElementById(element).classList.add("focused_chat")
            document.getElementById(previous_id).classList.remove("focused_chat")
            previous_id = element
        }
    }  
   
    // console.log(element)
    current_chat_name = element
    var top_profile = `<div class="top_name"><div class="name">${element}</div></div>
                        <div class="additional_features">
                            <button><i class="fa-solid fa-phone"></i></button>
                            <button><i class="fa-solid fa-video"></i></button>
                            <button><i class="fa-solid fa-bars"></i></button>
                        </div>`

    const bottom_message = `<div class="enter">
                                <input type="text" placeholder="Type a message..." class="text" id="message_sent_con">
                                    <button id="message_send_btn">
                                        <i class="fa-solid fa-paper-plane"></i>
                                    </button>
                            </div>`

    document.getElementById("top_profile").innerHTML = top_profile
    document.getElementById("enter_area_id").innerHTML = bottom_message
    const msg_button = document.getElementById("message_send_btn")
    msg_button.addEventListener('click', send_message)
    var one_user_chat = ""
    // console.log("inside get user chat", previous_chats)
    for (var i = 0; i < previous_chats.length; i++) {
        single_chat = previous_chats[i]
        if (single_chat[0].sender_id == current_chat_name || single_chat[0].receiver_id == current_chat_name) {
            for (var j = 0; j < single_chat.length; j++) {
                var one_message = single_chat[j]
                if (one_message.sender_id == user_name) {
                    one_user_chat = one_user_chat + `<div class="positioning">
                        <div class="msg_sent">${one_message.message}</div>
                    </div>`
                }
                else if (one_message.receiver_id == user_name) {
                    one_user_chat = one_user_chat + `<div class="msg_rcvd">${one_message.message}</div>`
                }
            }
        }
    }
    document.getElementById("act_chat_area").innerHTML = one_user_chat
}
if (user_name == "" || user_name == undefined) {
    console.error("username is invalid")
    window.open(originserver, "_self")
}
else {
    socket.connect()

    document.getElementById("username_id").innerHTML = user_name

    socket.on("all_users", (users) => {
        client_users = users
        // console.log(users)
        for (let i = 0; i < client_users.length; i++) {
            if (client_users[i] == user_name) {
                // console.log("skip")
            }
            else {

                const user_button = document.createElement('button')
                user_button.innerText = client_users[i]
                user_button.id = client_users[i]
                user_button.addEventListener('click', function () {
                    get_user_chats(this.id);
                })
                document.getElementById("prev_user_list").append(user_button)
            }
        }
    })

    socket.on("previous_chats", (chats) => {
        // console.log(chats)
        previous_chats = chats

        // var latest_time = 0
        // for(let i=0; i<previous_chats.length; i++){
        //     var single_chat1 = previous_chats[i]
        //     console.log(single_chat1)
        //     var last_chat_of_a_user = single_chat1[single_chat1.length - 1]
        //     console.log(last_chat_of_a_user)
        //     if(last_chat_of_a_user.timestamp > latest_time){
        //         var temp = single_chat1
        //         previous_chats[i]=previous_chats[i+1]
        //         previous_chats[i+1]= temp
        //     }
        //     latest_time = last_chat_of_a_user.timestamp
        //     // console.log(latest_time)
        // }
        // // previous_chats.reverse()
        // console.log("sorted_chats(latest_first)", previous_chats)
        //new 
        // for (let i = 0; i < previous_chats.length; i++) {
        //     var single_chat = previous_chats[i]
        //     console.log(single_chat)
        //     // if (user_name == single_chat[0].receiver_id || user_name == single_chat[0].sender_id) {

        //     if (user_name == single_chat[0].receiver_id) {
        //         var other_user_id = single_chat[0].sender_id

        //         const user_button = document.createElement('button')
        //         user_button.innerText = other_user_id
        //         user_button.id = other_user_id
        //         user_button.addEventListener('click', function () {
        //             get_user_chats(this);
        //         })
        //         document.getElementById("prev_user_list").append(user_button)
        //     }
        //     else if (user_name == single_chat[0].sender_id) {
        //         var other_user_id = single_chat[0].receiver_id

        //         const user_button = document.createElement('button')
        //         user_button.innerText = other_user_id
        //         user_button.id = other_user_id
        //         user_button.addEventListener('click', function () {
        //             get_user_chats(this);
        //         })
        //         document.getElementById("prev_user_list").append(user_button)
        //     }

        //     // }
        // }

        // date = new Date(chats[0].timestamp)
        // console.log(date)
    })
    socket.on("update_users", (users) => {
        for (var i = 0; i < users.length; i++) {
            var counter = 0
            for (var j = 0; j < client_users.length; j++) {
                if (client_users[j] == users[i]) {
                    counter = 1
                    break
                }
            }
            if (counter == 0) {
                client_users.push(users[i])
                const user_button = document.createElement('button')
                user_button.innerText = users[i]
                user_button.id = users[i]
                user_button.addEventListener('click', function () {
                    get_user_chats(this.id);
                })
                document.getElementById("prev_user_list").append(user_button)
            }
            // else {
            //     console.log("already present")
            // }
        }
        // client_users = users
        // console.log("updated user list", client_users)
        // for (let i = 0; i < client_users.length; i++) {
        //     if (client_users[i] == user_name) {
        //         console.log("skip")
        //     }
        //     else {

        //         const user_button = document.createElement('button')
        //         user_button.innerText = client_users[i] 
        //         user_button.id = client_users[i] 
        //         user_button.addEventListener('click', function () {
        //             get_user_chats(this);
        //         })
        //         document.getElementById("prev_user_list").append(user_button)
        //     }
        // }
    })
    socket.on("new_message", (message) => {
        // console.log("private message is received")

        audio.play();
        // console.log(message)
        //check is used for checking if there is the username of chat in database if not present we are directly pushing it
        //it is used outside the loop to avoid multiple push and waits for the loop to end
        var check = 0
        for (var i = 0; i < previous_chats.length; i++) {
            var single_chat = previous_chats[i]
            if (single_chat[0].sender_id == message.sender_id || single_chat[0].receiver_id == message.sender_id) {
                single_chat.push(message)
                check = 1
                break
            }

        }
        if (check == 0) {
            var temp_arr = []
            temp_arr.push(message)
            previous_chats.push(temp_arr)
        }
        if (current_chat_name == message.sender_id) {
            get_user_chats(current_chat_name)
        }
        else {
            document.getElementById(message.sender_id).classList.add("unread_chat")
        }
    })
}

function send_message() {
    const message = document.getElementById("message_sent_con").value
    // console.log(message)
    document.getElementById("message_sent_con").value = ""
    // act_chats = act_chats + `<div class="positioning"><div class="msg_sent">${message}</div></div>`
    // act_chat_area.innerHTML = act_chats
    const details = {
        receiver_id: current_chat_name,
        // user_name: user_name,
        message: message
    }
    // console.log(socket.connected)
    if (socket.connected) {
        console.log("private message is sent")
        socket.emit("private_message", details)
        const time = Date.now()
        const new_message = {
            sender_id: user_name,
            receiver_id: current_chat_name,
            message: message,
            timestamp: time
        }
        //check is used for checking if there is the username of chat in database if not present we are directly pushing it
        //it is used outside the loop to avoid multiple push and waits for the loop to end
        var check = 0
        for (var i = 0; i < previous_chats.length; i++) {
            var single_chat = previous_chats[i]
            if (single_chat[0].sender_id == current_chat_name || single_chat[0].receiver_id == current_chat_name) {
                single_chat.push(new_message)
                check = 1
                break
            }
        }
        if (check == 0) {
            var temp_arr = []
            temp_arr.push(new_message)
            previous_chats.push(temp_arr)
        }
        get_user_chats(current_chat_name)
    }
    else {
        console.error("user is not logged in")
    }

}
// const act_chat_area = document.getElementById("act_chat_area")

// var act_chats = ''
// socket.on("user-joined", (name) => {
//     act_chats = act_chats + `<div class="new_joinee_msg"><p>${name} has joined the chat</p></div>`
//     act_chat_area.innerHTML = act_chats
// })

// socket.on("new_message", (message) => {
//     act_chats = act_chats + `<div class="msg_rcvd">${message.message}</div>`
//     act_chat_area.innerHTML = act_chats
// })



