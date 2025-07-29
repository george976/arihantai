const express = require('express');
const { customGenerateCompletionwithContext,intentcompletion,goetheResponse} =require('./completion');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors()); // Add this line
const {arihantdetails}=require("./arihant.js")
const {fortaledetails}=require("./fortale.js")

// Parse JSON bodies (needed for POST requests)
app.use(express.json()); 
app.get('/hi', (req, res) => {
  res.json({ message: "Hello!" });
});



app.post('/arihantcontext', async(req,res)=>{


  console.log(req.body,"request hello")
    const {message,pq,pa}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="arihantai";
    const context = await arihantdetails(message);
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);
   
  console.log(response,"is response")

  if(response){

      
      res.json({message:response})
}
 })



app.post('/intentai', async(req,res)=>{


  console.log(req.body,"request hello")
    const {message,pq,pa,node}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="arihantai";
    // const context = await arihantdetails(message);
   const response=await intentcompletion(message,pq,pa,node);
   
  console.log(response,"is response")

  if(response){

      
      res.json({message:response,node:node+1})
}
 })


app.post('/goethe', async (req, res) => {
  console.log(req.body, "Goethe request");
  const { message, pq, pa } = req.body;
  
  try {
    const response = await goetheResponse(pq, pa, message);
    console.log(response, "Goethe response");
    
    if (response) {
      res.json({ message: response });
    } else {
      res.status(500).json({ error: "Failed to generate Goethe response" });
    }
  } catch (error) {
    console.error("Error in Goethe endpoint:", error);
    res.status(500).json({ 
      error: "An error occurred while processing your request",
      details: error.message 
    });
  }
});

app.post('/arihantai0976', async(req,res)=>{


  console.log(req.body,"request hello")
    const {message,pq,pa}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="arihantai";
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);
       const context = await arihantdetails(message);

  console.log(response,"is response")

  if(response){

      
      res.json({message:response,parameters:context})
}
 })

app.post('/invest', async(req,res)=>{


  console.log(req.body,"request hello")
    const {message,pq,pa}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="invest";
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);

  console.log(response,"is response")

  if(response){
      res.json({message:response})
}
 })

app.post('/fortale', async(req,res)=>{

  console.log(req.body,"request hello")
    const {message,pq,pa}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="fortale";
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);
       const context = await fortaledetails(message);

  console.log(response,"is response")

  if(response){
      res.json({message:response,parameters:context})
}
 })



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 