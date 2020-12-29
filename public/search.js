function updatePlaceholder(){
    let searchPH = document.getElementById("searchType").value;
    document.getElementById("searchInput").placeholder = "Search for " + searchPH.toLowerCase() + "...";
    if (searchPH != "movies") {
        document.getElementById("searchGenre").style.visibility="hidden";
    }else{
        document.getElementById("searchGenre").style.visibility="visible";
    }
}
let prevButtonID = "";
let genre = "";
function selectGenre(selectedID){
    if (prevButtonID !="") document.getElementById(prevButtonID).style.background="none";
    let button = document.getElementById(selectedID);
    genre = button.innerHTML;
    prevButtonID = selectedID;
    button.style.background="rgb(236,56,188,0.6)";
}

function search(){
    let searchPH = document.getElementById("searchType").value;
    let text = document.getElementById("searchInput").value;
    if(searchPH==="movies"){
        if (text.trim()!="" && genre !=""){
            searchPH += "?title=" + text + "&genre=" + genre;
        } else if(text.trim()!=""){
            searchPH += "?title=" + text;
        } else if(genre!=""){
            searchPH += "?genre=" + genre;
        }
    } else if(searchPH==="people" || searchPH ==="users"){
        if (text.trim()!="") searchPH += "?name=" + text;
    }
    window.location.href = searchPH;
}

function nextPage(){
    let str;
    let curURL = window.location.href;
    if (curURL.includes("#logo")) curURL = curURL.substring(0, curURL.lastIndexOf("#logo"));
    if(curURL.includes("?page=")){
        let pageNum = curURL.substring(curURL.lastIndexOf("?page=")+6)
        try{
            num = Number(pageNum)+1;
        } catch {
            num = 1;
        }
        str = curURL.substring(0,curURL.lastIndexOf("?")) + "?page=" +num
    } else if(curURL.includes("&page=")){
        let pageNum = curURL.substring(curURL.lastIndexOf("&page=")+6)
        try{
            num = Number (pageNum)+1;
        } catch {
            num = 1;
        }
        str = curURL.substring(0,curURL.lastIndexOf("&page=")) + "&page=" +num
    } else if (curURL.includes("?")){
        str = curURL + "&page=" + 2
    } else{
        str = curURL + "?page=" + 2
    }
    window.location.href = str;
}

function prevPage(){
    let str;
    let curURL = window.location.href;
    let change = false;
    if (curURL.includes("#logo")) curURL = curURL.substring(0, curURL.lastIndexOf("#logo"));
    if(curURL.includes("?page=")){
        let pageNum = curURL.substring(curURL.lastIndexOf("?page=")+6)
        try{
            num = Number(pageNum)-1;
        } catch {
            num = 1;
        }
        if (num===1) {
            str = curURL.substring(0,curURL.lastIndexOf("?"));
            change=true;
        } else{
            str = curURL.substring(0,curURL.lastIndexOf("?")) + "?page=" +num
            change=true;
        }
    } else if(curURL.includes("&page=")){
        let pageNum = curURL.substring(curURL.lastIndexOf("&page=")+6)
        try{
            num = Number (pageNum)-1;
        } catch {
            num = 1;
        }
        if(num===1){
            str = curURL.substring(0,curURL.lastIndexOf("&page="));
            change=true;
        } else{
            str = curURL.substring(0,curURL.lastIndexOf("&page=")) + "&page=" +num
            change=true;
        }
    }
    if (change) window.location.href = str;
}