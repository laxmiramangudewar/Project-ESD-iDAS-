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
var savedNumberOfDevices;
var flg_InHistory = false;
var dynamicTableDropdownOptions;
var dynamicGraphDropdownOptions;
/************************************************************************************************************/
// Processes
/************************************************************************************************************/

document.addEventListener("DOMContentLoaded", async () => {
  var numberOfDevicesInput = document.getElementById("numberOfDevices");
  numberOfDevicesInput.value = localStorage.getItem("numberOfDevices") || "";
  savedNumberOfDevices = numberOfDevicesInput.value; // Assign the value, not the input element
  if (savedNumberOfDevices == 0 || savedNumberOfDevices == undefined) {
    savedNumberOfDevices = 1;
  }

  const applybutton3 = document.getElementById('SaveNumberOfDevices');
  applybutton3.addEventListener('click', function () {
    // Get the input values
    var numberOfDevices = numberOfDevicesInput.value;
    console.log('numberOfDevices',numberOfDevices);
    localStorage.setItem('numberOfDevices', numberOfDevices);
    
    generateChannelCards(numberOfDevices);
    generateChannelDescriptionFields(numberOfDevices);
    dynamicTableDropdownOptions = generateTableDropdownOptions(numberOfDevices);
    document.getElementById('dynamicTableDropdown').innerHTML = dynamicTableDropdownOptions;
    dynamicGraphDropdownOptions = generateGraphDropdownOptions(numberOfDevices);
    document.getElementById('dynamicGraphDropdown').innerHTML = dynamicGraphDropdownOptions;
    alert("Success");
  });
  generateChannelCards(savedNumberOfDevices);
  generateChannelDescriptionFields(savedNumberOfDevices);
  dynamicTableDropdownOptions = generateTableDropdownOptions(savedNumberOfDevices);
  document.getElementById('dynamicTableDropdown').innerHTML = dynamicTableDropdownOptions;
  dynamicGraphDropdownOptions = generateGraphDropdownOptions(savedNumberOfDevices);
  document.getElementById('dynamicGraphDropdown').innerHTML = dynamicGraphDropdownOptions;

  load_COM_Data();
  loadHistoryDate();
  listAvailablePorts();

  const comPortSelect = document.getElementById("comPortSelect");
  const connectButton = document.getElementById("connectButton");
  const refreshButton = document.getElementById("refreshButton");
  const applybutton = document.getElementById("Apply");
  const applybutton1 = document.getElementById("Apply1");

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

  /************************************************************************************************************/

  applybutton.addEventListener("click", async () => {
    const Ch1_Discription = document.getElementById("datachannel_1").value;
    const Ch2_Discription = document.getElementById("datachannel_2").value;
    const Ch3_Discription = document.getElementById("datachannel_3").value;
    const Ch4_Discription = document.getElementById("datachannel_4").value;
    const Ch5_Discription = document.getElementById("datachannel_5").value;
    const Ch6_Discription = document.getElementById("datachannel_6").value;
    const Ch7_Discription = document.getElementById("datachannel_7").value;
    const Ch8_Discription = document.getElementById("datachannel_8").value;
    const Ch9_Discription = document.getElementById("datachannel_9").value;

    let Add_Info = [
      {
        CH1: Ch1_Discription,
        CH2: Ch2_Discription,
        CH3: Ch3_Discription,
        CH4: Ch4_Discription,
        CH5: Ch5_Discription,
        CH6: Ch6_Discription,
        CH7: Ch7_Discription,
        CH8: Ch8_Discription,
        CH9: Ch9_Discription,
      },
    ];
    let fileName = "device_Description.csv";
    jsonToCsv(Add_Info, fileName);
  });

  // applybutton.addEventListener("click", async () => {
  //   let Add_Info = [];

  //   for (let i = 1; i <= savedNumberOfDevices; i++) {
  //     const channelElement = document.getElementById(`datachannel_${i}`);

  //     if (channelElement) {
  //       const channelDescription = channelElement.value;
  //       Add_Info.push({ [`CH${i}`]: channelDescription });
  //     } else {
  //       console.error(`Element with ID datachannel_${i} not found.`);
  //     }
  //   }

  //   let fileName = "device_Description.csv";
  //   jsonToCsv(Add_Info, fileName);
  // });

  /************************************************************************************************************/
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
/************************************************************************************************************/
//Function Definations
/************************************************************************************************************/
/************************************************************************************************************/
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
    });
  });
}
/************************************************************************************************************/
function Save_COM_Data() {
  const comInput = document.getElementById(`comPortSelect`);
  localStorage.setItem(`comPortSelect`, comInput.value);
}

function load_COM_Data() {
  const comInput = document.getElementById(`comPortSelect`);
  const savedcom = localStorage.getItem(`comPortSelect`);

  if (savedcom !== null) {
    comInput.value = savedcom;
  }
}

/************************************************************************************************************/
// function dataToChannel(integerDataArray) {
//   if (!flg_InHistory) {
//     receivedDataTextarea1.value = integerDataArray[0] + " ";
//     receivedDataTextarea2.value = integerDataArray[1] + " ";
//     receivedDataTextarea3.value = integerDataArray[2] + " ";
//     receivedDataTextarea4.value = integerDataArray[3] + " ";
//     receivedDataTextarea5.value = integerDataArray[4] + " ";
//     receivedDataTextarea6.value = integerDataArray[5] + " ";
//     receivedDataTextarea7.value = integerDataArray[6] + " ";
//     receivedDataTextarea8.value = integerDataArray[7] + " ";
//     receivedDataTextarea9.value = integerDataArray[8] + " ";
//   }
// }
/************************************************************************************************************/

/************************************************************************************************************/
function loadHistoryDate() {
  const retrievedDate = localStorage.getItem("selectedDate");
  const selectedDateInput = document.getElementById("selectDate");
  selectedDateInput.value = retrievedDate;
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
function shareData(device_Num) {
    ipcRenderer.send("deviceNum",device_Num);
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
    readAdditionalInfo(i);
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
            <a href="index.html" class="btn btn-primary" style="border-radius: 25px;"
              id="device_${i}" onclick="shareData(${i});">More</a>
          </div>
        </div>
      `;
    container.appendChild(card);
  }
}

/********************************************************************************************************/
function generateTableDropdownOptions(numOptions) {
  let dropdownOptions = '';

  for (let i = 1; i <= numOptions; i++) {
      dropdownOptions += `<li><a class="dropdown-item" href="#" style="font-weight: bold;">Device ${i}</a></li>`;
  }

  return dropdownOptions;
}

/********************************************************************************************************/
function generateGraphDropdownOptions(numOptions) {
  let dropdownOptions = '';

  for (let i = 1; i <= numOptions; i++) {
      dropdownOptions += `<li><a class="dropdown-item" href="#" style="font-weight: bold;">Device ${i}</a></li>`;
  }

  return dropdownOptions;
}
/********************************************************************************************************/
function readAdditionalInfo(channelNum) {
  ipcRenderer.send("GetAppPath");
  ipcRenderer.once("dataPath", (event, data) => {
    var titleElement = document.getElementById(`channelTitle${channelNum}`);
    const DataPath = data;
    const csvFileName = "device_Description.csv";

    const csvFilePath = path.join(DataPath, csvFileName);

    fs.readFile(csvFilePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading CSV file:", err);
        callback(err, null);
        return;
      }

      const Additional_Data = data.split(",");
      let c1d = Additional_Data[0];
      let c2d = Additional_Data[1];
      let c3d = Additional_Data[2];
      let c4d = Additional_Data[3];
      let c5d = Additional_Data[4];
      let c6d = Additional_Data[5];
      let c7d = Additional_Data[6];
      let c8d = Additional_Data[7];
      let c9d = Additional_Data[8];
      let c10d = Additional_Data[9];
      let c11d = Additional_Data[10];
      let c12d = Additional_Data[11];
      let c13d = Additional_Data[12];
      let c14d = Additional_Data[13];
      let c15d = Additional_Data[14];
      let c16d = Additional_Data[15];

      let tempArray = [
        c1d,
        c2d,
        c3d,
        c4d,
        c5d,
        c6d,
        c7d,
        c8d,
        c9d,
        c10d,
        c11d,
        c12d,
        c13d,
        c14d,
        c15d,
        c16d,
      ];

      titleElement.textContent = tempArray[channelNum - 1];
    });
  });
}

/********************************************************************************************************/
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
