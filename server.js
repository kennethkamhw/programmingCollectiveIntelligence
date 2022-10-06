const express = require('express');
const app = express();

app.use('/static', express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/view/index.html');
});

const listener = app.listen(4000, () => {
    console.log(`Listening on Port ${listener.address().port}`);
})