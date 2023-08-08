import { sendPromptToApi } from "./api.mjs";

document.addEventListener('DOMContentLoaded', function() {

  var scrapingToggle = document.getElementById('agree-toggle');
  var contentContainer = document.getElementById('content-container');
  var promptText= document.getElementById('prompt_text');
  var submitButton = document.getElementById("submit_button");
  var responseText = document.getElementById("answer-container");  

  var contentData;
  var contentId;
// default checkbox value
  chrome.storage.sync.get('scrapingEnabled', function(data) {
    let isScrapingEnabled = data.scrapingEnabled;

    scrapingToggle.checked = isScrapingEnabled;
    if (isScrapingEnabled) {
      enableScraping();
    } else {
      disableScraping();
    }
  });

  //  checkbox value if any change to it 
  scrapingToggle.addEventListener('change', function() {
   var isScrapingEnabled = scrapingToggle.checked;

    if (isScrapingEnabled) {
      enableScraping();
    } else {
      disableScraping();
    }

    chrome.storage.sync.set({ 'scrapingEnabled': isScrapingEnabled });
  });

  submitButton.addEventListener("click",async function () {
    var enteredPrompt = promptText.value;
    
    try {
    var response= await sendPromptToApi(contentId,enteredPrompt);
    console.log(response);
    responseText.textContent=response;
    promptText.value = '';
  }
    catch (error) {
    console.error(error);
  }
  });

  promptText.addEventListener("keydown", async function(e) {
    if (e.code == "Enter") {
      var enteredPrompt = promptText.value;
      try {
        var response = await sendPromptToApi(contentId, enteredPrompt);
        console.log(response);
        responseText.textContent = response;
        promptText.value = '';

      } catch (error) {
        console.error(error);
      }
    }
  });
  

  function enableScraping() {
    chrome.runtime.sendMessage({ action: 'get_content' }, function(response) {

      if (response && response.contentData && response.contentId) {
        contentData =response.contentData;
        contentId = response.contentId;
        contentContainer.textContent = contentData;
        //sendDataToAPI(response.content);
        console.log(contentData);   
      }
    });
    
  }

  function disableScraping() {
    contentContainer.textContent = '';
  }
});
