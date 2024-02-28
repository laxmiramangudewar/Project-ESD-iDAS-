/*****************************************************************************************
 * File Name          : renderer.js
 * Description        : This file provides code for data processing
 * Project Number     : ESD-iDAS
 * Author             : Team ESD-iDAS
 * Modified BY        : Abhishek Zagare
 * Modification Date  : 20/12/2023
 * Project Details    : This Application serves MODBUS communicaton for data acquisition and monitoring via com port.
 *************************************************************************************************************/
const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const CryptoJS = require("crypto-js");

/************************************************************************************************************/
// Global Variables
/************************************************************************************************************/
var flg_alert = false;
var savedNumberOfChannels;
var savedDecimalPoint;
var decPointDevider;
var buttonStatus = ""; // Variable to store button status
var deviceId;
var functionCode;
var address;
var quantity;
var flg_InHistory = false;
var globalSelectedDeviceNumber;
var globalFilePath;
/************************************************************************************************************/
// Processes
/************************************************************************************************************/

// ipcRenderer.send("GetAppPath");
// ipcRenderer.once("dataPath", (event, data) => {
//   globalFilePath = data;
// });

ipcRenderer.send("GiveDeviceNum");
ipcRenderer.on("deviceNumber", (event, Data1, Data2) => {
  globalSelectedDeviceNumber = Data1;
  globalFilePath = Data2;
});

document.addEventListener("DOMContentLoaded", async () => {
  const ShowingDevice = document.getElementById("ShowingDevice");
  ShowingDevice.textContent = "Device" + " " + globalSelectedDeviceNumber;

  var numberOfChannelsInput = document.getElementById("NumberOfChannels");
  var decimalPointInput = document.getElementById("DecimalPoint");

  numberOfChannelsInput.value = localStorage.getItem("numberOfChannels") || "";
  decimalPointInput.value = localStorage.getItem("decimalPoint") || "";

  savedNumberOfChannels = numberOfChannelsInput.value; // Assign the value, not the input element
  savedDecimalPoint = decimalPointInput.value; // Assign the value, not the input element

  if (savedNumberOfChannels == 0 || savedNumberOfChannels == undefined) {
    alert("Please Go To Setting");
  }

  if (savedDecimalPoint == 123.4) {
    decPointDevider = 10;
    ipcRenderer.send("DecimalPoint", decPointDevider);
  } else if (savedDecimalPoint == 12.34) {
    decPointDevider = 100;
    ipcRenderer.send("DecimalPoint", decPointDevider);
  } else if (savedDecimalPoint == 1.234) {
    decPointDevider = 1000;
    ipcRenderer.send("DecimalPoint", decPointDevider);
  } else {
    decPointDevider = 1;
    ipcRenderer.send("DecimalPoint", decPointDevider);
  }

  const applybutton3 = document.getElementById("Apply3");
  applybutton3.addEventListener("click", function () {
    // Get the input values
    var numberOfChannels = numberOfChannelsInput.value;
    var decimalPoint = decimalPointInput.value;
    decimalPoint = 0;

    localStorage.setItem("numberOfChannels", numberOfChannels);

    localStorage.setItem("decimalPoint", decimalPoint);

    generateChannelCards(numberOfChannels);
    generateInputFields(numberOfChannels);
    generateChannelDescriptionFields(numberOfChannels);
    if (decimalPoint == 123.4) {
      decPointDevider = 10;
      ipcRenderer.send("DecimalPoint", decPointDevider);
    } else if (decimalPoint == 12.34) {
      decPointDevider = 100;
      ipcRenderer.send("DecimalPoint", decPointDevider);
    } else if (decimalPoint == 1.234) {
      decPointDevider = 1000;
      ipcRenderer.send("DecimalPoint", decPointDevider);
    } else {
      decPointDevider = 1;
      ipcRenderer.send("DecimalPoint", decPointDevider);
    }
  });

  // Assuming these functions use the values stored in savedNumberOfChannels and savedDecimalPoint
  generateChannelCards(savedNumberOfChannels);
  generateInputFields(savedNumberOfChannels);
  generateChannelDescriptionFields(savedNumberOfChannels);
  load_COM_Data();
  loadHistoryDate();
  listAvailablePorts();

  const comPortSelect = document.getElementById("comPortSelect");
  const connectButton = document.getElementById("connectButton");
  const refreshButton = document.getElementById("refreshButton");
  const applybutton = document.getElementById("Apply");
  const applybutton1 = document.getElementById("Apply1");
  const FrameParamSaveButton = document.getElementById("FrameParamSaveButton");

  FrameParamSaveButton.addEventListener("click", async () => {
    const deviceIdInput = document.getElementById("deviceId");
    const functionCodeInput = document.getElementById("functionCode");
    const addressInput = document.getElementById("address");
    const quantityInput = document.getElementById("quantity");

    deviceId = parseInt(deviceIdInput.value);
    functionCode = parseInt(functionCodeInput.value);
    address = parseInt(addressInput.value);
    quantity = parseInt(quantityInput.value);
    ipcRenderer.send(
      "frame_Parameters",
      deviceId,
      functionCode,
      address,
      quantity
    );
  });

  port = null;
  writer = null;

  refreshButton.addEventListener("click", async () => {
    listAvailablePorts();
  });

  connectButton.addEventListener("click", async () => {
    Save_COM_Data();
    const selectedPort = comPortSelect.value;
    ipcRenderer.send("Connect-To-SerialPort", selectedPort);
    ipcRenderer.once("alert", (event, data) => {
      alert(data);
    });
  });

  ipcRenderer.on("data-to-channel", (event, data) => {
    dataToChannel(data);
  });

  /************************************************************************************************************/

  // applybutton.addEventListener("click", async () => {
  //   const Ch1_Discription = document.getElementById("datachannel_1").value;
  //   const Ch2_Discription = document.getElementById("datachannel_2").value;
  //   const Ch3_Discription = document.getElementById("datachannel_3").value;
  //   const Ch4_Discription = document.getElementById("datachannel_4").value;
  //   const Ch5_Discription = document.getElementById("datachannel_5").value;
  //   const Ch6_Discription = document.getElementById("datachannel_6").value;
  //   const Ch7_Discription = document.getElementById("datachannel_7").value;
  //   const Ch8_Discription = document.getElementById("datachannel_8").value;
  //   const Ch9_Discription = document.getElementById("datachannel_9").value;

  //   let Add_Info = [
  //     {
  //       CH1: Ch1_Discription,
  //       CH2: Ch2_Discription,
  //       CH3: Ch3_Discription,
  //       CH4: Ch4_Discription,
  //       CH5: Ch5_Discription,
  //       CH6: Ch6_Discription,
  //       CH7: Ch7_Discription,
  //       CH8: Ch8_Discription,
  //       CH9: Ch9_Discription,
  //     },
  //   ];
  //   let fileName = "Channel_Description.csv";
  //   jsonToCsv(Add_Info, fileName);
  // });

  applybutton.addEventListener("click", async () => {
    let Add_Info = [];

    // for (let i = 1; i <= savedNumberOfChannels; i++) {
    //   const channelElement = document.getElementById(`datachannel_${i}`);

    //   if (channelElement) {
    //     const channelDescription = channelElement.value;
    //     Add_Info.push({ [`CH${i}`]: channelDescription });
    //   } else {
    //     console.error(`Element with ID datachannel_${i} not found.`);
    //   }
    // }

    for (let i = 1; i <= savedNumberOfChannels; i++) {
      const channelElement = document.getElementById(`datachannel_${i}`);

      const channelObject = {
        Channel: "CH" + i,
        Description: channelElement.value,
      };

      Add_Info.push(channelObject);
    }
    let fileName = "Channel_Description.csv";
    jsonToCsv(Add_Info, fileName);
  });

  /************************************************************************************************************/
  applybutton1.addEventListener("click", async () => {
    const organisation = document.getElementById("orgInput").value;
    const process = document.getElementById("processInput").value;
    const checkedBy = document.getElementById("checkedByInput").value;
    const verifiedBy = document.getElementById("verifiedByInput").value;
    const pdfFileName = document.getElementById("pdffileName").value;
    let Add_Info = [
      {
        Organisation: organisation,
        Process: process,
        CheckedBy: checkedBy,
        VerifiedBy: verifiedBy,
        PdFFilename: pdfFileName,
      },
    ];
    let fileName = `Additional_Info.csv`;
    jsonToCsv(Add_Info, fileName);
    window.location.href = "table.html";
  });

  /************************************************************************************************************/

  document
    .getElementById("disconnectButton")
    .addEventListener("click", async () => {
      ipcRenderer.send("disConnect-Port");
      ipcRenderer.on("disConnect-Port-reply", (event, data) => {
        alert("Disconnected from the serial port");
      });
    });
  /************************************************************************************************************/
});

/************************************************************************************************************/
//Function Definations
/************************************************************************************************************/
function jsonToCsv(jsonData, fileName) {
  if (!jsonData || jsonData.length === 0) {
    console.error("No data provided.");
    return;
  }
  const filePath = path.join(globalFilePath, fileName);
  const headers = Object.keys(jsonData[0]); // Extract column headers from the first setPoint object
  const csvContent = jsonData
    .map((row) => headers.map((header) => row[header]).join(","))
    .join("\n"); // Correct the join separator to newline for rows

  if (!fs.existsSync(filePath)) {
    // Write headers only if the file doesn't exist
    fs.writeFileSync(filePath, headers.join(",") + "\n");
  }

  fs.writeFileSync(filePath, csvContent + "\n"); // Append to the CSV file
  alert("File Saved Successfully");
  generateChannelCards(savedNumberOfChannels);
  for (i = 1; i <= savedNumberOfChannels; i++) {
    readAdditionalInfo(i, (err, channelData) => {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        // Use channelData for further processing
        console.log("Channel Data:", channelData);
      }
    });
  }
}

///************************************************************************************************************/
async function listAvailablePorts() {
  let ports = [];
  ipcRenderer.send("port-list");
  ipcRenderer.on("port-list-reply", (event, data) => {
    ports = data;
    console.log("ports", ports);
    const comPortSelect = document.getElementById("comPortSelect");
    comPortSelect.innerHTML = '<option value="">Select Port</option>';
    ports.forEach((port) => {
      const option = document.createElement("option");
      option.value = port.path;
      console.log("Port Path:", port.path);
      option.text = port.path;
      comPortSelect.appendChild(option);
      flg_listenerAdded = false;
    });
  });
}

// /************************************************************************************************************/
function saveData() {
  // const savedNumberOfChannels = 8; // Assuming a default value for savedNumberOfChannels

  const setPoint = [];

  for (let i = 1; i <= savedNumberOfChannels; i++) {
    const lslInput = document.getElementById(`lsl${i}`);
    const uslInput = document.getElementById(`usl${i}`);

    localStorage.setItem(`lsl${i}`, lslInput.value);
    localStorage.setItem(`usl${i}`, uslInput.value);

    const channelObject = {
      Channel: "Channel_" + i,
      LSL: lslInput.value,
      USL: uslInput.value,
    };

    setPoint.push(channelObject);
  }

  const filePath = path.join(globalFilePath, "SetPoint.csv"); // Use the received data from IPC for the file path
  const headers = Object.keys(setPoint[0]); // Extract column headers from the first se.ptPoint object
  const csvContent = setPoint
    .map((row) => headers.map((header) => row[header]).join(","))
    .join("\n"); // Correct the join separator to newline for rows

  if (!fs.existsSync(filePath)) {
    // Write headers only if the file doesn't exist
    fs.writeFileSync(filePath, headers.join(",") + "\n");
  }

  fs.writeFileSync(filePath, csvContent + "\n"); // Append to the CSV file
  alert("File Saved Successfully");
}

/************************************************************************************************************/
function loadData() {
  // Load saved data from localStorage and populate the inputs
  for (let i = 1; i <= savedNumberOfChannels; i++) {
    const lslInput = document.getElementById(`lsl${i}`);
    const uslInput = document.getElementById(`usl${i}`);
    const savedLSL = localStorage.getItem(`lsl${i}`);
    const savedUSL = localStorage.getItem(`usl${i}`);

    if (savedLSL !== null) {
      lslInput.value = savedLSL;
    }

    if (savedUSL !== null) {
      uslInput.value = savedUSL;
    }
  }
}

/************************************************************************************************************/
function Save_COM_Data() {
  const comInput = document.getElementById(`comPortSelect`);
  localStorage.setItem(`comPortSelect`, comInput.value);
}

function load_COM_Data() {
  const comInput = document.getElementById(`comPortSelect`);
  const savedcom = localStorage.getItem(`comPortSelect`);
  comInput.value = savedcom;
  if (savedcom !== null) {
    comInput.value = savedcom;
  }
}

/************************************************************************************************************/
function dataToChannel(integerDataArray) {
  if (!flg_InHistory) {
    // receivedDataTextarea1.value = integerDataArray[0] + " ";
    // receivedDataTextarea2.value = integerDataArray[1] + " ";
    // receivedDataTextarea3.value = integerDataArray[2] + " ";
    // receivedDataTextarea4.value = integerDataArray[3] + " ";
    // receivedDataTextarea5.value = integerDataArray[4] + " ";
    // receivedDataTextarea6.value = integerDataArray[5] + " ";
    // receivedDataTextarea7.value = integerDataArray[6] + " ";
    // receivedDataTextarea8.value = integerDataArray[7] + " ";
    // receivedDataTextarea9.value = integerDataArray[8] + " ";

    for (let i = 1; i <= savedNumberOfChannels; i++) {
      document.getElementById("receivedDataTextarea" + i).value =
        integerDataArray[i - 1] + " ";
    }
  }
}

/************************************************************************************************************/
function saveDataToFile(data, filePath) {
  // Convert data to JSON string
  const jsonData = JSON.stringify(data, null, 2); // Write the JSON string to the file
  fs.writeFileSync(filePath, jsonData, "utf-8");
}

/************************************************************************************************************/
function SendData(dataFrame) {
  if (port && port.isOpen) {
    try {
      port.write(Buffer.from(dataFrame));

      console.log("Data sent", dataFrame);
      delay(500);
    } catch (error) {
      console.error("Error writing data:", error);
    }
  } else {
    console.error("Serial port is not open.");
  }
}

/************************************************************************************************************/
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/************************************************************************************************************/
function decryptLines(lines) {
  return lines.map((line) => decrypt(line));
}

/************************************************************************************************************/
function readLastValues(filePath) {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "base64"); // Read the content of the CSV file
    const decryptedContent = decrypt(fileContent);
    const lines = decryptedContent.split("\n"); // Split the content by lines
    const decryptedLines = decryptLines(lines);

    let lastLine = null; // Get the last non-empty line
    for (let i = decryptedLines.length - 2; i >= 1; i--) {
      const line = decryptedLines[i].trim();
      if (line !== "") {
        lastLine = line;
        break;
      }
    }

    if (lastLine) {
      const values = lastLine.split(",");
      for (let i = 1; i <= savedNumberOfChannels; i++) {
        var textareaValue = values[i + 1] || ""; // If value is undefined, set it to an empty string
        if (textareaValue == "OPEN") {
          window["receivedDataTextarea" + i].value = textareaValue;
        } else {
          window["receivedDataTextarea" + i].value = textareaValue; // Otherwise, set the textarea value to the actual value
        }
      }
    } else {
      alert("No data found in the file.");
      for (let i = 1; i <= savedNumberOfChannels; i++) {
        document.getElementById("receivedDataTextarea" + i).value = 0;
      }
    }
  } else {
    let count;
    for (let i = 1; i <= savedNumberOfChannels; i++) {
      count++;
      document.getElementById("receivedDataTextarea" + i).value = 0;
    }
    alert("File Not Found For Selected Date");
  }
}

/************************************************************************************************************/
function readAndDisplayLiveData() {
  flg_InHistory = false;
  const currentDate = new Date();
  var showingDate = document.getElementById("ShowingDate");
  document.getElementById("selectDate").valueAsDate = currentDate;
  const localDate = localStorage.getItem("selectedDate");
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const mDate = year + "-" + month + "-" + day;
  const mDate2 = day + "-" + month + "-" + year;
  localStorage.setItem("selectedDate", mDate);
  showingDate.textContent = "Live";
  const fileName = `${year}_${month}_${day}.csv`;
  var DataPath = "";
  ipcRenderer.send("GetAppPath");
  ipcRenderer.once("dataPath", (event, data) => {
    DataPath = data;
    const filePath = path.join(DataPath, fileName); // const DataPath = app.getAppPath();
    shareData();
    readLastValues(filePath);
  });
}

/************************************************************************************************************/
function readAndDisplayHistoryData() {
  flg_InHistory = true;
  const currentDate = new Date();

  // Get the current date and time components
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");

  // Concatenate date components
  const fullDate = `${day}-${month}-${year}`;

  const selectedDateInput = document.getElementById("selectDate");
  const selectedDate = selectedDateInput.value;
  var formatedDate = selectedDate.split("-").reverse().join("-");

  if (fullDate == formatedDate) {
    formatedDate = "Live";
  }
  if (!selectedDate) {
    // Check if a date is selected
    alert("Please select a date.");
    return;
  }

  localStorage.setItem("selectedDate", selectedDate); // Set the selected date in localStorage
  const showingDate = document.getElementById("ShowingDate"); // Display the selected date

  console.log("formatedDate", formatedDate);
  showingDate.textContent = formatedDate;
  const fileName = generateFileName(selectedDate); // Generate file name and construct file path
  ipcRenderer.send("GetAppPath");
  ipcRenderer.once("dataPath", (event, data) => {
    const appPath = data;
    const filePath = path.join(appPath, fileName);
    shareData();
    readLastValues(filePath); // Read last values from the file
  });
}

/************************************************************************************************************/
function loadHistoryDate() {
  const retrievedDate = localStorage.getItem("selectedDate");
  const selectedDateInput = document.getElementById("selectDate");
  selectedDateInput.value = retrievedDate;
}

/************************************************************************************************************/
function generateFileName(selectedDate) {
  const [year, month, day] = selectedDate.split("-");
  return `${year}_${month}_${day}.csv`;
}

/************************************************************************************************************/
function shareData(channel_Num) {
  const selectedDateInput = document.getElementById("selectDate");
  const selectedDate = selectedDateInput.value;
  ipcRenderer.send("Date", selectedDate, channel_Num);
}

/************************************************************************************************************/
let sidebarCollapsed = false; //sidebar collapse
function toggleSidebar() {
  document.querySelector("#sidebar").classList.toggle("collapsed");
  sidebarCollapsed = !sidebarCollapsed; // Toggle the sidebar state
  const arrowSymbol = document.getElementById("arrowSymbol"); // Get the arrow symbol element

  if (sidebarCollapsed) {
    // Update the arrow symbol based on the sidebar state
    arrowSymbol.innerHTML = "&#11166"; // Right arrow symbol
  } else {
    arrowSymbol.innerHTML = "&#11164"; // Left arrow symbol
  }
}

/************************************************************************************************************/
function encrypt(text) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

function decrypt(data) {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
}

/********************************************************************************************************/
function generateChannelCards(numChannels) {
  const container = document.getElementById("channelCardsContainer");
  // Clear existing content
  container.innerHTML = "";

  for (let i = 1; i <= numChannels; i++) {
    readAdditionalInfo(i, (err, channelData) => {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        // Use channelData for further processing
        console.log("Channel Data:", channelData);
      }
    });
    const card = document.createElement("div");
    card.className = "col";
    card.innerHTML = `
        <div class="card text-center mb-3 shadow-lg">
          <div class="card-body" style ="font-family:'Garamond';background-color: #d4dbdbfb;color:black; border-style: outset; border-width: 5px 8px; border-color: #a9e8ec;; border-radius: 0.2rem; border-right:White; border-top:White;">
            <h4 id="channelTitle${i}" "style="font-weight: bold;font-size: 24pt;font-family:'Garamond'; color:black;"></h4>
            <textarea id="receivedDataTextarea${i}" rows="1" cols="6"
              style="font-size: 30pt;font-weight: bold;font-family:'lucida console'; color: green; background-color: #d4dbdbfb; text-align: center; border: none; resize: none;"
              readonly></textarea>
            <p class="card-text"></p>
            <a href="Channel_1.html" class="btn btn-primary" style="border-radius: 25px;"
              id="channel_${i}" onclick="shareData(${i});">More</a>
          </div>
        </div>
      `;
    container.appendChild(card);
  }
  ipcRenderer.send("AppIs");
  ipcRenderer.once("AppIsOn", (event, data) => {
    readAndDisplayLiveData();
  });
  ipcRenderer.once("AppIsOff", (event, data) => {
    readAndDisplayHistoryData();
  });
}

/********************************************************************************************************/
function readAdditionalInfo(channelNum, callback) {
  const titleElement = document.getElementById(`channelTitle${channelNum}`);
  const csvFileName = "Channel_Description.csv";
  const csvFilePath = path.join(globalFilePath, csvFileName);

  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading CSV file:", err);
      callback(err, null);
      return;
    }

    const additionalDataRows = data.split("\n").map(row => row.trim());
    const channelData = [];

    additionalDataRows.forEach(row => {
      const columns = row.split(",");
      if (columns.length >= 2) {
        const channelValue = columns.slice(1).join(",").trim(); // Join all columns except the first one
        console.log('channelValue :',channelValue);
        channelData.push(channelValue);
        titleElement.textContent = channelValue;
      }
    });

    // Pass the channelData array to the callback
    callback(null, channelData);
  });
}

/********************************************************************************************************/

function generateInputFields(numChannels) {
  var tableBody = document
    .getElementById("setpointTable")
    .getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Clear existing rows

  for (var i = 1; i <= numChannels; i++) {
    var row = tableBody.insertRow();
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);

    cell1.innerHTML = "Channel " + i;
    cell2.innerHTML = '<input type="number" id="lsl' + i + '">';
    cell3.innerHTML = '<input type="number" id="usl' + i + '">';
  }
}

/********************************************************************************************************/
function generateChannelDescriptionFields(numChannels) {
  var channelDescriptionRows = document.getElementById(
    "channelDescriptionRows"
  );
  channelDescriptionRows.innerHTML = ""; // Clear existing rows

  for (var i = 1; i <= numChannels; i++) {
    var colDiv = document.createElement("div");
    colDiv.classList.add("col");

    var mbDiv = document.createElement("div");
    mbDiv.classList.add("mb-3");

    var label = document.createElement("label");
    label.setAttribute("for", "channel" + i);
    label.classList.add("form-label");
    label.textContent = "Channel " + i;

    var input = document.createElement("input");
    input.setAttribute("type", "text");
    input.classList.add("form-control");
    input.setAttribute("id", "datachannel_" + i);

    mbDiv.appendChild(label);
    mbDiv.appendChild(input);
    colDiv.appendChild(mbDiv);
    channelDescriptionRows.appendChild(colDiv);
  }
}

/********************************************************************************************************/
/********************************************************************************************************/
/*****************************END OF FILE ***************************************************************/
/*********************************************************************************************************
 This is sole licence property of Electronics Systems and Devices incase of any copy or
 reproduce will ask to autority.
************************************************************************************************************/
