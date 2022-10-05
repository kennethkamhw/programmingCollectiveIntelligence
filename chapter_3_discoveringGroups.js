const { Bicluster } = require("./cluster.js");
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

const createWordList = (apCount, { lower = 0, upper = 1 }) => {
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

const hcluster = (data, distance = pearson) => {
  let distances = {};
  let currentClusterId = -1;

  let cluster = data.map((e, i) => {
    return new Bicluster(Object.values(e.wordCount), { id: i });
  });

  while (cluster.length > 1) {
    console.log(`cluster length = ${cluster.length}`);
    let lowestPair = [0, 1];
    let closest = distance(cluster[0].vec, cluster[1].vec);

    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        if (!distances[`${cluster[i].id}, ${cluster[j].id}`]) {
          distances[`${cluster[i].id}, ${cluster[j].id}`] = distance(
            cluster[i].vec,
            cluster[j].vec
          );
        }
        let d = distances[`${cluster[i].id}, ${cluster[j].id}`];

        if (d < closest) {
          closest = d;
          lowestPair = [i, j];
        }
      }
    }
    console.log(`closest=${closest}, lowestPair=${lowestPair}`);

    let mergevec = averageVector(
      cluster[lowestPair[0]].vec,
      cluster[lowestPair[1]].vec
    );

    let newCluster = new Bicluster(mergevec, {
      left: cluster[lowestPair[0]],
      right: cluster[lowestPair[1]],
      distance: closest,
      id: currentClusterId,
    });

    currentClusterId -= 1;
    cluster.splice(lowestPair[1], 1);
    cluster.splice(lowestPair[0], 1);
    cluster.push(newCluster);

    console.log(
      `distances length: ${Object.entries(distances).length}, cluster length: ${
        cluster.length
      }`
    );
  }

  return cluster[0];
};

const printCluster = (cluster, n=0) => {
  // base case, either node or branch
  let indent = " ".repeat(n);
  if (cluster.id<0) {
    console.log(indent + "-")
  } else {
    console.log(indent + filteredData[cluster.id].title);
  }

  // recursing if there is left or right branch
  if (cluster.left!==null) printCluster(cluster.left, n=n+1);
  if (cluster.right!==null) printCluster(cluster.right, n=n+1);
  
}

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
const wordList = createWordList(apCount, { lower: 0.01, upper: 0.1 });

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

printCluster(hcluster(filteredData));
