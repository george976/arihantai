const {arihantdetails}=require("./arihant.js")
const { customGenerateCompletionwithContext} =require('./completion');


const abc=async()=>{
const discussion = " Tell me more about your products";
  const symbol = await arihantdetails(discussion);
  console.log("Details 123:", symbol); // Should return "AAPL"
  


  const message = "What is this about";
  const pq="What is this about";
  const pa="What is this about";
    let company="arihantai";

   const response=await customGenerateCompletionwithContext(message,company,pq,pa);

      console.log(response);

}



abc();




