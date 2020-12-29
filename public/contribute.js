document.getElementById("genreSect").addEventListener("click", changeRequire);

function changeRequire(){
    let minGenres= 2;
    let curGenres = 0;
    let checkboxes = document.getElementsByClassName("addMGenre");
    let req = true;
    for (let i = 0; i < checkboxes.length; i++) {
        if(checkboxes.item(i).checked===true) curGenres++;
        if (curGenres===minGenres){
            req = false;
            break;
        } 
    }
    if(req){
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes.item(i).required= true;
        }
    } else{
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes.item(i).required= false;
        }
    }
}