document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const copyButton = document.getElementById("copyButton");
  const outputContainer = document.getElementById("outputContainer");
  const participantsList = document.getElementById("participantsList");
  const languageDropdown = document.getElementById("languageDropdown");

  const codeEditor = document.getElementById("code-editor");
  let languageId;

  // Get credentials from sessionStorage
  const userName = sessionStorage.getItem('displayName');
  const roomId = sessionStorage.getItem('roomId');
  const secretKey = sessionStorage.getItem('secretKey');
  const currentUser = sessionStorage.getItem('currentUser');

  // Redirect to home if not authenticated
  if (!userName || !roomId || !secretKey || !currentUser) {
    window.location.href = '/';
    return;
  }

  socket.emit("joinRoom", roomId, userName, secretKey);

  // Handle room errors
  socket.on("roomError", (error) => {
    alert(error);
    window.location.href = '/';
  });

  socket.on("updateParticipants", (participants) => {
    const participantsListElement = document.getElementById("participants-list");
    participantsListElement.innerHTML = "";
  
    participants.forEach((participant) => {
      const listItem = document.createElement("li");
      listItem.textContent = participant.name;
      listItem.className = "participant-item";
      participantsListElement.appendChild(listItem);
    });
  });

  socket.on("textUpdate", (data) => {
    if (data.id !== socket.id) {
      codeEditor.value = data.text;
    }
  });

  codeEditor.addEventListener("input", () => {
    socket.emit("textUpdate", codeEditor.value);
  });
  copyButton.addEventListener("click", () => {
    codeText = codeEditor.value;
    executeCode(codeText);
  });

  languageDropdown.addEventListener("change", () => {
    languageId = languageDropdown.value;
    console.log(languageId);
  });

  function executeCode(codeText) {
    if (!codeText.trim()) {
      updateOutput("Please enter some code to execute.");
      return;
    }

    updateOutput("Executing code...");

    getOutputToken(codeText)
      .then((token) => makeSecondRequest(token))
      .then((response) => {
        const submission = response.submissions[0];
        const stdout = submission.stdout || submission.stderr || "No output";
        updateOutput(stdout);
      })
      .catch((error) => {
        console.error("Error in executeCode:", error);
        updateOutput("Error executing code. Please try again.");
      });
  }

  function updateOutput(stdout) {
    outputContainer.innerText = stdout;
    console.log(stdout);
  }

  function textToBase64(text) {
    return btoa(text);
  }

  function getOutputToken(codeText) {
    const base64Code = textToBase64(codeText);

    const getTokenSettings = {
      async: true,
      crossDomain: true,
      url: "https://judge0-extra-ce.p.rapidapi.com/submissions/batch?base64_encoded=true",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "b18550a92dmshaf84c14d5e4596ep1fb318jsnfda795c172cd",
        "X-RapidAPI-Host": "judge0-extra-ce.p.rapidapi.com",
      },
      processData: false,
      data: JSON.stringify({
        submissions: [
          {
            language_id: parseInt(languageId),
            source_code: `${base64Code}`,
          },
        ],
      }),
    };

    return $.ajax(getTokenSettings)
      .then((response) => {
        if (response && response.length > 0 && response[0].token) {
          return response[0].token;
        } else {
          throw new Error("Invalid response format from getOutputToken");
        }
      })
      .catch((error) => {
        console.error("Error in getOutputToken:", error);
        throw error;
      });
  }

  function makeSecondRequest(token) {
    const newRequestSettings = {
      async: true,
      crossDomain: true,
      url: `https://judge0-extra-ce.p.rapidapi.com/submissions/batch?tokens=${token}&base64_encoded=false&fields=stdout`,
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "b18550a92dmshaf84c14d5e4596ep1fb318jsnfda795c172cd",
        "X-RapidAPI-Host": "judge0-extra-ce.p.rapidapi.com",
      },
    };

    return $.ajax(newRequestSettings).catch((error) => {
      console.error("Error in makeSecondRequest:", error);
      throw error;
    });
  }

  // Add a global event listener for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
  });
});
