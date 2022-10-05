const parser = require("csv-parse/sync").parse;
const fs = require("fs");
const path = "./dataset/WinnersInterviewBlogPosts.csv";

//==========define functions==========
const getWords = (html = "") => {
  let text = html
    .replace(/<[^>]+>/g, "")
    .split(/[^A-Z^a-z]+/g)
    .map((e) => e.toLowerCase());
  return text;
};

const countWord = (wordArr = []) => {
  let wordCount = {};
  wordArr.forEach((word) => {
    wordCount[word] = wordCount[word] + 1 || 0;
  });
  return wordCount;
};

const getOverallFrequencies = (data) => {
  let apCount = {};
  data.forEach((e) => {
    for (let [word, count] of Object.entries(e.wordCount)) {
      apCount[word] = apCount[word] + count || count;
    }
  });
  return apCount;
};

const createWordList = (apCount, lower = 0, upper = 1) => {
  let wordList = [];
  Object.entries(apCount).forEach(([word, count], i, arr) => {
    let frac = count / arr.length;
    if (frac > lower && frac < upper) {
      wordList.push(word);
    }
  });
  return wordList;
};

const sum = (v1 = [0]) => {
  return v1.reduce((p, v) => {
    return p + v;
  }, 0);
};

const sumSqures = (v1 =[0]) => {
    return v1.reduce((p, v) => {
        return p + Math.pow(v, 2);
    }, 0);
}

const sumProduct = (v1=[0], v2=[0]) => {
    return v1.reduce((p, v, i) => {
        return p + (v*v2[i]);
    }, 0)
}

const pearson = (v1 = [0], v2 = [0]) => {
    const sum1 = sum(v1);
    const sum2 = sum(v2);

    const sum1sq = sumSqures(v1);
    const sum2sq = sumSqures(v2);

    const pSum = sumProduct(v1, v2);

    num = pSum - (sum1 * sum2 /v1.length);
    den = Math.sqrt((sum1sq - Math.pow(sum1, 2)/v1.length)*(sum2sq - Math.pow(sum2, 2)/v1.length))
    
    if (den===0) return 0;

    return 1.0-(num/den)

};

//===========main procedure===========
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
const wordList = createWordList(apCount, 0.1, 0.5);

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

// search similar blog with filterData[0]
console.log(filteredData.map(e=> {
    return pearson(Object.values(filteredData[0].wordCount), Object.values(e.wordCount))
}))