require('dotenv').config();

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
  

/* Set up static file */
app.use(express.static('public'));
/* Set up bodyparser */
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const connectDB = require("./db");
// Connect to database
connectDB();

/* Set up view pug */
app.set('view engine', 'ejs');
app.set('views', './views');

const authRouter = require("./routes/auth.route");
app.use("/",authRouter);

const callbackRouter = require("./routes/callback.route");
app.use('/callback', callbackRouter);


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})