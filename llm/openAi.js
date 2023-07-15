const express = require("express");
require("dotenv").config();
const {Configuration,OpenAIApi}=require("openai");


const app=express();
app.use(express.json());

const configuration= new Configuration({
    apiKey:process.env.OPEN_AI_KEY,

});
const openai= new OpenAIApi(configuration);

app.post("/test",async(req,res) => {
 try{
    const  prompt  = req.body.prompt;
    const content = req.body.content;
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
              "role": "user",
              "content": `answer this question ${prompt} based on this content ${content}`
            }
          ],
      });

    return res.status(200).json({
       data: completion.data.choices[0].message.content
    });

 } catch(e){
    return res.status(400).json({
        success:false,
        error:e.response
        ? e.response.data : e.message,
 });
}  
});

const port = process.env.PORT || 5000;