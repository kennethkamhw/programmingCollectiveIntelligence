const logTree = require('console-log-tree')
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

const hcluster = (data, distance = pearson) => {
  let distances = {};
  let currentClusterId = -1;
  let clusters = data.map((e, i) => {
    return {
      _id: i,
      name: e.word,
      wordCounts: e.wordCounts.map((e) => e.count),
    };
  });

  while (clusters.length>2) {
    let lowestPair = [1, 0];
    let closest = distance(
      clusters[lowestPair[0]].wordCounts,
      clusters[lowestPair[1]].wordCounts
    );

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (!distances[`${clusters[i]._id}, ${clusters[j]._id}`]) {
          distances[`${clusters[i]._id}, ${clusters[j]._id}`] = distance(clusters[i].wordCounts, clusters[j].wordCounts)
        }

        let d = distance(clusters[i].wordCounts, clusters[j].wordCounts);

        if (d < closest) {
          closest = d;
          lowestPair = [i, j];
        }
      }
    }

    let mergedClusterCenter = averageVector(
      clusters[lowestPair[0]].wordCounts,
      clusters[lowestPair[1]].wordCounts
    )

    let newCluster = {
      wordCounts: mergedClusterCenter,
      name: "\\",
      _id: currentClusterId,
      children: [clusters[lowestPair[0]], clusters[lowestPair[1]]],
      dist: closest,
    };
    currentClusterId--;
    console.log(`Lowest Pair: ${lowestPair}`)
    clusters.splice(lowestPair[1], 1);
    clusters.splice(lowestPair[0], 1);
    clusters.push(newCluster);
    console.log(`clusters.length: ${clusters.length}`);
  }
  return clusters
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
let filteredWordList = filterWordList(combinedWordList, 0.025, 0.02);
let normalizedData = normalizeData(data, filteredWordList);
let rotatedData = rotateMatrix(normalizedData);
let tree = hcluster(rotatedData);

const treeStr = logTree.parse(tree)
 
console.log(treeStr)