const parser = require("csv-parse/sync").parse;
const fs = require("fs");
const path = "../dataset/WinnersInterviewBlogPosts.csv";

//==========define functions==========
const getWords = (html = "") => {
  let text = html
    .replace(/<[^>]+>/g, "")
    .split(/[^A-Z^a-z]+/g)
    .map((e) => e.toLowerCase());
  return text;
};

const countWord = (wordList) => {
  let wordCounts = [];
  wordList.forEach((word) => {
    let index = wordCounts.findIndex((e) => e.word === word);
    if (index < 0) {
      wordCounts.push({ word: word, count: 1 });
    } else {
      wordCounts[index].count = wordCounts[index].count + 1;
    }
  });
  return wordCounts;
};

const countOverallFrequencies = (data) => {
    let combinedWordCounts = [];
    data.forEach((row) =>{
        row.wordCounts.forEach(wordCount=> {
            let index = combinedWordCounts.findIndex((e)=>e.word===wordCount.word)
            if (index<0) {
                combinedWordCounts.push({word: wordCount.word, count:1})
            } else {
                combinedWordCounts[index].count = combinedWordCounts[index].count + 1
            }
        })
    })
    console.log(combinedWordCounts);
    return combinedWordCounts
}

const filterWordList = (wordList, upper, lower) => {
    let max = Math.max(...wordList.map(e=>e.count));
    let min = Math.min(...wordList.map(e=>e.count))
    let range = max - min;
    
}

let raw_data = fs.readFileSync(path, { encoding: "utf8", flag: "r" });

let data = parser(raw_data, {
  columns: true,
  skip_empty_lines: true,
})
  .map((e) => {
    return {
      title: e.title,
      content: e.content,
    };
  })
  .map((e) => {
    return {
      title: e.title,
      wordList: getWords(e.content),
    };
  })
  .map((e) => {
    return {
      title: e.title,
      wordCounts: countWord(e.wordList),
    };
  });

let combinedWordList = countOverallFrequencies(data)
filterWordList(combinedWordList, 0.5, 0.1) 