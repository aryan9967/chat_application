async function login_data(){
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value
    console.log(username, password)

    var options = {
        method : 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify({
            username : username,
            password : password
        })
    }
    try{
        var origin_server = window.location.origin
        var response = await fetch(`${origin_server}/login`, options)
        // var response = await fetch(`http://localhost:3000/login`, options)
        var act_res = await response.json()
        console.log("login status", act_res)
        if(act_res.login_status){
            sessionStorage.setItem('username', act_res.username)
            // console.log(window.location.origin)
            
            window.open(`${origin_server}/chat.html`, "_self")

        }
        else if(act_res.username == "Invalid"){
            alert("Invalid username")
        }
        else{
            alert("Incorrect password")
        }
    }
    catch(err){
        console.err(err)
    }
}