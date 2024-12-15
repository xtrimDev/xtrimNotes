const express = require("express");
const path = require("path");
const passport = require('passport');
const session = require('express-session');

require("ejs");
require("./server/dbConnect");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

const staticPath = path.join(`${__dirname}./../public`);
const viewsPath = path.join(`${__dirname}./../views`);

const initializePassport = require("./config/passport");
initializePassport(passport);

app.set('trust proxy', "loopback");

app.use(express.urlencoded({ extended: false }));
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000} // 30 days
    })
  );
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(staticPath));

app.set("view engine", "ejs");
app.set("views", viewsPath);

const home_route = require("./routes/home");
const action_route = require("./routes/action");
const auth_route = require("./routes/auth");
const embed_route = require("./routes/embed");
const viewer_route = require("./routes/viewer");
const dict_route = require("./routes/dict");
const error_route = require("./routes/error");

app.use("/embed", embed_route);
app.use("/action", action_route);
app.use("/viewer", viewer_route);
app.use("/dict", dict_route);
app.use("/auth", auth_route);
app.use("/", home_route);
app.use(error_route);

app.use((err, req, res, next) => {
  console.log(err);
    return res.status(500).render("errors/500")
});

app.listen(port, () => {
    console.clear();
    console.log(`Connected to the port ${port}`);
}).on('error', (err) => {
    console.log(`Unable to connect to the port ${port}`);
    console.log(`${err}`);
 });