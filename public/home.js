clearButton = document.getElementById("clearNotifs");
clearButton.addEventListener('click', clearInbox);

function clearInbox(){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            document.getElementById("notifs").innerHTML = ""; 
            clearButton.style.visibility="hidden";
        }
    }
    request.open("DELETE","/notifications",true);
    request.send();
}