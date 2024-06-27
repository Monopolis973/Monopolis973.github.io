// const heading = document.querySelector("#heading");

// if (!localStorage.getItem("name")) {
//     setUsername();
//   } else {
//     const storedName = localStorage.getItem("name");
//     heading.textContent = `Welcome to Candlelit Poetry, ${storedName}!`;
// };

// let charitybutton = document.querySelector("#charitybutton");
// charitybutton.addEventListener("click", () => window.location.href = "https://preserve.nature.org/page/80429/donate/1");

// let homebutton = document.querySelector("#homebutton");
// homebutton.addEventListener("click", () => window.location.href = "../index.html");


const poemtitle = document.createElement('h2');
const title = document.createTextNode("A Mechanic's Apostrophe to Nature les gooo");
poemtitle.appendChild(title);

document.getElementById("middlepane").appendChild(poemtitle);

let s = "hello!\nI am joe.";
// let other = prompt(s)
// if (other[6] == s[6]) {
//     alert("yay!")
// };

let poemstr = "hello joe!\nI am john.";
alert(poemstr)

import { getPoem } from "./poems.js";
poemstr = getPoem("A+Mechanic's+Apostrophe+to+Nature")[0]

alert(poemstr)

const poemhtml = document.createElement("p")
poemhtml.class = "poem"
for (const c of poemstr) {
    if (c != "\n") {
        poemhtml.appendChild(document.createTextNode(c))
        // alert(c)
    }
    else {
        poemhtml.appendChild(document.createElement("br"))
    }
}

document.getElementById("middlepane").appendChild(poemhtml)

// let poemscript = document.getElementById("poemscript");
// poemscript.src = "inserts/poem.js";

// script = document.createElement('script');
// script.type = 'text/javascript';
// script.async = true;
// script.onload = function(){

//   /*
//     Your script has loaded
//     You can now call the code you have loaded
//    */

// };
// script.src = '/levels/level' + level + '.js';
// d.getElementsByTagName('head')[0].appendChild(script);

