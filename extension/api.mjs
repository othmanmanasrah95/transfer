const authToken = "d7110028a6e7b225e4b9ebe31bdd091c"; 
export const appi = [];
export function sendContentToApi(content_id,received_content) {
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
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.error(error);
    });

  }

  export async function sendPromptToApi(content_id, received_prompt) {
    const promptData = {
      prompt_data: received_prompt,
      content_id: content_id,
    };
  
    try {
      const response = await fetch("http://localhost:3000/prompt/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });
  
      const data = await response.json();
      console.log(data["data"].data);
      return data["data"].data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  

