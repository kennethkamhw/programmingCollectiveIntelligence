const logTree = require("console-log-tree");
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
  data.forEach((row) => {
    row.wordCounts.forEach((wordCount) => {
      let index = combinedWordCounts.findIndex(
        (e) => e.word === wordCount.word
      );
      if (index < 0) {
        combinedWordCounts.push({ word: wordCount.word, count: 1 });
      } else {
        combinedWordCounts[index].count = combinedWordCounts[index].count + 1;
      }
    });
  });
  return combinedWordCounts;
};

const filterWordList = (wordList, upper, lower) => {
  let max = Math.max(...wordList.map((e) => e.count));
  let min = Math.min(...wordList.map((e) => e.count));
  let range = max - min;
  let filterFunction = (e) => {
    return e.count > min + range * lower && e.count < min + range * upper;
  };
  return wordList.filter((e) => filterFunction(e));
};

const normalizeData = (data, filteredWordList) => {
  let newData = [];
  data.forEach((dataRow) => {
    let newDataRow = [];
    filteredWordList.forEach((filteredWordRow) => {
      // if the word is in the filteredword list, keep the count from wordCount
      if (
        dataRow.wordCounts.map((e) => e.word).includes(filteredWordRow.word)
      ) {
        newDataRow.push({
          word: filteredWordRow.word,
          count: dataRow.wordCounts.find((e) => e.word === filteredWordRow.word)
            .count,
        });
        return;
      }

      // if the word is not in the filteredword list, insert a zero count.
      if (
        !dataRow.wordCounts.map((e) => e.word).includes(filteredWordRow.word)
      ) {
        newDataRow.push({
          word: filteredWordRow.word,
          count: 0,
        });
      }
    });
    newData.push({
      title: dataRow.title,
      wordCounts: newDataRow,
    });
  });
  return newData;
};

const sum = (v1 = [0]) => {
  return v1.reduce((p, v) => {
    return p + v;
  }, 0);
};

const sumSqures = (v1 = [0]) => {
  return v1.reduce((p, v) => {
    return p + Math.pow(v, 2);
  }, 0);
};

const sumProduct = (v1 = [0], v2 = [0]) => {
  return v1.reduce((p, v, i) => {
    return p + v * v2[i];
  }, 0);
};

const pearson = (v1 = [0], v2 = [0]) => {
  const sum1 = sum(v1);
  const sum2 = sum(v2);

  const sum1sq = sumSqures(v1);
  const sum2sq = sumSqures(v2);

  const pSum = sumProduct(v1, v2);

  let num = pSum - (sum1 * sum2) / v1.length;
  let den = Math.sqrt(
    (sum1sq - Math.pow(sum1, 2) / v1.length) *
      (sum2sq - Math.pow(sum2, 2) / v1.length)
  );

  if (den === 0) return 0;

  return 1.0 - num / den;
};

const averageVector = (v1, v2) => {
  return v1.map((e, i) => {
    return (e + v2[i]) / 2;
  });
};

const rotateMatrix = (data) => {
  let newData = [];
  let wordList = data[0].wordCounts.map((e) => e.word);

  wordList.forEach((word) => {
    let newDataRow = [];
    data.forEach((dataRow) => {
      newDataRow.push({
        title: dataRow.title,
        count: dataRow.wordCounts.find((e) => e.word === word).count,
      });
    });
    newData.push({
      word: word,
      wordCounts: newDataRow,
    });
  });
  return newData;
};

const kcluster = (data, distance = pearson, k = 4) => {
  // 確定每個點的最小值和最大值
  let ranges = data[0].wordCounts.map((e, i) => {
    return {
      title: e.title,
      min: Math.min(...data.map((e) => e.wordCounts[i].count)),
      max: Math.max(...data.map((e) => e.wordCounts[i].count)),
    };
  });

  // 隨機創建K個中心點
  let clusters = [];
  for (let j = 0; j < k; j++) {
    let cluster = [];
    for (let i = 0; i < data[0].wordCounts.length; i++) {
      cluster.push(
        Math.random() * (ranges[i].max - ranges[i].min) + ranges[i].min
      );
    }
    clusters.push(cluster);
  }

  let lastMatches = 0;
  let bestMatches
  for (let t = 0; t < 100; t++) {
    if (t % 10 === 0) console.log(`Iteration ${t}`);
    bestMatches = Array(k).fill("").map(e=>[])

    // 在每一行中尋找距離最近的中心點
    data.forEach((dataRow, j) => {
        let row = dataRow.wordCounts.map((e) => e.count);
        let bestMatch = 0;
        bestMatches.forEach((e, i) => {
            let d = distance(clusters[i], row);
            if (d < distance(clusters[bestMatch], row)) bestMatch = i;
        });
        bestMatches[bestMatch].push(j);
    });

    if (bestMatches === lastMatches) break;
    lastMatches = bestMatches;

    // 把中心點移到其印有成員的平均位置處
    for (let i=0; i<k; i++) {
        let avgs = Array(data[0].wordCounts.length).fill(0.0);
        if (bestMatches[i].length>0) {
            bestMatches[i].forEach((rowid) => {
                data[rowid].wordCounts.forEach((e, m)=>{
                    avgs[m] += e.count;
                })
                avgs.forEach((e,j)=>{
                    avgs[j]/=bestMatches[i].length
                })
                clusters[i] = avgs
            })
        }
    }
  }
  return bestMatches
};

//=============Main Procedure===================

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

let combinedWordList = countOverallFrequencies(data);
let filteredWordList = filterWordList(combinedWordList, 0.012, 0.01);
let normalizedData = normalizeData(data, filteredWordList.slice(0, 100));
let rotatedData = rotateMatrix(normalizedData);
let clusterAssigned = kcluster(rotatedData);

clusterAssigned.forEach(cluster=>{
  console.table(cluster.map(index=>{
    return {
      index: index,
      word: rotatedData[index].word,
      maxCount: Math.max(...rotatedData[index].wordCounts.map(e=>e.count)),
      maxTitle: rotatedData[index].wordCounts.reduce((p,v,i,arr)=>{
        return arr[i].count>p.count? v:p
      }).title
    }
  }))
})
