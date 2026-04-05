const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Your name: ", function(name) {
    console.log("Hello " + name);
    rl.close();
});