/*****************************************************************************************
 * File Name          : table.js
 * Description        : This file provides code for tabular data and PDF utility
 * Project Number     : ESD-iDAS
 * Author             : Team ESD-iDAS
 * Modified BY        : Abhishek Zagare
 * Modification Date  : 20/12/2023
 * Project Details    : This Application serves MODBUS communicaton for data acquisition and monitoring via com port.
 *************************************************************************************************************/
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");
const { ipcRenderer } = require("electron");
const pdfMake = require("pdfmake/build/pdfmake.min");
const pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var org;
var proc, cby, vby, fname, c1d, c2d, c3d, c4d, c5d, c6d, c7d, c8d;
var g_SelectedDate = 0;

/************************************************************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log('On Table.js');
  ipcRenderer.send("reqDate", "Hellow Channel");
  ipcRenderer.on("reply", (event, datedata) => {
    g_SelectedDate = datedata;
    console.log('g_SelectedDate', g_SelectedDate);
    readAndDisplayData(g_SelectedDate);
  });

  readAdditionalInfo();
  const savePdfBtn = document.getElementById("pdf");
  const saveExcelBtn = document.getElementById("excel");

  savePdfBtn.addEventListener("click", () => {
    saveTableAsPDF();
  });

  saveExcelBtn.addEventListener("click", () => {
    generateExcel();
  });

  const ReadAndisplayButton = document.getElementById("ReadAndDisplay");
  ReadAndisplayButton.addEventListener("click", () => {
    const selectedDateInput = document.getElementById("selectDate");
    const selectedDate = selectedDateInput.value;
    readAndDisplayData(selectedDate);
  });
});

/************************************************************************************************************/
function readAndDisplayData() {    
  const selectedDateInput = document.getElementById('selectDate');
  const selectedDate = selectedDateInput.value;
  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!selectedDate || !startTime || !endTime) {
    alert('Please select date, start time, and end time.');
    return;
  }

  const currentYear = new Date().getFullYear(); // Moved this inside the function to get the current year
  const fileName = generateFileName(selectedDate);
  ipcRenderer.send('GetAppPath');

  ipcRenderer.once('dataPath', (event, data) => {
    const appPath = data;
    const filePath = path.join(appPath, fileName);

    try {
      if (fs.existsSync(filePath)) {
        const csvData = fs.readFileSync(filePath, 'base64');
        const decryptedContent = decrypt(csvData);

        const rows = decryptedContent.split('\n');
        const decryptedRows = decryptLines(rows);
        var ch_values = [];

        for (let i = decryptedRows.length - 2; i >= 1; i--) {
          const cols = decryptedRows[i].split(',');
          const date__ = cols[0];
          const parts = date__.split('/');
          const firstValue = parts[0];
          const secondValue = parts[1];
          const formattedString = `${firstValue}-${secondValue}-${currentYear}`;
          const date_ = formattedString;
          const time = cols[1];
          const time_ = cols[1];

          // Filter rows based on time range
          if (isBetweenTime(time, startTime, endTime)) {
            const channelData = [];

            for (let j = 2; j < 10; j++) {
              let ch_value = cols[j];
              let ch_lsl = parseInt(cols[j + 8]);
              let ch_usl = parseInt(cols[j + 9]);

              let arrow = '';
              if (ch_value < ch_lsl) {
                arrow = '<span style="font-size: 40px; font-weight: bold; color:blue">&nbsp;&nbsp;&#8595;</span>';
              } else if (ch_value > ch_usl) {
                arrow = '<span style="font-size: 40px; font-weight: bold; color:red;">&nbsp;&nbsp;&#8593;</span>';
              }

              channelData.push({
                value: ch_value,
                arrow: arrow,
              });
            }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `<td>${date_}</td><td>${time_}</td>${channelData
              .map((channel) => `<td>${channel.value}${channel.arrow}</td>`)
              .join('')}`;
            dataBody.appendChild(newRow);
          }
        }
      } else {
        alert('File not available for the selected date.');
      }
    } catch (error) {
      console.error('Error reading and displaying data:', error);
      alert('An error occurred while processing the data.');
    }
  });
}

function isBetweenTime(time, startTime, endTime) {
  return time >= startTime && time <= endTime;
}

/************************************************************************************************************/
function generateFileName(selectedDate) {
  const [year, month, day] = selectedDate.split("-");
  return `${year}_${month}_${day}.csv`;
}

/************************************************************************************************************/
function parseCSV(csvData) {
  const lines = csvData.split("\n");
  const decryptedLines = decryptLines(lines);
  const tempheaders = decryptedLines[0].split(",");
  const headers = tempheaders.slice(0, 11);

  const data = [];
  for (let i = 1; i < decryptedLines.length; i++) {
    const tempvalues = decryptedLines[i].split(",");
    const values = tempvalues.slice(0, 11);
    const row = {};

    if (values.length === headers.length) {
      // Check if the number of values matches the number of headers
      row["Sr."] = i;
      for (let j = 0; j < headers.length; j++) {
        const value = values[j] ? values[j].trim() : ""; // Check if values[j] and headers[j] are defined before using trim
        const header = headers[j] ? headers[j].trim() : "";
        row[header] = value;
      }
      data.push(row);
    } else {
      console.error(
        `Skipping line ${i + 1} due to mismatched number of values and headers.`,
        `Headers: ${headers.length}, Values: ${values.length}, Values: ${values.join(', ')}`
      );
    }
  }

  return data;
}


/************************************************************************************************************/
function displayData(data) {
  const table = document.getElementById("dataTable");

  while (table.firstChild) {
    // Clear existing table content
    table.removeChild(table.firstChild);
  }

  const thead = document.createElement("thead"); // Create table headers
  thead.classList.add("thead-dark"); // Bootstrap dark header style
  const headerRow = document.createElement("tr");
  Object.keys(data[0]).forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody"); // Create table body
  data.forEach((row) => {
    const tr = document.createElement("tr");
    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

/************************************************************************************************************/
// function saveTableAsPDF() {
//   const selectedDateInput = document.getElementById("selectDate");
//   const selectedDate = selectedDateInput.value;

//   if (!selectedDate) {
//     alert("Please select a date.");
//     return;
//   }

//   const fileName = generateFileName(selectedDate);
//   ipcRenderer.send("GetAppPath"); // const appPath = process.resourcesPath;
//   ipcRenderer.once("dataPath", (event, data) => {
//     const appPath = data;
//     const filePath = path.join(appPath, fileName);
//     const csvData = fs.readFileSync(filePath, "utf-8");
//     const cdata = parseCSV(csvData);

//     let starttime = cdata['time'];
//     let endtime = cdata['time'];

//     const filteredData = cdata.filter(dataobject => {
//       if (dataobject['time'] === starttime || dataobject['time'] === endtime) {
//         return cdata.push(dataobject);
//       }
//     });


//     const pdfContent = generatePDFContent(filteredData, selectedDate);
//     pdfMake.createPdf(pdfContent).download(fileName + ".pdf"); // Save PDF using pdfmake
//   });
// }

/************************************************************************************************************/

function saveTableAsPDF() {
  const selectedDateInput = document.getElementById('selectDate');
  const selectedDate = selectedDateInput.value;
  const startTimeInput = document.getElementById('startTime'); // Assuming you have an input field for start time
  const endTimeInput = document.getElementById('endTime');     // Assuming you have an input field for end time
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!selectedDate || !startTime || !endTime) {
    alert('Please select date, start time, and end time.');
    return;
  }

  const fileName = generateFileName(selectedDate);
  ipcRenderer.send('GetAppPath');

  ipcRenderer.once('dataPath', (event, data) => {
    const appPath = data;
    const filePath = path.join(appPath, fileName);

    try {
      if (fs.existsSync(filePath)) {
        const csvData = fs.readFileSync(filePath, 'utf-8');
        const cdata = parseCSV(csvData);
        const filteredData = filterDataByTime(cdata, startTime, endTime);
        const pdfContent = generatePDFContent(filteredData, selectedDate);
        pdfMake.createPdf(pdfContent).download(fname + '.pdf');
      } else {
        alert('File not available for the selected date.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while generating the PDF.');
    }
  });
}
/************************************************************************************************************/
function readAdditionalInfo() {
  ipcRenderer.send("GetAppPath");
  ipcRenderer.once("dataPath", (event, data) => {
    const DataPath = data;
    const csvFileName1 = "Additional_Info.csv";
    const csvFileName2 = "Channel_Description.csv";
    const csvFilePath = path.join(DataPath, csvFileName1); // const DataPath = process.resourcesPath;
    const csvFilePath2 = path.join(DataPath, csvFileName2);
    fs.readFile(csvFilePath, "utf8", (err, data) => {
      const Additional_Data = data.split(",");
      org = Additional_Data[0];
      proc = Additional_Data[1];
      cby = Additional_Data[2];
      vby = Additional_Data[3];
      fname = Additional_Data[4];
      if (err) {
        console.error("Error reading CSV file:", err);
        return;
      }
    });

    fs.readFile(csvFilePath2, "utf8", (err, data) => {
      const Additional_Data2 = data.split(",");
      c1d = Additional_Data2[0];
      c2d = Additional_Data2[1];
      c3d = Additional_Data2[2];
      c4d = Additional_Data2[3];
      c5d = Additional_Data2[4];
      c6d = Additional_Data2[5];
      c7d = Additional_Data2[6];
      c8d = Additional_Data2[7];

      console.log('Headers', c1d, c2d, c3d, c4d, c5d, c6d, c7d);
      if (err) {
        console.error("Error reading CSV file:", err);
        return;
      }
    });
  });
}

/************************************************************************************************************/
function generatePDFContent(data, selectedDate) {
  // Function to generate PDF content with page numbers
  const content = [];
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const mDate = year + "-" + month + "-" + day;

  console.log("mDate", mDate);
  content.push({ text: "Datalog Report", style: "mainHeading" });
  content.push({ text: "\n" });
  content.push({
    // Additional information in a two-column table
    table: {
      widths: ["25%", "25%", "25%", "25%"], // Adjust column widths as needed
      body: [
        [
          { text: "Organisation :", style: "infoKey" },
          { text: org, style: "infoValue" },
          { text: "Process :", style: "infoKey" },
          { text: proc, style: "infoValue" },
        ],
        [
          { text: "File Name:", style: "infoKey" },
          { text: fname, style: "infoValue" },
          { text: "Report Generated On :", style: "infoKey" },
          { text: mDate, style: "infoValue" },
        ],
        [
          { text: "Checked By:", style: "infoKey" },
          { text: cby, style: "infoValue" },
          { text: "Verified By:", style: "infoKey" },
          { text: vby, style: "infoValue" },
        ],
      ],
    },
    layout: "grid", // Adjust layout as needed
    alignment: "center",
  });

  content.push({ text: "\n" }); // Add some space
  content.push({ text: "Channel Description", style: "discHeading" });
  content.push({ text: "\n" });

  content.push({
    table: {
      widths: ["10%", "40%", "10%", "40%"], // Adjust column widths as needed
      body: [
        [
          { text: "C1:", style: "infoKey" },
          { text: c1d, style: "infoValue" },
          { text: "C2:", style: "infoKey" },
          { text: c2d, style: "infoValue" },
        ],
        [
          { text: "C3:", style: "infoKey" },
          { text: c3d, style: "infoValue" },
          { text: "C4:", style: "infoKey" },
          { text: c4d, style: "infoValue" },
        ],
        [
          { text: "C5:", style: "infoKey" },
          { text: c5d, style: "infoValue" },
          { text: "C6:", style: "infoKey" },
          { text: c6d, style: "infoValue" },
        ],
        [
          { text: "C7:", style: "infoKey" },
          { text: c7d, style: "infoValue" },
          { text: "C8:", style: "infoKey" },
          { text: c8d, style: "infoValue" },
        ],
      ],
    },
    layout: "grid", // Adjust layout as needed
    alignment: "center",
  });

  content.push({ text: "\n" });
  const tableHeader = Object.keys(data[0]).map((header) => ({
    // Add table header
    text: header,
    style: "tableHeader",
  }));
  const tableRows = data.map((row) => Object.values(row)); // Add table rows
  content.push({
    // Combine information and table content
    layout: "grid", // Add this line
    table: {
      widths: [
        "7%",
        "10%",
        "10%",
        "8%",
        "8%",
        "8%",
        "8%",
        "8%",
        "8%",
        "8%",
        "8%",
        "8%",
      ], // Adjust column widths as needed
      headerRows: 1,
      body: [tableHeader, ...tableRows],
    },
    style: "table",
  });

  const pageFooter = function (currentPage, pageCount) {
    // Add page numbering to the footer
    return {
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "center",
      fontSize: 10,
      margin: [0, 10], // Adjust the margin as needed
    };
  };

  return {
    content: content,
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: "black",
        alignment: "center", // Set alignment to center
      },
      infoKey: {
        fontSize: 12,
        color: "gray",
        alignment: "center",
        bold: true,
      },
      infoValue: {
        fontSize: 12,
        color: "black",
        alignment: "center",
      },
      table: {
        alignment: "center",
      },
      mainHeading: {
        fontSize: 18,
        color: "black",
        bold: true,
        alignment: "center",
      },
      discHeading: {
        fontSize: 14,
        color: "black",
        bold: true,
        alignment: "center",
      },
    },
    pageMargins: [40, 60, 40, 60], // Adjust page margins as needed
    footer: pageFooter, // Add this line
  };
}

/************************************************************************************************************/
function generateExcel() {
  const selectedDateInput = document.getElementById("selectDate");
  const selectedDate = selectedDateInput.value;

  if (!selectedDate) {
    alert("Please select a date.");
    return;
  }

  const fileName = generateFileName(selectedDate);
  ipcRenderer.send("GetAppPath"); // const appPath = process.resourcesPath;
  ipcRenderer.once("dataPath", (event, data) => {
    const appPath = data;
    const filePath = path.join(appPath, fileName);
    const csvData = fs.readFileSync(filePath, "utf-8");
    const cdata = parseCSV(csvData);
    console.log('cdata', cdata);
    ipcRenderer.send('save-excel-file', cdata);
  });
}
/************************************************************************************************************/
function decryptLines(lines) {
  return lines.map((line) => decrypt(line));
}

/************************************************************************************************************/
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
