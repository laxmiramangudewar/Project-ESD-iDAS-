/*****************************************************************************************
 * File Name          : Main.js
 * Description        : This file provides code for the configuration of the
 *                       main file Layer instances.
 * Project Number     : ESD-iDAS
 * Author             : Team ESD-iDAS
 * Modified BY        : Abhishek Zagare
 * Modification Date  : 20/12/2023
 * Project Details    : This Application serves MODBUS communicaton for data acquisition and monitoring via com port.
 *************************************************************************************************************/
const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const url = require("url");
const { SerialPort } = require("serialport");
const fs = require("fs");
const CryptoJS = require("crypto-js");
// const xlsx = require('xlsx');
const ExcelJS = require('exceljs');


/*************************************************************************************************************/
var mainWindow;
var port;
var listed_Ports = 0;
var channelData = [];
var flg_IsPortOpen = false;
var flg_ReadingData = false;
var JSON_8_Ch;
var JSON_16_Ch;
var flg_AppOn = false;
var folderPath;
var MyDate = 0;
var Channel_Num = 0;
var numConfigChannel = 8;
var maindate = 0;
var chnCheckedArray;
var decimalPointDevider;
var deviceId;
var functionCode;
var address;
var quantity;
var hexData;
var device_Number;

const crc16_tab = [
  0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241, 0xc601,
  0x06c0, 0x0780, 0xc741, 0x0500, 0xc5c1, 0xc481, 0x0440, 0xcc01, 0x0cc0,
  0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40, 0x0a00, 0xcac1, 0xcb81,
  0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841, 0xd801, 0x18c0, 0x1980, 0xd941,
  0x1b00, 0xdbc1, 0xda81, 0x1a40, 0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01,
  0x1dc0, 0x1c80, 0xdc41, 0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0,
  0x1680, 0xd641, 0xd201, 0x12c0, 0x1380, 0xd341, 0x1100, 0xd1c1, 0xd081,
  0x1040, 0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
  0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441, 0x3c00,
  0xfcc1, 0xfd81, 0x3d40, 0xff01, 0x3fc0, 0x3e80, 0xfe41, 0xfa01, 0x3ac0,
  0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840, 0x2800, 0xe8c1, 0xe981,
  0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41, 0xee01, 0x2ec0, 0x2f80, 0xef41,
  0x2d00, 0xedc1, 0xec81, 0x2c40, 0xe401, 0x24c0, 0x2580, 0xe541, 0x2700,
  0xe7c1, 0xe681, 0x2640, 0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0,
  0x2080, 0xe041, 0xa001, 0x60c0, 0x6180, 0xa141, 0x6300, 0xa3c1, 0xa281,
  0x6240, 0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
  0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41, 0xaa01,
  0x6ac0, 0x6b80, 0xab41, 0x6900, 0xa9c1, 0xa881, 0x6840, 0x7800, 0xb8c1,
  0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41, 0xbe01, 0x7ec0, 0x7f80,
  0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40, 0xb401, 0x74c0, 0x7580, 0xb541,
  0x7700, 0xb7c1, 0xb681, 0x7640, 0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101,
  0x71c0, 0x7080, 0xb041, 0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0,
  0x5280, 0x9241, 0x9601, 0x56c0, 0x5780, 0x9741, 0x5500, 0x95c1, 0x9481,
  0x5440, 0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
  0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841, 0x8801,
  0x48c0, 0x4980, 0x8941, 0x4b00, 0x8bc1, 0x8a81, 0x4a40, 0x4e00, 0x8ec1,
  0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41, 0x4400, 0x84c1, 0x8581,
  0x4540, 0x8701, 0x47c0, 0x4680, 0x8641, 0x8201, 0x42c0, 0x4380, 0x8341,
  0x4100, 0x81c1, 0x8081, 0x4040,
];

/************************************************************************************************************/
const isMac = process.platform === "darwin";
const template = [
  ...(isMac
    ? [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
    ]
    : []),

  {
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
  },

  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      ...(isMac
        ? [
          { role: "pasteAndMatchStyle" },
          { role: "delete" },
          { role: "selectAll" },
          { type: "separator" },
          {
            label: "Speech",
            submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
          },
        ]
        : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
    ],
  },

  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      ...(isMac
        ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" },
        ]
        : [{ role: "close" }]),
    ],
  },
  {
    label: "More",
    submenu: [
      {
        label: "About ESD",
        click: async () => {
          const { shell } = require("electron");
          await shell.openExternal("https://www.esd-india.com/");
        },
      },
    ],
  },
];

/************************************************************************************************************/
function createWindow() {
  // for browser
  mainWindow = new BrowserWindow({
    title: "ESD Communication",
    show: false,
    focusable: true,
    icon: "icon.ico",
    backgroundColor: "#ccc",
    autoHideMenuBar: true, // Hide the menu bar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "Login.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

/************************************************************************************************************/
app.whenReady().then(() => {
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const appDataPath = app.getPath("appData"); // Get the appData directory path
  const folderName = "esd_idas_data"; // Specify the folder name you want to create
  folderPath = path.join(appDataPath, folderName); // Create the full path to the folder

  if (!fs.existsSync(folderPath)) {
    // Check if the folder exists, and create it if not
    fs.mkdirSync(folderPath);
    console.log("Folder created:", folderPath);
  } else {
    console.log("Folder already exists:", folderPath);
  }
});

/************************************************************************************************************/
ipcMain.on("AppIs", (event, Data) => {
  if (!flg_AppOn) {
    event.reply("AppIsOn");
    flg_AppOn = true;
  } else {
    event.reply("AppIsOff");
  }
});

/************************************************************************************************************/
ipcMain.on("Date", (event, Data, cnum) => {
  MyDate = Data;
  Channel_Num = cnum;
});

/************************************************************************************************************/
ipcMain.on("GetAppPath", (event, data) => {
  event.reply("dataPath", folderPath);
});

/************************************************************************************************************/
ipcMain.on("req", (event, data) => {
  event.reply("reply", MyDate, Channel_Num);
});

ipcMain.on("reqDate", (event, data) => {
  event.reply("reply", MyDate);
  console.log("Reply Sent", MyDate);
});

/************************************************************************************************************/
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

/************************************************************************************************************/
ipcMain.on("port-list", (event, data) => {
  listPorts();
  event.reply("port-list-reply", listed_Ports);
});

/************************************************************************************************************/
ipcMain.on("frame_Parameters", (event, data1, data2, data3, data4) => {
  deviceId = data1;
  functionCode = data2;
  address = data3;
  quantity = data4;
  buildRequest();
});

/************************************************************************************************************/
ipcMain.on("DecimalPoint", (event, Data) => {
  decimalPointDevider = Data;
});

/************************************************************************************************************/

ipcMain.on("chnCheckedArray", (event, Data) => {
  chnCheckedArray = Data;
});

/************************************************************************************************************/

ipcMain.on("deviceNum", (event, Data) => {
  device_Number = Data;
  console.log('DeviceNumber = ', device_Number);
});
/************************************************************************************************************/
ipcMain.on('GiveDeviceNum', (event, Data) => {
  event.reply("deviceNumber", device_Number, folderPath);
});
/************************************************************************************************************/
ipcMain.on("disConnect-Port", (event, data) => {
  if (port && port.isOpen) {
    try {
      port.close();
      console.log("Disconnected from the serial port");
      event.reply("disConnect-Port-reply");
    } catch (error) {
      console.error("Error disconnecting from the serial port:", error);
    }
  }
});

/************************************************************************************************************/
ipcMain.on("Connect-To-SerialPort", (event, Data) => {
  const selectedPort = Data;
  console.log(selectedPort);

  try {
    if (port && port.isOpen) {
      event.reply("alert", selectedPort + "is already Connected!");
      return;
    }

    if (!selectedPort) {
      event.reply("alert", "Please select a COM port?");
      return;
    }

    const serialOptions = {
      path: selectedPort,
      baudRate: 1200, // Specify your desired baud rate
      autoOpen: false,
      dataBits: 8,
      bufferSize: 255,
      flowControl: false,
    };

    port = new SerialPort(serialOptions);
    port.open((err) => {
      // Open the serial port
      if (err) {
        console.error("Error opening serial port:", err);
      } else {
        flg_IsPortOpen = true;
        event.reply("alert", selectedPort + "connected successfully.");
        port.on("close", () => {
          flg_IsPortOpen = false;
          console.log("Serial port closed.");
        });
      }
    });
  } catch (error) {
    event.reply("alert", "Error connecting to" + selectedPort);
  }

  let receivedDataHex = ""; // Initialize a variable to accumulate received data
  port.on("data", (data) => {
    const receivedDataChunk = data.toString("hex");
    receivedDataHex += receivedDataChunk;
    // Check if you have received at least 21 bytes
    if (receivedDataHex.length >= 46) {
      // 2 characters for each byte, 21 bytes in total

      let TempData = receivedDataHex;
      const intValue = byteArrayHexTo16BitIntegers(TempData);
      event.reply("data-to-channel", intValue);
      parseFrame(intValue);
      // Reset the receivedDataHex for the next data
      receivedDataHex = "";
    }
  });

  setInterval(() => {
    if (flg_IsPortOpen && !flg_ReadingData) {
      SendData(hexData);
    }
  }, 10000);
});


/************************************************************************************************************/

// ipcMain.on('save-excel-file', async (event, csvData) => {
//   // Create a new Excel workbook
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('Sheet1');

//   // Convert CSV data to an array of rows
//   const rows = csvData.split('\n').map(row => row.split(','));

//   // Add the rows to the worksheet
//   worksheet.addRows(rows);

//   // Show file dialog to select destination path
//   const result = await dialog.showSaveDialog(mainWindow, {
//     title: 'Save Excel File',
//     defaultPath: path.join(app.getPath('desktop'), 'output.xlsx'),
//     filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
//   });

//   if (!result.canceled) {
//     const excelFilePath = result.filePath;

//     // Save the Excel file
//     await workbook.xlsx.writeFile(excelFilePath);

//     // Send a message to the renderer process when the Excel file is created
//     mainWindow.webContents.send('excel-created', excelFilePath);
//   }
// });


/************************************************************************************************************/
function crc16(crc, buf) {
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >> 8) ^ crc16_tab[(crc ^ buf[i]) & 0xff];
  }
  return crc;
}

/************************************************************************************************************/
async function buildRequest() {
  const dataToSend = [
    deviceId,
    functionCode,
    (address >> 8) & 0xff,
    address & 0xff,
    (quantity >> 8) & 0xff,
    quantity & 0xff,
  ];

  const crc = crc16(0xffff, dataToSend);
  const crcBytes = [crc & 0xff, (crc >> 8) & 0xff];

  const dataWithCRC = [...dataToSend, ...crcBytes];
  const sendData = new Uint8Array(dataWithCRC);
  hexData = Buffer.from(sendData, "hex");
}

/************************************************************************************************************/
function byteArrayHexTo16BitIntegers(data_) {
  const byteArray = new Uint8Array(
    data_.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  const trimmedArray = byteArray.slice(3, -2);

  const integers = [];

  for (let i = 0; i < trimmedArray.length; i += 2) {
    const value = (trimmedArray[i] << 8) | trimmedArray[i + 1];
    integers.push(value);
  }

  return integers;
}
/************************************************************************************************************/
async function listPorts() {
  try {
    const ports = await SerialPort.list();
    listed_Ports = ports;
  } catch (error) {
    console.error("Error listing available ports:", error);
  }
}

/************************************************************************************************************/
function saveDataToFile(data, filePath) {
  const jsonData = JSON.stringify(data, null, 2); // Convert data to JSON string
  fs.writeFileSync(filePath, jsonData, "utf-8"); // Write the JSON string to the file
}

/************************************************************************************************************/
function SendData(dataFrame) {
  if (port && port.isOpen) {
    try {
      port.write(dataFrame);

      console.log("Data sent", dataFrame);
    } catch (error) {
      console.error("Error writing data:", error);
    }
  } else {
    console.error("Serial port is not open.");
  }
}

/************************************************************************************************************/
// Incoming Frame 3a 02 03 1000 1000 1000 0c39 1000 1000 1000 1000 0420 0070 3b
//folderPath
function parseFrame(frame) {

  const currentDate = new Date();

  // Get the current date and time components
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const day = currentDate.getDate().toString().padStart(2, '0');
  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');
  const seconds = currentDate.getSeconds().toString().padStart(2, '0');

  // Concatenate date components
  const fullDate = `${day}-${month}-${year}`;
  console.log("fullDate", fullDate);
  // Concatenate time components
  const fullTime = `${hours}:${minutes}:${seconds}`;

  const DataPath = folderPath;
  const csvFileName = "Channel_Description.csv";

  const csvFilePath = path.join(DataPath, csvFileName);

  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading CSV file:", err);
      callback(err, null);
      return;
    }
    const ChannelName = data.split(",");

    const JSON_8_Ch = [
      {
        Date: fullDate,
        Time: fullTime,
        [ChannelName[0]]: frame[0],
        [ChannelName[1]]: frame[1],
        [ChannelName[2]]: frame[2],
        [ChannelName[3]]: frame[3],
        [ChannelName[4]]: frame[4],
        [ChannelName[5]]: frame[5],
        [ChannelName[6]]: frame[6],
        [ChannelName[7]]: frame[7],
        [ChannelName[8]]: frame[8],
      },
    ];
    jsonToCsv(JSON_8_Ch);
  });

}

/************************************************************************************************************/

ipcMain.on('save-excel-file', async (event, csvData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Extracting column headers from the first object in the array
  const headers = Object.keys(csvData[0]);

  // Adding headers to the worksheet
  // worksheet.addRow(headers);
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };


  // Adding data rows to the worksheet
  csvData.forEach(obj => {
    const rowValues = headers.map(header => obj[header]);
    worksheet.addRow(rowValues);
  });

  const mainWindow = BrowserWindow.getFocusedWindow();

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Excel File',
    defaultPath: path.join(app.getPath('desktop'), 'output.xlsx'),
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  });

  if (!result.canceled) {
    const excelFilePath = result.filePath;

    await workbook.xlsx.writeFile(excelFilePath);

    mainWindow.webContents.send('excel-created', excelFilePath);
  }
});


/************************************************************************************************************/
function encrypt(text) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

function decrypt(data) {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
}
/********************************************************************************************************/
/********************************************************************************************************/
/*****************************END OF FILE ***************************************************************/
/*********************************************************************************************************
 This is sole licence property of Electronics Systems and Devices incase of any copy or
 reproduce will ask to autority.
************************************************************************************************************/
