export function sendContent(content_id,received_content) {
  const contentData = {
    content_id:content_id,
    content_data: received_content
  }

  fetch("http://localhost:3000/content", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      

    },
    body: JSON.stringify(contentData),
  })
    .then(response => response.json()) 
    .catch(error => {
      console.error(error);
    });

  }

  // to the mongo backend
  export async function sendPromptToDB(content_id, received_prompt) {
    
    try {
      console.log(content_id +"      DSAddddddddd")
      if (content_id == null) {
        throw new Error("content_id is null");
      }
      const promptData = {
        prompt_data: received_prompt,
        content_id: content_id,
      };
      const response = await fetch("http://localhost:3000/prompt/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      })
  //need to be changed according to backend
      const data = await response.json();
      return data["data"];
    } catch (error) {
      if (error instanceof Error && error.message === "content_id is null") {
        console.log("content_id is null.");
        throw error;

      }
      else {
      console.error(error);
      throw error;
    }
  }
  }


  // to the LLM 
  export async function sendPromptToLLM(received_prompt) {
    try {
      const promptData = {
        prompt_data: received_prompt,
      };
      const response = await fetch("http://localhost:5000/api/prompt_route", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });
      console.log("helllllllllo")
      const result = await response.json();
      return result["Answer"];
    } catch (error) {
      console.error(error);
      throw error;
  }

    
  }
  

