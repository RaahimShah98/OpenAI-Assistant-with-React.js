
import React, { useState, useEffect } from "react";
import OpenAI from "openai";
import "./mainPage.css"



const ChatComponent = () => {
  const [message, setMessage] = useState("Hello");
  const [assistant, setAssistant] = useState(null);
  const [thread, setThread] = useState(null);
  const [openai, setOpenai] = useState(null);
  const [assitant_list, setAssitantList] = useState([])
  const [messageList, setMessageList] = useState([])

  const assistant_name = "OpenAI-Assistant"
  const openaiApiKey = "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";


  const assistants = []
  const openai_api = new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true,
  });

  //initialize the chatbot
  useEffect(() => {


    fetch_assistants_from_api()
  }, []);


  useEffect(() => {
    console.log("updated: ", assitant_list)
    if (assitant_list.length != 0) {
      check_for_exisiting_assitant()
    }

  }, [assitant_list])

  useEffect(() => {
    console.log("MESSAGE ARRAY UPDATED")
    console.log(messageList)

  }, [messageList])

  const fetch_assistants_from_api = async () => {

    const fetch_assistants = async () => { return await openai_api.beta.assistants.list() }
    fetch_assistants().then(data => {
      console.log(data); // This will log the fetched assistants list
      setAssitantList(data.body.data)
      return data.body
    }).catch(error => {
      console.error("Error fetching assistants:", error);
    });

    setOpenai(openai_api)
  }

  const check_for_exisiting_assitant = async () => {
    assitant_list.map(item => {
      assistants.push(item.name)
    })
    // console.log("ASSSSTST: " , assistants)

    if (!assistants.includes("Nutri-Bot")) {
      console.log("CREATING ASSITANT")
      create_assitant()
    }
    else {
      console.log("Assitant ALREADY EXISTS")
      try {
        const assistant = await openai_api.beta.assistants.retrieve("asst_FHQJd3JwVuTAjf5gvlA8hb8Q")
        console.log(assistant)
        setAssistant(assistant)
      } catch (e) {
        console.log(e.message)
      }

      create_thread()

    }
  }

  const create_assitant = async () => {
    const assistant = await openai_api.beta.assistants.create({
      name: "Nutri-Bot",
      instructions: "Answer to greetings. Answer to Nutrition Based Questions. answer all non nutritional based questions except for greetings with Ask a question based on nutrition. Answer With high precision",
      model: "gpt-4-1106-preview",
    });

    setAssistant(assistant)
    create_thread()

  }

  const create_thread = async () => {
    const thread = await openai.beta.threads.create();
    console.log("THREAD: ", thread)
    setThread(thread)

    console.log(thread)
  }

  const getAssitantResponse = async () => {
    console.log(message)
    const thread_message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    }
    )

    console.log("HELLO: ", thread_message)

    const run = await openai.beta.threads.runs.create(thread.id, { assistant_id: assistant.id })
    console.log("RUN: ", run)

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    while (response.status === "in_progress" || response.status === "queued") {
      console.log("waiting...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    console.log("RESPONSE: ", response)

    const messageList = await openai.beta.threads.messages.list(thread.id);

    console.log("MESSAGES: ", messageList)

    const lastMessage = messageList.data
      .filter((message) => message.run_id === run.id && message.role === "assistant")
      .pop();

    return lastMessage.content[0].text.value
  };

  const update_message_list = async () => {
    if (message.length == 0) {
      return
    }
    // Add the user message to the list
    setMessageList((prevMessages) => [
      ...prevMessages,
      { user: message, assistant: "" },
    ]);

    // Simulate an async assistant response
    const assistantResponse = await getAssitantResponse()
    console.log(assistantResponse)
    updateAssistantResponse(messageList.length, assistantResponse);

    // setTimeout(() => {
    //   const assistantResponse = "This is a response from the assistant. ";
    // }, 2000); // Replace with your actual async logic

    // setMessage("")
  };

  const updateAssistantResponse = (index, response) => {
    setMessageList((prevMessages) =>
      prevMessages.map((message, i) =>
        i === index ? { ...message, assistant: response } : message
      )
    );
  };

  return (
    <div id="mainPage">
      <h2 id="Header">Your OpenAI Assistant</h2>
      {/* {assitant_list.map((item) => (
        <h6 key={item.id}>{item.name}</h6>
      ))} */}

      <div id= "userArea">
        {/* <button onClick={handle_message}>Send to assistant</button> */}
        <div id="message-box">
        <div class="assistant">
                  <p class="assitantMessage">Hello This is {assistant_name} here, How May I help you?</p>
                </div>
          {
            messageList.map((element) => (
              <div>
                
                <div class="user">
                  <p class="userMessage">{element.user}</p>
                </div>
                <div class="assistant">
                  <p class="assitantMessage">{element.assistant}</p>
                </div>
              </div>
            ))

          }
        </div>
        <div id="userPromptArea">
          {<textarea id="enterPromptField"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
          />}

          <button onClick={update_message_list} id="sendResponseBtn">Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
