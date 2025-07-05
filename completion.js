
const fs = require("fs");
const { openai } = require("./utils/helper");

require('dotenv').config();
const axios=require('axios');
const simpleembeddmap={
  arihantai:"./arihant1.txt"
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
    arihantai:"You are Goyaam AI. You are a friendly, warm and approachable person and founder of Arihant Brothers.Answer the following question like a really friendly person. Try to answer in less than 100 words"

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


const intentcompletion=async (message,pq,pa,node)=>{
  try{
const points=[
  "bonjour",       // Hello / Good morning  
  "merci",         // Thank you  
  "au revoir",     // Goodbye  
  "oui",           // Yes  
  "non",           // No  
  "s'il vous plaît", // Please (formal)  
  "excusez-moi",   // Excuse me  
  "homme",         // Man  
  "femme",         // Woman  
  "enfant"         // Child  
]


var contentprompt="";
if(node==0)
{
  contentprompt="This is the conversation"+pq+" "+pa+" "+message+" Currently user is a total beginner. Address users latest message and Drive the conversation so as to introduce/teach the word " + points[node]
}
else if (node==9)
{
contentprompt="This is the conversation"+pq+" "+pa+" "+message+" Currently user has completed learning. Address users latest message and Finish it up and congratulate them"
}
else{
  contentprompt="This is the conversation"+pq+" "+pa+" "+message+" Currently user is learning the word "+ points[node-1]+ " Address users latest message andDrive the conversation so as to continue this and introduce/teach the word " + points[node+1]
}
 word=points[node];
 wordcompletion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "assistant",
          content:contentprompt  ,
        },
      ],
      
      max_tokens:600,
      temperature: 0, // Tweak for more random answers
    });

return wordcompletion.data.choices[0].message.content.trim();
  }
  catch(error){
console.log(error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
  }
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
          "Instructions: - If you dont know the answer, engage in friendly conversation. Never use the word context in your answer",
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