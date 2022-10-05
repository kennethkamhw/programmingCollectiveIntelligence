let critics = {
    'Lisa Rose': {
        'Lady in the Water': 2.5,
        'Snakes on a Plane': 3.5,
        'Just My Luck': 3.0,
        'Superman Returns': 3.5,
        'You, Me and Dupree': 2.5,
        'The Night Listener': 3.0
    },
    'Gene Seymour': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 3.5,
        'Just My Luck': 1.5,
        'Superman Returns': 5.0,
        'You, Me and Dupree': 3.5,
        'The Night Listener': 3.0
    },
    'Michael Phillips': {
        'Lady in the Water': 2.5,
        'Snakes on a Plane': 3.0,
        'Superman Returns': 3.5,
        'The Night Listener': 4.0
    },
    'Claudia Puig': {
        'Snakes on a Plane': 3.5,
        'Just My Luck': 3.0,
        'Superman Returns': 4.0,
        'You, Me and Dupree': 2.5,
        'The Night Listener': 4.5
    },
    'Mick LaSalle': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 4.0,
        'Just My Luck': 2.0,
        'Superman Returns': 3.0,
        'You, Me and Dupree': 2.0,
        'The Night Listener': 3.0
    },
    'Jack Matthews': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 4.0,
        'Superman Returns': 5.0,
        'You, Me and Dupree': 3.5,
        'The Night Listener': 3.0
    },
    'Toby': {
        'Snakes on a Plane': 4.5,
        'You, Me and Dupree': 1.0,
        'Superman Returns': 4.0
    }
};

const getSharedItems = (prefs, person1, person2) => {
    // get the shared item list
    let sharedItems = {};
    for (let key of Object.keys(prefs[person1])) {
        if (Object.keys(prefs[person2]).includes(key)) {
            sharedItems[key] = 1;
        }
    }
    return sharedItems;
}

// Return a distance similarity between person1 and person2
const simDistance = (prefs, person1, person2) => {
    const sharedItems = getSharedItems(prefs, person1, person2);

    // if 2 persons share no common, return 0
    if (Object.keys(sharedItems).length === 0) return 0;

    // calculate the root of sum of squre
    let sumOfSqures = Object.keys(sharedItems).reduce((p, key) => {
        return p + Math.pow(prefs[person1][key] - prefs[person2][key], 2);
    }, 0)

    return 1 / (1 + Math.sqrt(sumOfSqures));
}

// return Pearson Correlation of p1 and p2
const simPearson = (prefs, person1, person2) => {
    // get shared items list
    const sharedItems = getSharedItems(prefs, person1, person2);

    // measure the length of returned list, if the length is 0, not common item and return 1
    const numOfSharedItems = Object.keys(sharedItems).length;
    if (numOfSharedItems === 0) return 1;

    // Calculate Pearson Correlation
    const sum1 = Object.keys(sharedItems).reduce((p, key) => {
        return p + prefs[person1][key];
    }, 0);
    const sum2 = Object.keys(sharedItems).reduce((p, key) => {
        return p + prefs[person2][key];
    }, 0);

    const sum1sq = Object.keys(sharedItems).reduce((p, key) => {
        return p + Math.pow(prefs[person1][key], 2);
    }, 0);
    const sum2sq = Object.keys(sharedItems).reduce((p, key) => {
        return p + Math.pow(prefs[person2][key], 2);
    }, 0);

    const pSum = Object.keys(sharedItems).reduce((p, key) => {
        return p + (prefs[person1][key] * prefs[person2][key]);
    }, 0);

    const num = pSum - (sum1 * sum2 / numOfSharedItems);
    const den = Math.sqrt((sum1sq - Math.pow(sum1, 2) / numOfSharedItems) * (sum2sq - Math.pow(sum2, 2) / numOfSharedItems));

    if (den === 0) return 0;

    return num / den;
}

const topMatches = (prefs, person, n = 5, similarity = simPearson) => {
    let scores = Object.keys(prefs).filter(key => key !== person).map(other => {
        return { item: other, score: similarity(prefs, person, other) };
    });
    scores = scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, n);
    return scores;
}

// use the score from all other users, and get recommendations
const getRecommendations = (prefs, person, similarity = simPearson) => {
    let totals = {};
    let simSums = {};
    let result = {
        _total: {},
        _simSums: {},
        _ranking: {}
    };
    // exclude person from the comparasion
    for (let other of Object.keys(prefs).filter(other => other !== person)) {
        let sim = similarity(prefs, person, other);

        if (sim <= 0) continue;
        result[other] = {
            sim: +sim.toFixed(2)
        };

        for (let item of Object.keys(prefs[other]).filter(item => !Object.keys(prefs[person]).includes(item))) {

            totals[item] = (prefs[other][item] * sim) + totals[item] || (prefs[other][item] * sim);
            simSums[item] = simSums[item] + sim || sim;
            result[other][item] = +prefs[other][item].toFixed(2);
            result[other]['Sx.' + item] = +(prefs[other][item] * sim).toFixed(2);
        }
    }

    let rankings = Object.keys(totals).map(item => {

        result['_total']['Sx.' + item] = +totals[item].toFixed(2);
        result['_simSums']['Sx.' + item] = +simSums[item].toFixed(2);
        result['_ranking']['Sx.' + item] = +(totals[item] / simSums[item]).toFixed(2);
        return { ranking: totals[item] / simSums[item], item: item };
    })
d
    console.table(result)
    rankings = rankings.sort((a, b) => b.ranking - a.ranking);
    return rankings;
}

const transposePrefs = (prefs) => {
    result = {}
    for (let person of Object.keys(prefs)) {
        for (let item of Object.keys(prefs[person])) {
            result[item] = result[item] || {};
            result[item][person] = prefs[person][item]
        }
    }
    return result;
}

const calculateSimilarityItems = (prefs, n = 10) => {
    const itemPrefs = transposePrefs(prefs)

    let scores = {};

    Object.entries(itemPrefs).forEach((e, i, arr) => {
        const item = e[0];
        const values = e[1];

        if (i % 100 === 0) console.log(`${i}/${arr.length}`)
        scores[item] = topMatches(itemPrefs, item, n = n, similarity = simDistance)
    })

    return scores
}

const getRecommendedItems = (prefs, itemMatch, user) => {
    userRating = Object.entries(prefs[user]);
    scores = {};
    totalSim = {};

    userRating.forEach(([item, rating]) => {
        itemMatch[item].forEach(({ item, score }) => {
            if (userRating.map(e => e[0]).includes(item)) return;
            scores[item] = +scores[item] + score * rating || 0;
            totalSim[item] = +totalSim[item] + score || 0;
        })
        console.log(item)
        console.log(scores)
        console.log(totalSim)
    })
}

//console.log(`Pearson: ${simPearson(critics, 'Lisa Rose', 'Gene Seymour')}`);

//console.log(`Distance: ${simDistance(critics, 'Lisa Rose', 'Gene Seymour')}`);

/*
for (let person of Object.keys(critics)) {
    console.log(`${person}: ${topMatches(critics, person, 3).map(e=>JSON.stringify(e))}`)
}
*/

/*
console.table(critics);
console.table(getRecommendations(critics, 'Toby'));

console.table(transposePrefs(critics));
console.table(topMatches(transposePrefs(critics), 'Superman Returns'))
console.table(getRecommendations(transposePrefs(critics), 'Just My Luck'));
*/

//console.log(calculateSimilarityItems(critics));

console.log(getRecommendedItems(critics, calculateSimilarityItems(critics), 'Toby'))