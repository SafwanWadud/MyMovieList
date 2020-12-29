//POST Request to update usertype (contributing/regular)
document.getElementById("reg").addEventListener('click', changeUserType);
document.getElementById("con").addEventListener('click', changeUserType);

function changeUserType(){
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){	
        if(this.readyState == 4 && this.status == 200){
            console.log("User type succesfully updated")
        }
    }
    type = document.getElementById('con').checked
    console.log(type);
    request.open("PUT","/profile",true);
    request.setRequestHeader('Content-type', 'application/json');
    request.send(JSON.stringify({userType:type}));
}