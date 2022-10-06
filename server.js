const express = require("express");
const { output, outputRotated } = require("./script/chapter_3_discoveringGroups");
const app = express();

app.use("/static", express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/blogClustering", (req, res) => {
  res.sendFile(__dirname + "/views/blogClustering.html");
});

app.get("/wordClustering", (req, res) => {
  res.sendFile(__dirname + "/views/wordClustering.html");
});

app.get("/data1", (req, res) => {
  res.json(output);
});

app.get("/data2", (req, res) => {
  res.json(outputRotated);
});


const listener = app.listen(4000, () => {
  console.log(`Listening on Port ${listener.address().port}`);
});
