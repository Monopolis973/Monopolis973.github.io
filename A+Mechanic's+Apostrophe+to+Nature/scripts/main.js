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

// alert(poemstr)
// fetch("A Mechanic's Apostrophe to Nature.txt")
//     .then(function (res) {
//         return res.text();
//     })
//     .then(function (data) {
//         console.log(data);
//     });
// alert(data)
// poemstr = data;

// Requiring fs module in which 
// readFile function is defined.
// const fs = require('fs');  // This is the failing line

// alert("step 1")

// fs.readFile("A+Mechanic's+Apostrophe+to+Nature.txt", (err, data) => {
//   alert("step 2")
//     if (err) throw err;
//     alert("step 3")

//     poemstr = data.toString();
// });

// let fr = new FileReader();
// fr.onload = function () {
//     document.getElementById('copyright')
//         .textContent = fr.result;
// }

// fr.readAsText(this.files[0]);

// fetch("A Mechanic's Apostrophe to Nature.txt")
//   .then(response => response.text())
//   .then((data) => {
//     console.log(data)
//   })

import { getPoem } from "poems";
poemstr = getPoem("A+Mechanic's+Apostrophe+to+Nature")[0]

alert(peomstr)

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

