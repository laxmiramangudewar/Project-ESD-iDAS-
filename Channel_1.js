/*****************************************************************************************
 * File Name          : Channel_1.js
 * Description        : This file provides code for channels record
 * Project Number     : ESD-iDAS
 * Author             : Team ESD-iDAS
 * Modified BY        : Abhishek Zagare
 * Modification Date  : 20/12/2023
 * Project Details    : This Application serves MODBUS communicaton for data acquisition and monitoring via com port.
 *************************************************************************************************************/
const fs = require("fs");
const path = require("path");
const { ipcRenderer } = require("electron");
const CryptoJS = require("crypto-js");
const { jsPDF } = require("jspdf");

var selectedDate = 0;
var selectedChannel = 0;
var csvFileName = "";

window.addEventListener("click", function () {
  const menu = document.getElementById("customContextMenu");
  if (menu) {
    menu.remove();
  }
});

/************************************************************************************************************/
document.addEventListener("DOMContentLoaded", () => {
  var ch_value = 0;
  var ch_lsl = 0;
  var ch_usl = 0;
  var timeLabels = [];
  var ch_values = [];
  var lslValues = [];
  var uslValues = [];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  var datafor = document.getElementById("datafor");
  ipcRenderer.send("req", "Hellow Channel");
  ipcRenderer.on("reply", (event, datedata, cnum) => {
    selectedDate = datedata;
    console.log("selectedDate", selectedDate);
    selectedChannel = cnum;
    const space = "&nbsp;&nbsp;&nbsp;Date:";
    datafor.textContent =
      "Data For Channel: " +
      selectedChannel +
      "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Date: " +
      selectedDate;
    csvFileName = generateFileName(selectedDate);
    var DataPath = "";
    ipcRenderer.send("GetAppPath");
    ipcRenderer.once("dataPath", (event, datapah) => {
      DataPath = datapah;
      const csvFilePath = path.join(DataPath, csvFileName);
      // setInterval(() => {
      fs.readFile(csvFilePath, "base64", (err, data) => {
        if (err) {
          console.error("Error reading CSV file:", err);
          return;
        }
        const decryptedContent = decrypt(data);
        const rows = decryptedContent.split("\n");
        const decryptedRows = decryptLines(rows);

        for (let i = 1; i < decryptedRows.length-1; i++) {
          const cols = decryptedRows[i].split(",");
          const date__ = cols[0];
          const time_ = cols[1];

          switch (selectedChannel) {
            case 1:
              ch_value = cols[2];
              break;
            case 2:
              ch_value = cols[3];
              break;
            case 3:
              ch_value = cols[4];
              break;
            case 4:
              ch_value = cols[5];
              break;
            case 5:
              ch_value = cols[6];
              break;
            case 6:
              ch_value = cols[7];
              break;
            case 7:
              ch_value = cols[8];
              break;
            case 8:
              ch_value = cols[9];
              break;
            case 9:
              ch_value = cols[10];
              break;
            default:
              console.error("Invalid selectedChannel value:", selectedChannel); // handle invalid selectedChannel value
              break;
          }

          if (ch_value >= "OPEN") {
            ch_value = 0;
          }

          timeLabels.push(time_);
          ch_values.push(ch_value);
          
          if (ch_value < ch_lsl) {
            arrow = "&nbsp;&#8595;";
          } else if (ch_value > ch_usl) {
            arrow = "&nbsp;&#8593;";
          } else {
            arrow = "";
          }

          const newRow = document.createElement("tr"); // Create a new row in the table
          newRow.innerHTML = `<td>${date__}</td><td>${time_}</td><td>${ch_value}${arrow}</td>`;

          dataBody.appendChild(newRow);
        }

        const ctx = document.getElementById("lineChart").getContext("2d");

        if (window.myLineChart) {
          // Update existing chart
          window.myLineChart.data.labels = timeLabels;
          window.myLineChart.data.datasets[0].data = ch_values;
          window.myLineChart.update();
        } else {
          // Create a new chart with zoom and drag functionality
          window.myLineChart = new Chart(ctx, {
            type: "line",
            data: {
              labels: timeLabels,
              datasets: [
                {
                  label: "Temp",
                  data: ch_values,
                  borderColor: "green",
                  fill: false,
                  pointRadius: 2,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  type: "linear",
                  position: "bottom",
                  beginAtZero: true,
                  // Enable zoom on the x-axis and dragging
                  pan: {
                    enabled: true,
                    mode: "x",
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: "x",
                  },
                },
                y: {
                  // Enable zoom on the y-axis
                  beginAtZero: true,
                  pan: {
                    enabled: true,
                    mode: "y",
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: "y",
                  },
                },
              },
            },
          });
        }
      });
    });
  });

  setInterval(() => {
    location.reload();
  }, 30000);

  document
    .getElementById("lineChart")
    .addEventListener("contextmenu", function (e) {
      e.preventDefault();

      // Remove existing menu if it's there
      let existingMenu = document.getElementById("customContextMenu");
      if (existingMenu) {
        existingMenu.remove();
      }
      // Create and display a custom context menu
      const menuHtml = `<ul style="list-style: none; padding: 10px; background: #fff; border: 1px solid #ddd; position: absolute; left: ${e.pageX}px; top: ${e.pageY}px;">
                        <li style="padding: 5px; cursor: pointer;" onclick="downloadChart('png')">Save img as PNG</li>
                        <li style="padding: 5px; cursor: pointer;" onclick="downloadChart('jpg')">Save img as JPG</li>
                        <li style="padding: 5px; cursor: pointer;" onclick="downloadChart('pdf')">Save img as pdf</li>
                    </ul>`;
      const menuDiv = document.createElement("div");
      menuDiv.id = "customContextMenu";
      menuDiv.innerHTML = menuHtml;
      document.body.appendChild(menuDiv);
    });
  /*************************************************************************************************************************************************************************************/
  function downloadChart(format) {
    try {
      const originalCanvas = document.getElementById("lineChart");
      let canvas = originalCanvas;

      // When downloading as JPG, create a temporary canvas with a white background
      if (format === "jpg") {
        // Create a temporary canvas
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = originalCanvas.width;
        tempCanvas.height = originalCanvas.height;
        const ctx = tempCanvas.getContext("2d");

        // Fill the temporary canvas with a white background
        ctx.fillStyle = "#FFFFFF"; // White background
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the original canvas onto the temporary canvas
        ctx.drawImage(originalCanvas, 0, 0);

        // Use the temporary canvas for downloading
        canvas = tempCanvas;
      }

      if (format === "pdf") {
        // Convert canvas to an image
        const imageURL = canvas.toDataURL("image/png");

        // Create a new jsPDF instance
        const pdf = new jsPDF("p", "mm", "a4"); // 'p' for portrait, 'mm' for unit, 'a4' for page size

        // Calculate the width and height to maintain the aspect ratio of the chart
        const imgProps = pdf.getImageProperties(imageURL);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add the image to the PDF. Adjust the position and dimensions as needed
        pdf.addImage(imageURL, "PNG", 10, 10, pdfWidth - 20, pdfHeight);

        // Save the PDF
        pdf.save("chart.pdf");
      } else {
        const imageURL = canvas.toDataURL(`image/${format}`);
        const link = document.createElement("a");
        link.download = `${selectedChannel}.${format}`;
        link.href = imageURL;
        link.click();
      }
    } catch (error) {
      console.error("Error in downloadChart:", error);
    }

    // Close context menu on click outside
    document.addEventListener("click", function (event) {
      const menu = document.getElementById("customContextMenu");
      if (menu && !menu.contains(event.target)) {
        menu.remove();
      }
    });
  }

  window.downloadChart = downloadChart;

  /********************************************************************************************************/

  // Assuming 'lineChart' is your chart instance

  // Function to zoom in/out
  function zoomChart(event) {
    event.preventDefault();

    var deltaY = event.deltaY;
    var zoomFactor = 1.1;
    var chart = window.myLineChart;

    if (!chart) return;

    var xScale = chart.options.scales.x;
    var yScale = chart.options.scales.y;

    // Check if min and max properties are defined
    if (
      xScale &&
      yScale &&
      "min" in xScale &&
      "max" in xScale &&
      "min" in yScale &&
      "max" in yScale
    ) {
      if (deltaY < 0) {
        // Zoom in
        xScale.min /= zoomFactor;
        xScale.max /= zoomFactor;
        yScale.min /= zoomFactor;
        yScale.max /= zoomFactor;
      } else {
        // Zoom out
        xScale.min *= zoomFactor;
        xScale.max *= zoomFactor;
        yScale.min *= zoomFactor;
        yScale.max *= zoomFactor;
      }

      chart.update();
    }
  }

  document.getElementById("lineChart").addEventListener("wheel", zoomChart);
});
/************************************************************************************************************/

function generateFileName(selectedDate) {
  const [year, month, day] = selectedDate.split("-");
  return `${year}_${month}_${day}.csv`;
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
/*************************************END OF FILE *******************************************************/
/*********************************************************************************************************
 This is sole licence property of Electronics Systems and Devices incase of any copy or
 reproduce will ask to autority.
************************************************************************************************************/
