var originserver = window.location.origin
const socket = io(originserver, { autoConnect: false })
var client_users = []
var previous_chats = []
var client_groups = []
const user_name = sessionStorage.getItem('username')
// console.log(user_name)

var current_chat_name = ""


var audio = new Audio('./ding.mp3');

socket.auth = { user_name }

let previous_id = ""

function get_user_chats(element) {
    current_chat_name = element
    document.getElementById("act_chat_area").innerHTML = ""
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
    socket.emit("get_chat", element)
}

function create_chats(act_chats) {
    var one_user_chat = ""
    for(var i = 0; i<act_chats.length; i ++){
        if(act_chats[i].sender_id == user_name){
            one_user_chat = one_user_chat + `<div class="positioning">
                        <div class="msg_sent">${act_chats[i].message}</div>
                    </div>`
        }
        else if (act_chats[i].receiver_id == user_name) {
            one_user_chat = one_user_chat + `<div class="msg_rcvd">${act_chats[i].message}</div>`
        }
    }
    document.getElementById("act_chat_area").innerHTML = one_user_chat
}

function create_prev_button(chat_name) {
    for (var i = 0; i < chat_name.length; i++) {
        if (chat_name[i] == user_name) {
            console.log(skip)
        }
        else {
            const user_button = document.createElement('button')
            user_button.innerText = chat_name[i]
            user_button.id = chat_name[i]
            user_button.addEventListener('click', function () {
                get_user_chats(this.id);
            })
            document.getElementById("prev_user_list").append(user_button)
        }
    }
}

if (user_name == "" || user_name == undefined) {
    console.error("username is invalid")
    window.open(originserver, "_self")
}
else {
    socket.connect()

    socket.onAny((event, ...args) => {
        console.log(event, args);
    });

    document.getElementById("username_id").innerHTML = user_name
    socket.on("all_users", (users) => {
        client_users = users
        console.log("all_users", users)
    })

    socket.on("update_users", (users) => {
        client_users = users
        console.log("updates_users", client_users)
    })

    socket.on("previous_chats", (prev_chats) => {
        previous_chats = prev_chats
        console.log(previous_chats)
        create_prev_button(previous_chats)
    })

    socket.on("groups", (groups) => {
        client_groups = groups
        create_prev_button(client_groups)
    })

    socket.on("prev_message", (act_chats) => {
        create_chats(act_chats)
    })

}





