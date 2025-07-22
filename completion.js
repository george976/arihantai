
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

const intentcompletion = async (message, pq, pa, node) => {
  try {
    // French learning curriculum organized by categories and difficulty
    const curriculum = {
      basics: {
        greetings: ["bonjour", "salut", "bonsoir", "bonne nuit", "ça va?"],
        farewells: ["au revoir", "à bientôt", "à demain", "adieu"],
        courtesy: ["merci", "s'il vous plaît", "excusez-moi", "pardon", "de rien"],
        questions: ["comment ça va?", "quel est ton nom?", "d'où viens-tu?", "parles-tu anglais?"],
        responses: ["oui", "non", "peut-être", "je ne sais pas", "je comprends"]
      },
      nouns: {
        people: ["homme", "femme", "enfant", "ami", "famille"],
        places: ["maison", "école", "restaurant", "hôtel", "ville"],
        objects: ["livre", "stylo", "téléphone", "voiture", "argent"],
        food: ["pain", "fromage", "eau", "vin", "café"]
      },
      verbs: {
        present: ["être", "avoir", "aller", "faire", "parler"],
        common: ["manger", "boire", "aimer", "détester", "apprendre"]
      },
      adjectives: ["bon", "mauvais", "grand", "petit", "nouveau", "vieux"],
      grammar: {
        articles: ["le", "la", "les", "un", "une", "des"],
        pronouns: ["je", "tu", "il/elle", "nous", "vous", "ils/elles"],
        conjugation: ["present tense", "past tense", "future tense"],
        negation: ["ne...pas", "ne...jamais", "ne...rien"]
      },
      phrases: {
        travel: ["Où est...?", "Combien coûte...?", "Je voudrais...", "L'addition s'il vous plaît"],
        emergency: ["Au secours!", "J'ai besoin d'aide", "Appelez la police", "Où est l'hôpital?"]
      }
    };

    // Determine current learning stage based on node
    const getCurrentTopic = (node) => {
      if (node < 5) return { category: 'basics', subcategory: 'greetings', index: node };
      if (node < 9) return { category: 'basics', subcategory: 'farewells', index: node - 5 };
      if (node < 14) return { category: 'basics', subcategory: 'courtesy', index: node - 9 };
      // Continue mapping nodes to curriculum sections...
      // This would be expanded to cover all 100+ words/concepts
      // For now, default to basics if node exceeds our current mapping
      return { category: 'basics', subcategory: 'greetings', index: 0 };
    };

    const currentTopic = getCurrentTopic(node);
    const currentWord = curriculum[currentTopic.category][currentTopic.subcategory][currentTopic.index];
    const nextWord = curriculum[currentTopic.category][currentTopic.subcategory][currentTopic.index + 1] || null;

    let contentprompt = "";
    
    if (node === 0) {
      contentprompt = `This is the conversation:
      Previous Question: ${pq}
      Previous Answer: ${pa}
      Current Question: ${message}
      
      The user is a total beginner in French. Address their latest message naturally and introduce the first word "${currentWord}" (meaning: "${getEnglishTranslation(currentWord)}"). 
      Explain its pronunciation, usage, and provide an example sentence. Keep it simple and engaging.`;
    }
    else if (node >= 100) { // Adjust based on total curriculum length
      contentprompt = `This is the conversation:
      Previous Question: ${pq}
      Previous Answer: ${pa}
      Current Question: ${message}
      
      The user has completed the beginner French curriculum. Address their message and congratulate them on their progress. 
      Offer some suggestions for continued learning and encourage them to practice regularly.`;
    }
    else {
      contentprompt = `This is the conversation:
      Previous Question: ${pq}
      Previous Answer: ${pa}
      Current Question: ${message}
      
      The user is learning French. We're currently covering "${currentWord}" (${getEnglishTranslation(currentWord)}). 
      Address their latest message naturally, then guide the conversation to introduce/teach "${nextWord}". 
      Include pronunciation, usage examples, and relate it to previous words when possible.`;
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "assistant",
          content: contentprompt,
        },
      ],
      max_tokens: 600,
      temperature: 0.3, // Slightly higher for more natural conversation
    });

    return response.data.choices[0].message.content.trim();
  }
  catch(error) {
    console.log(error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
    return "Désolé, je rencontre un problème technique. Pouvez-vous répéter votre question?";
  }
};

// Helper function for translations
function getEnglishTranslation(frenchWord) {
  const translations = {
    "bonjour": "hello/good morning",
    "merci": "thank you",
    "au revoir": "goodbye",
    // Add all other translations
  };
  return translations[frenchWord] || frenchWord;
}


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


module.exports= {customGenerateCompletionwithContext,intentcompletion};