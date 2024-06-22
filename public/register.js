async function register() {
    const username = document.getElementById("username").value.trim()
    const password = document.getElementById("password").value
    const name = document.getElementById("name").value
    const email = document.getElementById("email").value

    if (username == "" || password == "" || name == "" || email == "") {
        // console.log("cannot be empty")
        alert("All fields are required")
    }
    else {
        var options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                name: name,
                email: email
            })
        }
        try {
            var origin_server = window.location.origin
            var response = await fetch(`${origin_server}/signup`, options)
            var act_res = await response.json()

            // console.log(act_res)

            if (act_res.alreadyexists) {
                alert("Username is already taken. please enter a different username")
            }
            else if (act_res.user_created) {
                alert("user created successfully")
                sessionStorage.setItem('username', act_res.username)
                // console.log(window.location.origin)
                
                window.open(`${origin_server}/chat.html`, "_self")
                
                // window.open("http://127.0.0.1:5500/login.html", "_self")
            }
        }
        catch (err) {
            console.err(err)
        }
    }
}