const bcrypt = require('bcrypt');

const hash = bcrypt.hashSync("hitesh@123", 10);
console.log(hash);