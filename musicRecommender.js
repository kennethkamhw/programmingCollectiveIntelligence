const fs = require("fs");
const { parse } = require("csv-parse");
const datasetPath = "./dataset/spotify_dataset.csv";

fs.createReadStream(datasetPath)
    .pipe(parse({
        delimiter: ",",
        relax_quotes: true,
        ltrim: true, 
        rtrim: true,
        escape: '//'
    }))
    .on("data", (row)=>{
        console.log(row);
    })