//POST Request to determine if user can signin

document.getElementById("signIn").addEventListener('click', signIn);
document.getElementById("signUp").addEventListener('click', signUp);

function signIn(){
    let u = document.getElementById("username").value;
    let p = document.getElementById("password").value;
    if(u.trim()==="" || p.trim()===""){
        alert("All fields must be filled in.");
    }else{
        let request = new XMLHttpRequest();
        request.onreadystatechange = function(){	
            if(this.readyState == 4){
                if(this.status == 200){
                    window.location.href = window.location.href + "home"
                }else if(this.status >= 400){
                    alert(this.responseText);
                    document.getElementById("username").value = "";
                    document.getElementById("password").value = "";
                }
            }
        }
        let userpass = {};
        userpass.username = u;
        userpass.password = p;
        request.open("POST","/login",true);
        request.setRequestHeader('Content-type', 'application/json');
        request.send(JSON.stringify(userpass));
    }
}

function signUp(){
    let u = document.getElementById("username").value;
    let p = document.getElementById("password").value;
    if(u.trim()==="" || p.trim()===""){
        alert("All fields must be filled in.");
    }else{
        let request = new XMLHttpRequest();
        request.onreadystatechange = function(){	
            if(this.readyState == 4){
                if(this.status == 200){
                    window.location.href = window.location.href + "profile"
                }else if(this.status >= 400){
                    alert(this.responseText);
                    document.getElementById("username").value = "";
                    document.getElementById("password").value = "";
                }
            }
        }
        let userpass = {};
        userpass.username = u;
        userpass.password = p;
        request.open("POST","/signup",true);
        request.setRequestHeader('Content-type', 'application/json');
        request.send(JSON.stringify(userpass));
    }
}


	