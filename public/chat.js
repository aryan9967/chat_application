var originserver = window.location.origin
const socket = io(originserver, { autoConnect: false })
var client_users = []
var previous_chats = []
var client_groups = []
var all_chats = []
var other_users = []
var client_invites = []
const user_name = sessionStorage.getItem('username')
// console.log(user_name)

var current_chat_name = ""


var audio = new Audio('./ding.mp3');

socket.auth = { user_name }

let previous_id = ""

function get_user_chats(element) {
    current_chat_name = element
    document.getElementById(element).classList.remove("unread_chat")

    if (previous_id == "") {
        document.getElementById(element).classList.add("focused_chat")
        previous_id = element
    }
    else {
        if (previous_id != element) {
            document.getElementById(element).classList.add("focused_chat")
            document.getElementById(previous_id).classList.remove("focused_chat")
            previous_id = element
        }
    }

    socket.emit("get_user_status", current_chat_name)
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
    document.getElementById("message_send_btn").addEventListener('click', function () {
        send_message();
    })

    var check = 0
    for (var i = 0; i < all_chats.length; i++) {
        single_chat = all_chats[i]
        if (single_chat[0].sender_id == current_chat_name || single_chat[0].receiver_id == current_chat_name) {
            check = 1
            create_chats(single_chat)
            break
        }
    }
    if (check == 0) {
        socket.emit("get_chat", element, true)
    }
}

function create_chats(act_chats) {
    var one_user_chat = ""
    for (var i = 0; i < act_chats.length; i++) {
        if (act_chats[i].sender_id == user_name) {
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
    if(chat_name){
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
        console.log("all_users", users)
        client_users = users
        for (var i = 0; i < client_users.length; i++) {
            if (client_users[i] != user_name) {
                other_users.push(client_users[i])
            }
        }
        console.log("except user", other_users)

        if (previous_chats) {
            for (var i = 0; i < previous_chats.length; i++) {
                var check = 0
                for (var j = 0; j < other_users.length; j++) {
                    if (other_users[j] == previous_chats[i]) {
                        check = 1
                        other_users.splice(j, 1)
                        break
                    }
                }
            }
        }
        console.log("except previous chat", other_users)
    })

    socket.on("update_users", (users) => {
        client_users = users
        console.log("updates_users", client_users)

        other_users = []
        for (var i = 0; i < client_users.length; i++) {
            if (client_users[i] != user_name) {
                other_users.push(client_users[i])
            }
        }
        console.log("except user", other_users)

        if (previous_chats) {
            for (var i = 0; i < previous_chats.length; i++) {
                var check = 0
                for (var j = 0; j < other_users.length; j++) {
                    if (other_users[j] == previous_chats[i]) {
                        check = 1
                        other_users.splice(j, 1)
                        break
                    }
                }
            }
        }
        console.log("except previous chat", other_users)
    })

    socket.on("previous_chats", (prev_chats) => {

        console.log("prev_chats", prev_chats)
        previous_chats = prev_chats
        console.log("previous chats", previous_chats)
        if (previous_chats) {
            create_prev_button(previous_chats)
        }

    })

    socket.on("groups", (groups) => {
        client_groups = groups
        create_prev_button(client_groups)
    })

    socket.on("prev_message", (act_chats, deciding_fac) => {
        var check = 0
        console.log("act_chats", act_chats)
        all_chats.push(act_chats)
        console.log(all_chats)
        if (deciding_fac) {
            create_chats(act_chats)
        }
        // else{
        //     if(act_chats[0].receiver_id == user_name){
        //         document.getElementById(act_chats[0].sender_id).classList.add("unread_chat")
        //     }
        //     else{
        //         document.getElementById(act_chats[0].receiver_id).classList.add("unread_chat")
        //     }
        // }

    })

    socket.on("last_seen", (time) => {
        console.log("last seen", time)
    })

    socket.on("new_message", (message_recd) => {
        audio.play();
        var check1 = 0
        for (var i = 0; i < all_chats.length; i++) {
            single_chat = all_chats[i]
            if (single_chat[0].sender_id == message_recd.sender_id || single_chat[0].receiver_id == message_recd.sender_id) {
                check1 = 1
                break
            }
        }
        if (check1 == 0) {
            socket.emit("get_chat", message_recd.sender_id, false)
        }
        else {
            var check = 0
            console.log(all_chats)
            for (var i = 0; i < all_chats.length; i++) {
                var single_chat = all_chats[i]
                if (single_chat[0].sender_id == message_recd.sender_id || single_chat[0].receiver_id == message_recd.sender_id) {
                    single_chat.push(message_recd)
                    check = 1
                    break
                }

            }
            if (check == 0) {
                var temp_arr = []
                temp_arr.push(message_recd)
                all_chats.push(temp_arr)
            }

        }
        // console.log(message)
        //check is used for checking if there is the username of chat in database if not present we are directly pushing it
        //it is used outside the loop to avoid multiple push and waits for the loop to end
        if (current_chat_name == message_recd.sender_id) {
            create_single_msg(message_recd)
        }
        else {
            document.getElementById(message_recd.sender_id).classList.add("unread_chat")
        }
        // else {
        //     document.getElementById(message.sender_id).classList.add("unread_chat")
        // }
        console.log(all_chats)
    })

    socket.on("invites", (invite_array) => {
        client_invites = invite_array
        console.log("initial client_invites", client_invites)
    })

    socket.on("invite_status", (response, complete_invite) => {
        console.log(response)
        if (response.status) {
            window.alert("Invite sent successfully")
            console.log(complete_invite)
            client_invites.push(complete_invite)
            console.log(client_invites)
            if (document.getElementById("invite_con").style.display == "block") {
                create_invites()
            }
        }
        else {
            window.alert("User was already invited")
        }
    })

    socket.on("new_invite", (response) => {
        audio.play();
        console.log("new_invite", response)
        client_invites.push(response)
        console.log("all_invites", client_invites)
        if (document.getElementById("invite_con").style.display == "block") {
            create_invites()
        }
    })

    socket.on("sent_invite_acptd", (details) => {
        console.log(details.receiver_id, "accepted invite")
        for (var i = 0; i < client_invites.length; i++) {
            if (client_invites[i].receiver_id == details.receiver_id) {
                details = client_invites[i]
                client_invites.splice(i, 1)
                break
            }
        }
        if (document.getElementById("invite_con").style.display == "block") {
            create_invites()
        }
        if (previous_chats == undefined) {
            previous_chats = []
        }
        previous_chats.push(details.receiver_id)

        document.getElementById("prev_user_list").innerHTML = ""
        create_prev_button(previous_chats)
        // create_prev_button(previous_chats)
        if (previous_chats) {
            for (var i = 0; i < previous_chats.length; i++) {
                var check = 0
                for (var j = 0; j < other_users.length; j++) {
                    if (other_users[j] == previous_chats[i]) {
                        check = 1
                        other_users.splice(j, 1)
                        break
                    }
                }
            }
        }
        console.log("except accepted previous chat", other_users)
    })

    socket.on("sent_invite_rej", (details) => {
        console.log(details.receiver_id, "rejected invite")
        for (var i = 0; i < client_invites.length; i++) {
            if (client_invites[i].receiver_id == details.receiver_id) {
                details = client_invites[i]
                client_invites.splice(i, 1)
                break
            }
        }
        if (document.getElementById("invite_con").style.display == "block") {
            create_invites()
        }
    })
}

function send_message() {
    const message = document.getElementById("message_sent_con").value
    console.log("message", message)
    document.getElementById("message_sent_con").value = ""

    const details = {
        receiver_id: current_chat_name,
        message: message,
        type: "text"
    }

    if (socket.connected) {
        console.log("private message is sent")
        socket.emit("private_message", details)
        const time = Date.now()
        const new_message = {
            sender_id: user_name,
            receiver_id: current_chat_name,
            message: message,
            timestamp: time,
            type: "text"
        }
        //check is used for checking if there is the username of chat in database if not present we are directly pushing it
        //it is used outside the loop to avoid multiple push and waits for the loop to end
        var check = 0
        for (var i = 0; i < all_chats.length; i++) {
            var single_chat = all_chats[i]
            if (single_chat[0].sender_id == current_chat_name || single_chat[0].receiver_id == current_chat_name) {
                single_chat.push(new_message)
                check = 1
                break
            }
        }
        console.log(all_chats)
        if (check == 0) {
            var temp_arr = []
            temp_arr.push(new_message)
            all_chats.push(temp_arr)
        }
        create_single_msg(new_message)
    }
    else {
        console.error("user is not logged in")
    }
}

function create_single_msg(new_message) {
    var one_user_chat = document.getElementById("act_chat_area").innerHTML
    if (new_message.sender_id == user_name) {
        one_user_chat = one_user_chat + `<div class="positioning">
                        <div class="msg_sent">${new_message.message}</div>
                    </div>`
        document.getElementById("act_chat_area").innerHTML = one_user_chat
    }
    if (new_message.receiver_id == user_name) {
        one_user_chat = one_user_chat + `<div class="msg_rcvd">${new_message.message}</div>`
        document.getElementById("act_chat_area").innerHTML = one_user_chat
    }
}

function display_user() {
    var search_value = document.getElementById("search_value").value
    if (search_value == "") {
        console.log("empty")
        document.getElementById("prev_user_list").innerHTML = ""
        if (previous_chats) {

            create_prev_button(previous_chats)
        }
    }
    else {
        document.getElementById("prev_user_list").innerHTML = ""
        var case_insensitive = search_value.toLowerCase()
        if (previous_chats) {
            for (var i = 0; i < previous_chats.length; i++) {
                var user_case_insensi = previous_chats[i].toLowerCase()
                if (user_case_insensi.indexOf(case_insensitive) > -1) {
                    console.log("search result private chats", user_case_insensi)
                    create_previous_button(previous_chats[i])
                }
            }
        }

        document.getElementById("prev_user_list").innerHTML += ` <div class="other_users">Other users</div>`
        for (var i = 0; i < other_users.length; i++) {
            var user_case_insensi = other_users[i].toLowerCase()
            if (user_case_insensi.indexOf(case_insensitive) > -1) {
                console.log("search result", user_case_insensi)
                create_other_button(other_users[i])
            }
        }
    }
}

function create_other_button(user) {
    var prev_user_list = document.getElementById("prev_user_list").innerHTML
    prev_user_list = prev_user_list + `<div id=${user} class="other_user_button">${user} <button onclick = "send_invite('${user}')">Invite</button></div>`
    document.getElementById("prev_user_list").innerHTML = prev_user_list
}

function create_previous_button(user) {
    var prev_user_list = document.getElementById("prev_user_list").innerHTML
    prev_user_list = prev_user_list + `<button id=${user} onclick = "get_user_chats('${user}')">${user}</button>`
    document.getElementById("prev_user_list").innerHTML = prev_user_list
}

function send_invite(user) {
    if (socket.connected) {
        const details = {
            receiver_id: user,
            invite_status: "pending",
            message: "I want to chat"
        }
        socket.emit("send_invite", details)
        document.getElementById("search_value").value = ""
        document.getElementById("prev_user_list").innerHTML = ""
        create_prev_button(previous_chats)
    }
    else {
        console.error("user is not logged in")
    }
}

function display() {
    if (document.getElementById("extra_options").style.display == "") {
        document.getElementById("extra_options").style.display = "block"
    }
    else {
        document.getElementById("extra_options").style.display = ""
    }
}



function show_invites() {
    document.getElementById("extra_options").style.display == ""
    const invite_container = document.getElementById("invite_con")
    if (invite_container.style.display == "") {
        invite_container.style.display = "block"
        create_invites()
    }
    else {
        invite_container.style.display = ""
    }
}

function close_func() {
    console.log("close")
    document.getElementById("invite_con").style.display = ""
}

function create_invites() {
    var all_invites_html = ""
    for (var i = 0; i < client_invites.length; i++) {
        if (client_invites[i].sender_id == user_name) {
            all_invites_html = all_invites_html + `<div class="invite_recd">
                <div class="username" id=${client_invites[i].receiver_id}>${client_invites[i].receiver_id}</div><div class="status">${client_invites[i].invite_status}</div>
            </div>`
        }
        else if (client_invites[i].receiver_id == user_name) {
            all_invites_html = all_invites_html + `<div class="invite_recd">
                <div class="username" >${client_invites[i].sender_id}</div><div class="buttons" id=${client_invites[i].sender_id}><button id="accept" onclick = "accept_invite('${client_invites[i].sender_id}')">Accept</button><button id="reject" onclick = "reject_invite('${client_invites[i].sender_id}')">Reject</button></div>
            </div>`
        }
    }
    document.getElementById("invites_act_con").innerHTML = all_invites_html
}

function accept_invite(sender_id) {
    var details = ""

    for (var i = 0; i < client_invites.length; i++) {
        if (client_invites[i].sender_id == sender_id) {
            details = client_invites[i]
            client_invites.splice(i, 1)
            break
        }
    }
    socket.emit("invite_accepted", details)
    if (previous_chats == undefined) {
        previous_chats = []
    }
    previous_chats.push(sender_id)
    console.log("invite accepted", previous_chats)
    if (document.getElementById("invite_con").style.display == "block") {
        create_invites()
    }

    document.getElementById("prev_user_list").innerHTML = ""
    create_prev_button(previous_chats)

    if (previous_chats) {
        for (var i = 0; i < previous_chats.length; i++) {
            var check = 0
            for (var j = 0; j < other_users.length; j++) {
                if (other_users[j] == previous_chats[i]) {
                    check = 1
                    other_users.splice(j, 1)
                    break
                }
            }
        }
    }

    console.log("except accepted previous chat", other_users)
}

function reject_invite(sender_id) {
    var details = ""

    for (var i = 0; i < client_invites.length; i++) {
        if (client_invites[i].sender_id == sender_id) {
            details = client_invites[i]
            client_invites.splice(i, 1)
        }
    }
    socket.emit("invite_rejected", details)
    if (document.getElementById("invite_con").style.display == "block") {
        create_invites()
    }
}

