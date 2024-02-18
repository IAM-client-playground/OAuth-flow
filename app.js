require("dotenv").config();
const express = require("express");
const session = require("express-session");

const app = express();
const port = 3000;

app.use(
  session({
    secret: "a_strong_session_secret",
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}, // Use true if you're using HTTPS
  })
);

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);

app.use("/authcode", require("./Authcode"));
app.use("/pkce", require("./PKCEflow"));
app.use("/client-credentials", require("./clientCredential"));
