const { customGenerateCompletionwithContext} =require('./completion');



const sample=async()=>{

var message ="What is this about";
var pq="";
var pa="";
    let company="arihantai";
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);

   console.log(response);
   
}

sample();