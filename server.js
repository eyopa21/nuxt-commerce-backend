const axios = require("axios");
const fetch = require("node-fetch")
const { request, gql, GraphQLClient } = require("graphql-request");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

console.log("date", Date.now())


const client = new GraphQLClient(process.env.HASURA_URI, {
    headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
    }
});
const PORT = process.env.PORT || 4001;
const app = express();
app.use(cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false,
    parameterLimit: 50000
}));




const image = require('./routes/image')
const auth = require('./routes/auth')
const guest = require('./routes/guest')
const sendMessage = require('./routes/sendMessage')
const logs = require('./routes/logs')
const cart = require('./routes/cart')

app.use('/api/v1/auth', auth);
app.use('/api/v1/image', image);
app.use('/api/v1/guest', guest);
app.use('/api/v1/email', sendMessage);
app.use('/api/v1/logs', logs);
app.use('/api/v1/cart', cart);




console.log("woow")









app.get('/test', (req, res) => {
  console.log("test")
})















app.listen(PORT, () => {
    console.log("app is running on server", PORT);
});