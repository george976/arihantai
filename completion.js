
const fs = require("fs");
const { openai } = require("./utils/helper");

require('dotenv').config();
const axios=require('axios');
const simpleembeddmap={
  arihantai:"./arihant1.txt",
  invest:"./invest.txt",
  fortale:"./fortale.txt"
}


function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours from 24-hour to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12' in 12-hour format

  // Constructing the time string
  const currentTime = `${hours}:${minutes} ${ampm}`;
  
  return currentTime;
}
const now = getCurrentTime();

const allprompts={
 orderai:"You are Blazin' Bird AI. You are an AI assistant that helps customers with menu items and ordering, using artificial intelligence.Answer the following question like a really firendly person. Keep the answers less than 20 words",
  Kat:"You are Kat AI. You are a friendly, warm and approachable AI assistant.Answer the following question like a really friendly person. Keep the answers to less than 20 words",
    arihantai:"You are Goyaam AI. You are a friendly, warm and approachable person and founder of Arihant Brothers.Answer the following question like a really friendly person. Try to answer in less than 100 words",
    invest:"You are Invest Bazaar AI. You are a friendly, warm and approachable person and an AI Assitant at Invest Bazaar.Answer the following question like a really friendly person. Try to answer in less than 100 words"

}

// Also translate message to french. All your answers should be in this format example respone - hello | bonjour
// Config Variables
let embeddingStore = {};

const maxTokens = 600; // Just to save my money :')
const embeds_storage_prefix = "embeds:";
let embeddedQuestion;

const createPrompt = (question, paragraph,id,pq,pa) => {

  if(pq&&pa)
  {
    return (
      allprompts[id] + "Now continue previous conversation with given context Previous conversation - Question : "+ pq + " Answer : "+pa+
      " Context :\n" +
      paragraph.join("\n\n") +
      "\n\nQuestion :\n" +
      question +
          "?" +
          "\n\nAnswer :"
    );
  }
  else if(!pq||!pa)
  {
    return (
          allprompts[id] +
          "Context :\n" +
          paragraph.join("\n\n") +
          "\n\nQuestion :\n" +
          question +
          "?" +
          "\n\nAnswer :"
        );
    }
    else{
      return (
        allprompts[id] +
        "Context :\n" +
        paragraph.join("\n\n") +
        "\n\nQuestion :\n" +
        pq+
        "?" +
        "\n\nAnswer :"+
        pa+
        "\n\nQuestion :\n" +
        question +
        "?" +
        "\n\nAnswer :"
      );
    }

  // A sample prompt if you don't want it to use its own knowledge
  // rather answer only from data you've provided

  // return (
  //   "Answer the following question from the context, if the answer can not be deduced from the context, say 'I dont know' :\n\n" +
  //   "Context :\n" +
  //   paragraph.join("\n\n") +
  //   "\n\nQuestion :\n" +
  //   question +
  //   "?" +
  //   "\n\nAnswer :"
  // );
};

// Removes the prefix from paragraph
const keyExtractParagraph = (key) => {
  return key.substring(embeds_storage_prefix.length);
};

// Calculates the similarity score of question and context paragraphs
const compareEmbeddings = (embedding1, embedding2) => {
  var length = Math.min(embedding1.length, embedding2.length);
  var dotprod = 0;

  for (var i = 0; i < length; i++) {
    dotprod += embedding1[i] * embedding2[i];
  }

  return dotprod;
};

// Loop through each context paragraph, calculates the score, sort using score and return top count(int) paragraphs
const findClosestParagraphs = (questionEmbedding, count) => {
  var items = [];

  for (const key in embeddingStore) {
    let paragraph = keyExtractParagraph(key);

    let currentEmbedding = JSON.parse(embeddingStore[key]).embedding;

    items.push({
      paragraph: paragraph,
      score: compareEmbeddings(questionEmbedding, currentEmbedding),
    });
  }

  items.sort(function (a, b) {
    return b.score - a.score;
  });

  return items.slice(0, count).map((item) => item.paragraph);
};

const getEnglishTranslation = (word) => {
  const translations = {
    "bonjour": "Hello",
    "salut": "Hi",
    "merci": "Thank you",
    "au revoir": "Goodbye",
    "s'il vous plaît": "Please",
    "un café": "a coffee",
    "excusez-moi": "Excuse me",
    "où est": "where is",
    "la gare": "the train station",
    "je cherche": "I'm looking for",
    "à droite": "to the right",
    "à gauche": "to the left",
    "comment ça va": "How are you",
    "ça va bien": "I'm fine",
    "l'addition": "the bill",
    "je voudrais": "I would like"
  };
  return translations[word.toLowerCase()] || word;
};

const intentcompletion = async (message, pq, pa, node) => {
  try {
    // Story-based curriculum organized by chapters
    const curriculum = {
      chapter1: {
        title: "Meeting at the Café",
        words: [
          { word: "bonjour", meaning: "Hello", pronunciation: "bohn-zhoor" },
          { word: "salut", meaning: "Hi", pronunciation: "sah-loo" },
          { word: "un café", meaning: "a coffee", pronunciation: "uhn kah-fay" },
          { word: "s'il vous plaît", meaning: "Please", pronunciation: "see voo play" },
          { word: "merci", meaning: "Thank you", pronunciation: "mehr-see" },
          { word: "au revoir", meaning: "Goodbye", pronunciation: "oh ruh-vwahr" }
        ],
        story: [
          "Imagine you're entering a café in Paris. The barista smiles and says:",
          "'Bonjour!' (Hello!) You can reply with either 'Bonjour' or the more casual 'Salut'",
          "You order: 'Un café, s'il vous plaît.' (A coffee, please.)",
          "Remember to always say 's'il vous plaît' when making requests",
          "When you receive your coffee, say: 'Merci!' (Thank you!)",
          "As you leave, you wave and say: 'Au revoir!' (Goodbye!)"
        ]
      },
      chapter2: {
        title: "Finding the Train Station",
        words: [
          { word: "excusez-moi", meaning: "Excuse me", pronunciation: "ex-koo-zay mwah" },
          { word: "où est", meaning: "where is", pronunciation: "oo eh" },
          { word: "la gare", meaning: "the train station", pronunciation: "lah gahr" },
          { word: "je cherche", meaning: "I'm looking for", pronunciation: "zhuh shairsh" },
          { word: "à droite", meaning: "to the right", pronunciation: "ah drwaht" },
          { word: "à gauche", meaning: "to the left", pronunciation: "ah gohsh" }
        ],
        story: [
          "Now you need to find the train station. You approach someone politely:",
          "Start with: 'Excusez-moi' (Excuse me) to get their attention",
          "Then ask: 'Où est la gare?' (Where is the train station?)",
          "Alternative: 'Je cherche la gare.' (I'm looking for the train station.)",
          "They might respond with directions: 'À droite' (To the right)",
          "Or: 'À gauche' (To the left)"
        ]
      },
      chapter3: {
        title: "At the Restaurant",
        words: [
          { word: "l'addition", meaning: "the bill", pronunciation: "lah-dee-syon" },
          { word: "je voudrais", meaning: "I would like", pronunciation: "zhuh voo-dray" },
          { word: "comment ça va", meaning: "How are you", pronunciation: "koh-mohn sah vah" },
          { word: "ça va bien", meaning: "I'm fine", pronunciation: "sah vah byan" },
          { word: "de rien", meaning: "You're welcome", pronunciation: "duh ryehn" },
          { word: "encore", meaning: "Again/More", pronunciation: "ahn-kor" }
        ],
        story: [
          "You're now at a restaurant. The waiter greets you: 'Comment ça va?'",
          "You respond: 'Ça va bien, merci.' (I'm fine, thank you)",
          "To order: 'Je voudrais...' (I would like...) followed by your order",
          "If you want more: 'Encore du vin, s'il vous plaît' (More wine, please)",
          "When leaving, ask for: 'L'addition, s'il vous plaît' (The bill, please)",
          "The waiter says 'De rien' (You're welcome) when you thank them"
        ]
      }
    };

    // Get current chapter and word
    const wordsPerChapter = 6;
    const chapterNum = Math.floor(node / wordsPerChapter) + 1;
    const chapterKey = `chapter${chapterNum}`;
    const chapter = curriculum[chapterKey] || curriculum.chapter1;
    const wordIndex = node % wordsPerChapter;
    const currentWord = chapter.words[wordIndex];
    const nextWord = chapter.words[wordIndex + 1];
    const storyPart = chapter.story[wordIndex] || chapter.story[chapter.story.length - 1];

    let contentprompt = "";
    
    if (node === 0) {
      contentprompt = `You're a friendly French tutor teaching through stories. 
      Begin the first chapter: "${chapter.title}". 
      Start with: "${chapter.story[0]}" 
      Introduce the word "${currentWord.word}" (${currentWord.meaning}), explaining its pronunciation ("${currentWord.pronunciation}") and usage. 
      Keep it conversational and engaging.`;
    }
    else if (nextWord) {
      contentprompt = `Continue the story from chapter "${chapter.title}":
      Current story part: "${storyPart}"
      Previous interaction:
      - User: "${pq}"
      - You: "${pa}"
      
      Now the user says: "${message}"
      
      Naturally continue the story while introducing the next word "${nextWord.word}" (${nextWord.meaning}), 
      explaining its pronunciation ("${nextWord.pronunciation}") and relating it to previous words. 
      Use the story context: ${JSON.stringify(chapter.story)}`;
    }
    else {
      // End of chapter - prepare quiz
      contentprompt = `Wrap up chapter "${chapter.title}". 
      The user said: "${message}"
      Congratulate them on completing the chapter and prepare them for a short quiz 
      covering these words: ${chapter.words.slice(-3).map(w => w.word).join(", ")}. 
      Keep it encouraging and mention we'll have a quick test on these words!`;
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "assistant", content: contentprompt }],
      max_tokens: 600,
      temperature: 0.3,
    });

    return {
      text: response.data.choices[0].message.content.trim(),
      currentWord,
      isQuiz: !nextWord && wordIndex === chapter.words.length - 1,
      chapterTitle: chapter.title
    };
  }
  catch(error) {
    console.error(error);
    return { 
      text: "Désolé, je rencontre un problème technique. Pouvez-vous répéter votre question?",
      currentWord: null,
      isQuiz: false,
      chapterTitle: ""
    };
  }
};




// Helper function for translations
// function getEnglishTranslation(frenchWord) {
//   const translations = {
//     "bonjour": "hello/good morning",
//     "merci": "thank you",
//     "au revoir": "goodbye",
//     // Add all other translations
//   };
//   return translations[frenchWord] || frenchWord;
// }


const customGenerateCompletionwithContext = async (prompt,id,pq,pa) => {
  console.log(`Called completion function with prompt : ${prompt}`);

  try {
    // Retrieve embedding store and parse it
    let pathofembed=simpleembeddmap[id];
    let embeddingStoreJSON = fs.readFileSync(pathofembed, {
      encoding: "utf-8",
      flag: "r",
    });

    embeddingStore = JSON.parse(embeddingStoreJSON);

    // Embed the prompt using embedding model

   var embeddedQuestionResponse = await openai.createEmbedding({
      input: prompt,
      model: "text-embedding-ada-002",
    });

    if(pq&&pa){
     embeddedQuestionResponse = await openai.createEmbedding({
      input: "Context is as follows Question:"+pq+" Answer:"+pa+" Now answer this - Question: "+prompt + "?",
      model: "text-embedding-ada-002",
    });
  }

    // Some error handling
    if (embeddedQuestionResponse.data.data.length) {
      embeddedQuestion = embeddedQuestionResponse.data.data[0].embedding;
    } else {
      throw Error("Question not embedded properly");
    }

    // Find the closest count(int) paragraphs
    let closestParagraphs = findClosestParagraphs(embeddedQuestion, 5); // Tweak this value for selecting paragraphs number

    if(pq&&pa){
    var completionData = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "assistant",
          content: createPrompt("Question:"+pq+" Answer:"+pa+" Now answer this - Question: "+prompt , closestParagraphs,id) +
          "Instructions: - If you dont know the answer, engage in friendly conversation. Never use the word context in your answer."+
          " Also as required, direct the conversation towards any of these topics in this array - /"[
  "Check apartment availability (1BHK/2BHK) for specific dates",
  "Compare pricing for short-term vs. long-term stays",
  "List included amenities (e.g., Jio WiFi, washing machine, AC)",
  "Explain housekeeping frequency (e.g., alternate-day cleaning)",
  "Confirm check-in/out timings (1 PM check-in, 11 AM check-out)",
  "ID proof requirements (Aadhar, passport, etc.) for booking",
  "Distance to key locations (IIM Bangalore, Kempegowda Airport)",
  "Public transport access (e.g., BMTC bus stops)",
  "Security deposit details (₹18,000) and payment deadlines",
  "Cancellation/refund policies (e.g., non-refundable token)"]
        },
      ],
      max_tokens:600,
      temperature: 0, // Tweak for more random answers
    });
  }
  else {


    completionData = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "assistant",
          content: createPrompt(prompt, closestParagraphs,id) +
          "Instructions: - If you dont know the answer, engage in friendly conversation. Never use the word context in your answer",
        },
      ],
      
      max_tokens:600,
      temperature: 0, // Tweak for more random answers
    });

  }

    if (!completionData.data.choices) {
      throw new Error("No answer gotten");
    }

    console.log(completionData.data.choices[0].message.content.trim());
    return completionData.data.choices[0].message.content.trim();
  } catch (error) {
    console.log(error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
  }
};


const goetheResponse = async (pq, pa, message) => {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are Johann Wolfgang von Goethe, the renowned German writer and philosopher. Respond to the conversation in Goethe's distinctive style - profound, poetic, and philosophical, yet warm and engaging. Use classical German sentence structures occasionally, but keep most responses in clear English. Maintain a tone of wisdom and deep reflection."
        },
        {
          role: "assistant",
          content: `Previous exchange:\nQuestion: ${pq}\nAnswer: ${pa}\n\nNow respond to this new message in Goethe's style: ${message}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7, // For creative but not too wild responses
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating Goethe response:", error);
    return "My apologies, but at this moment my thoughts are as clouded as a storm over the Brocken. Might you repeat your inquiry?";
  }
};

module.exports= {customGenerateCompletionwithContext,intentcompletion,goetheResponse};