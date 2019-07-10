// INDEX.JS
const fs = require('fs');
const papa = require('papaparse');
const natural = require('natural');
const corpus = require('an-array-of-english-words');
const stopword = require('stopword');
const lemmatize = require('wink-lemmatizer');
// used to split words that are joined together without space
const WordsNinjaPack = require('wordsninja');

// Read OE Sample CSV from file path
const file = fs.readFileSync('../oe-sample.csv', 'utf8');

const cleanData = async (results, file) => {

  try {
    // Split csv into 2d array
    const table = results.data.map(d => {
      let splits = d[0].split(",");
      splits.splice(0, 2);
      if (splits.length > 1) {
        splits = [splits.join(', ')]
      }
      return splits
    })
    // Start of Shawn script
    let outputTable = [
      []
    ];
    const tokenizer = new natural.WordTokenizer();
    console.log('initialized tokenizer');
    const spellcheck = new natural.Spellcheck(corpus);
    console.log('successfilly import english dictionary');
    const WordsNinja = new WordsNinjaPack();
    rowCounter = 1;
    const forDeletion = [`it's`, 'its', 'it'];
    const cleanTable = await Promise.all(table.map(async sentence => {
      // tokenize sentence
      let tokenizedSentence = sentence[0].split(' ');
      // remove stopwords
      const stoppedSentence = stopword.removeStopwords(tokenizedSentence);
      // remove from forDeletion
      const filteredStoppedSentence = stoppedSentence.filter(word => !forDeletion.includes(word));
      // correct the words and add newly splitted words into sentence
      const correctedSentence = await filteredStoppedSentence.reduce(async (acc, word) => {
        acc = await acc;
        if (!spellcheck.isCorrect(word)) {
          correctedSpelling = spellcheck.getCorrections(word, 1)[0];
          if (typeof correctedSpelling === 'undefined') {
            await (async () => {
              try {
                await WordsNinja.loadDictionary();
                const splitted = WordsNinja.splitSentence(word);
                acc.push(...splitted);
                return acc
              } catch (e) {
                console.error(e)
              }
            })();
          }
        }
        acc.push(word)
        return acc
      }, [])
      // lemmatize the sentence
      const lemmatizedSentence = correctedSentence.map(word => {
        let lemmatized2 = lemmatize.adjective(word);
        lemmatized2 = lemmatize.noun(word);
        lemmatized2 = lemmatize.verb(word);
        return lemmatized2
      })
      return lemmatizedSentence
    }))
    console.log(cleanTable)
  } catch (error) {
    console.error(error)
  }
}

papa.parse(file, {
  complete: cleanData
});
