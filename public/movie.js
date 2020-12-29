
function isValid(str){
    if(str==="") {
        alert("Please fill in the input field")
        return false;
    } else if (str.startsWith(",") || str.endsWith(",")){
        alert("Input must not start/end with a comma")
        return false;
    }
    str = str.split(",").map(str => str.trim());
    str.forEach(x => {
        if (isDuplicate(x)){
            alert("Input must not contain duplicates")
            return false;
        } 
    });
    function isDuplicate(s){
        let count=0;
        str.forEach(st => {
            if (st.toLowerCase()===s.toLowerCase()) count++;
            if(count==2) return true;
        });
        return false;
    }
    return true;
}

function addActor(){
    let people = document.getElementById("addMActors").value;
    if(!isValid(people)) return;
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            window.location.href=this.responseText;
        }
    }
    request.open("PUT",window.location.href,true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({actors: people.split(",").map(people => people.trim())}));
}

function addDirector(){
    let people = document.getElementById("addMDirectors").value;
    if(!isValid(people)) return;
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            window.location.href=this.responseText;
        }
    }
    request.open("PUT",window.location.href,true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({directors: people.split(",").map(people => people.trim())}));
}

function addWriter(){
    let people = document.getElementById("addMWriters").value;
    if(!isValid(people)) return;
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            window.location.href=this.responseText;
        }
    }
    request.open("PUT",window.location.href,true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({writers: people.split(",").map(people => people.trim())}));
}