const parser = require("csv-parse/sync").parse;
const fs = require("fs");
const path = "../dataset/WinnersInterviewBlogPosts.csv";
const {
  output,
  outputRotated,
  pearson,
  countWord,
  getWords,
  getOverallFrequencies,
  createWordList,
} = require("./chapter_3_discoveringGroups.js");

//===========Definitions==========
const kcluster = (data, distance = pearson, k = 4) => {
  let wordList = Object.keys(data[0].wordCount);

  let ranges = wordList.map((word) => {
    return {
      word: word,
      min: Math.min(...data.map((e) => e.wordCount[word])),
      max: Math.max(...data.map((e) => e.wordCount[word])),
    };
  });

  let clusters = Array(k)
    .fill(0)
    .map(() => {
      return ranges.map((range) => {
        return {
          word: range.word,
          center: Math.random() * (range.max - range.min) + range.min,
        };
      });
    });

    // clusters is a list of 4 Objects contain 'word' and 'center' properties
  for (let t=0; t<10; t++) {
    if (t%5===0) console.log(`Iteration ${t}`);

    /*
    data = [
      title: STRING,
      wordCount: {
        word: INT...
      }
    ]
    */
    // iterate the data rows, check which cluster is the closest
    let clusterAssginment = data.map(e=>{
      return clusters.map(cluster=>{
        return distance(cluster.map(e=>e.center), Object.values(e.wordCount))
      }).reduce((p,v,i,arr)=> {
        return v<arr[p]? i:p
      },0)
    })

    console.log(clusterAssginment)


  }
};

//===========Main Procedure==========
let data = fs.readFileSync(path, { encoding: "utf8", flag: "r" });

data = parser(data, {
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
      wordCount: countWord(getWords(e.content)),
    };
  });

const apCount = getOverallFrequencies(data);

// Limited the frequency range
const wordList = createWordList(apCount, { lower: 0.01, upper: 0.8 });

// apply frequency filter
const filteredData = data.map((e) => {
  let filterWordCount = {};
  for (let word of wordList) {
    filterWordCount[word] = e.wordCount[word] || 0;
  }

  return {
    title: e.title,
    wordCount: filterWordCount,
  };
});

kcluster(filteredData);