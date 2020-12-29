let followButton = document.getElementById("follow");
followButton.addEventListener('click', changeFollow);

function changeFollow(){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            let type = JSON.parse(this.responseText).type;
            if(type){
                followButton.innerHTML = "- unfollow";
                followButton.style.backgroundColor = "rgb(115,3,192,0.6)";
            }else{
                followButton.innerHTML = "+ follow";
                followButton.style.backgroundColor = "rgb(236,56,188)";
            }
        }
    }
    let userID = window.location.href.substring(window.location.href.lastIndexOf('/'));
    let type = followButton.innerHTML.trim() === "+ follow";
    request.open("PUT","/users"+userID,true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({type}));
}