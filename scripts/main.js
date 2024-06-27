let x = 431;
const s = document.querySelector("#heading");
s.textContent = "Hello, this is a test!";
// s.textContent = x.toString();
// alert("I dont know what this does") // gives a popup that says ""

// document.querySelector("html").addEventListener("click", () => {
//     alert("Ouch! Stop poking me!");
//   });

// let button = document.querySelector("#change_user");
// let poem = ""

// function setUsername () {
//     const name = prompt("please enter ur name:");
//     if (name) {
//         localStorage.setItem("name", name);
//         s.textContent = `Welcome to Candlelit Poetry, ${name}!`;
//     }
// };

let charitybutton = document.querySelector("#charitybutton");
charitybutton.addEventListener("click", () => window.location.href = "https://preserve.nature.org/page/80429/donate/1");

// if (!localStorage.getItem("name")) {
//     setUsername();
//   } else {
//     const storedName = localStorage.getItem("name");
//     s.textContent = `Welcome to Candlelit Poetry, ${storedName}!`;
// };

// button.addEventListener("click", setUsername);

// button.textContent = "does this work?";