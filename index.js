const express = require('express');
const { customGenerateCompletionwithContext} =require('./completion');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors()); // Add this line

// Parse JSON bodies (needed for POST requests)
app.use(express.json()); 
app.get('/hi', (req, res) => {
  res.json({ message: "Hello!" });
});










app.post('/arihantai0976', async(req,res)=>{


  console.log(req.body,"request hello")
    const {message,pq,pa}=req.body;
    console.log("message inside api is",message)
    // res.json({message:message})
    let company="arihantai";
   const response=await customGenerateCompletionwithContext(message,company,pq,pa);
   
  console.log(response,"is response")

  if(response){

      
      res.json({message:response})
}
 })







app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});