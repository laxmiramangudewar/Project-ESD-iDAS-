/*****************************************************************************************
 * File Name          : Channel_1.js
 * Description        : This file provides code for channels record
 * Project Number     : ESD-iDAS
 * Author             : Team ESD-iDAS
 * Modified BY        : Abhishek Zagare
 * Modification Date  : 20/12/2023
 * Project Details    : This Application serves MODBUS communicaton for data acquisition and monitoring via com port.
 *************************************************************************************************************/
const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')
const CryptoJS = require('crypto-js')

/************************************************************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  let ch1_value, ch2_value, ch3_value, ch4_value, ch5_value, ch6_value, ch7_value, ch8_value;
  let ch_lsl = 0;
  let ch_usl = 0;
  const timeLabels = [];
  const ch_values = [];
  const lslValues = [];
  const uslValues = [];
  var c1d,c2d,c3d,c4d,c5d,c6d,c7d,c8d;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  let selectedDate = null;
  let selectedChannel = null;
  let csvFileName = null;
  let selectedColor1;
  let selectedColor2;
  let selectedColor3;
  let selectedColor4;
  let selectedColor5;
  let selectedColor6;
  let selectedColor7;
  let selectedColor8;

  const retrievecolor1 = localStorage.getItem('selectedcolors1'); 
  const retrievecolor2 = localStorage.getItem('selectedcolors2');
  const retrievecolor3 = localStorage.getItem('selectedcolors3');
  const retrievecolor4 = localStorage.getItem('selectedcolors4');
  const retrievecolor5 = localStorage.getItem('selectedcolors5');
  const retrievecolor6 = localStorage.getItem('selectedcolors6');
  const retrievecolor7 = localStorage.getItem('selectedcolors7');
  const retrievecolor8 = localStorage.getItem('selectedcolors8');

  selectedColor1 = retrievecolor1;
  selectedColor2 = retrievecolor2;
  selectedColor3 = retrievecolor3;
  selectedColor4 = retrievecolor4;
  selectedColor5 = retrievecolor5;
  selectedColor6 = retrievecolor6;
  selectedColor7 = retrievecolor7;
  selectedColor8 = retrievecolor8;

  const ch_disc_FileName = 'Channel_Description.csv';

  const datafor = document.getElementById('datafor');
  ipcRenderer.send('req', 'Hello Channel');

  ipcRenderer.on('reply', (event, datedata, cnum) => {

    selectedDate = datedata;
    console.log('selectedDate', selectedDate);
    selectedChannel = cnum;
    csvFileName = generateFileName(selectedDate);

    let DataPath = '';
    ipcRenderer.send('GetAppPath');

    ipcRenderer.once('dataPath', (event, datapah) => {
      DataPath = datapah;

      const csvFilePath = path.join(DataPath, csvFileName);
      const cdFilePath =  path.join(DataPath, ch_disc_FileName);

      fs.readFile(cdFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading CSV file:', err);
          callback(err, null);
          return;
        }
        const Additional_Data = data.split(',');
         c1d = Additional_Data[0];
         c2d = Additional_Data[1];
         c3d = Additional_Data[2];
         c4d = Additional_Data[3];
         c5d = Additional_Data[4];
         c6d = Additional_Data[5];
         c7d = Additional_Data[6];
         c8d = Additional_Data[7];
      });


      fs.readFile(csvFilePath, 'base64', (err, data) => {
        if (err) {
          console.error('Error reading CSV file:', err);
          return;
        }
        const decryptedContent = decrypt(data);
        const rows = decryptedContent.split('\n');
        const decryptedRows = decryptLines(rows);

        for (let i = 1; i < decryptedRows.length; i++) {
          const cols = decryptedRows[i].split(',');
          const date__ = cols[0];
          const stringWithoutQuotes = date__.replace(/"/g, '');
          const parts = stringWithoutQuotes.split('/');
          const firstValue = parts[0];
          const secondValue = parts[1];
          const formattedString = `${firstValue}-${secondValue}-${currentYear}`;
          const date_ = formattedString;
          const time = `${cols[1]}`;
          const time_ = cols[1];

          ch1_value = cols[2];
          ch2_value = cols[3];
          ch3_value = cols[4];
          ch4_value = cols[5];
          ch5_value = cols[6];
          ch6_value = cols[7];
          ch7_value = cols[8];
          ch8_value = cols[9];

          if(ch1_value >= 'OPEN'){
            ch1_value = 0;
          }
          if(ch2_value >= 'OPEN'){
            ch2_value = 0;
          }
          if(ch3_value >= 'OPEN'){
            ch3_value = 0;
          }
          if(ch4_value >= 'OPEN'){
            ch4_value = 0;
          }
          if(ch5_value >= 'OPEN'){
            ch5_value = 0;
          }
          if(ch6_value >= 'OPEN'){
            ch6_value = 0;
          }
          if(ch7_value >= 'OPEN'){
            ch7_value = 0;
          }
          if(ch8_value >= 'OPEN'){
            ch8_value = 0;
          }

          ch_lsl = parseInt(cols[10]);
          ch_usl = parseInt(cols[11]);

          timeLabels.push(time_);
          ch_values.push([ch1_value, ch2_value, ch3_value, ch4_value, ch5_value, ch6_value, ch7_value, ch8_value]);
          // lslValues.push(ch_lsl);
          // uslValues.push(ch_usl);

          // if (timeLabels.length > 200) {
          //   timeLabels.shift();
          //   ch_values.shift();
          //   // lslValues.shift();
          //   // uslValues.shift();
          // }
        }

        const ctx = document.getElementById('lineChart').getContext('2d');

        if (window.myLineChart) {
          // Update existing chart
          window.myLineChart.data.labels = timeLabels;
          for (let i = 0; i < 8; i++) {
            window.myLineChart.data.datasets[i].data = ch_values.map((value) => value[i + 1]);
          }
          window.myLineChart.update();
        } else {
          // Create a new chart with zoom and drag functionality
          window.myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: timeLabels,
              datasets: [
                {
                  label: c3d, // Label for Channel 1
                  data: ch_values.map((value) => value[0]), // Channel 1 data
                  borderColor: selectedColor1,
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c1d, // Label for Channel 5
                  data: ch_values.map((value) => value[2]), // Channel 5 data
                  borderColor: selectedColor5,
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
                  type: 'linear',
                  position: 'bottom',
                  beginAtZero: true,
                  pan: {
                    enabled: true,
                    mode: 'x',
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: 'x',
                  },
                },
                y: {
                  beginAtZero: true,
                  pan: {
                    enabled: true,
                    mode: 'y',
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: 'y',
                  },
                },
              },
            },
          });
        }
      });
    });
  });
});

/************************************************************************************************************/

function generateFileName (selectedDate) {
  const [year, month, day] = selectedDate.split('-')
  return `${year}_${month}_${day}.csv`
}

/************************************************************************************************************/
function decryptLines (lines) {
  return lines.map(line => decrypt(line))
}
/************************************************************************************************************/
function decrypt (data) {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8)
}

/********************************************************************************************************/


function updatePointColor(chart, color, channel) {
  // Get the dataset index for the specified channel
  const datasetIndex = channel - 1;

  // Update the point color in the chart for the specified channel
  chart.data.datasets[datasetIndex].borderColor = color;
  chart.update();
}
/********************************************************************************************************/

/********************************************************************************************************/
// function loadColorData() {
//   const retrievedDate = localStorage.getItem('selectedcolors')
//   const selectedDateInput = document.getElementById('selectDate')
//   selectedDateInput.value = retrievedDate
// }
/*************************************END OF FILE *******************************************************/
/*********************************************************************************************************
 This is sole licence property of Electronics Systems and Devices incase of any copy or
 reproduce will ask to autority.
************************************************************************************************************/
