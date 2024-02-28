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
  let GraphDataArray = [];
  var c1d,c2d,c3d,c4d,c5d,c6d,c7d,c8d;

  const currentDate1 = new Date()
  const hour = currentDate1.getHours();
  const min = currentDate1.getMinutes();

  const ch_disc_FileName = 'Channel_Description.csv';

    let DataPath = '';
    ipcRenderer.send('GetAppPath');

    ipcRenderer.once('dataPath', (event, datapah) => {
      DataPath = datapah;

      const cdFilePath =  path.join(DataPath, ch_disc_FileName);

      fs.readFile(cdFilePath, 'utf8', (err, csvdata) => {
        if (err) {
          console.error('Error reading CSV file:', err);
          callback(err, null);
          return;
        }
        const Additional_Data = csvdata.split(',');
         c1d = Additional_Data[0];
         c2d = Additional_Data[1];
         c3d = Additional_Data[2];
         c4d = Additional_Data[3];
         c5d = Additional_Data[4];
         c6d = Additional_Data[5];
         c7d = Additional_Data[6];
         c8d = Additional_Data[7];
      });
       
      ipcRenderer.on('data-to-graph', (event, grdata) => {
        GraphDataArray = grdata;
        console.log('GraphDataArray',GraphDataArray);
          ch1_value = GraphDataArray[0];
          ch2_value = GraphDataArray[1];
          ch3_value = GraphDataArray[2];
          ch4_value = GraphDataArray[3];
          ch5_value = GraphDataArray[4];
          ch6_value = GraphDataArray[5];
          ch7_value = GraphDataArray[6];
          ch8_value = GraphDataArray[7];

          timeLabels.push(hour);
          ch_values.push([ch1_value, ch2_value, ch3_value, ch4_value, ch5_value, ch6_value, ch7_value, ch8_value]);
         
          if (timeLabels.length > 200) {
            timeLabels.shift();
            ch_values.shift();
          }
        })
      })

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
                  label: c1d,
                  data: ch_values.map((value) => value[0]),
                  borderColor: 'green',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c2d,
                  data: ch_values.map((value) => value[1]),
                  borderColor: 'orange',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c3d,
                  data: ch_values.map((value) => value[2]),
                  borderColor: 'yellow',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c4d,
                  data: ch_values.map((value) => value[3]),
                  borderColor: 'purple',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c5d,
                  data: ch_values.map((value) => value[4]),
                  borderColor: 'brown',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c6d,
                  data: ch_values.map((value) => value[5]),
                  borderColor: 'pink',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c7d,
                  data: ch_values.map((value) => value[6]),
                  borderColor: 'indigo',
                  fill: false,
                  pointRadius: 2,
                },
                {
                  label: c8d,
                  data: ch_values.map((value) => value[7]),
                  borderColor: 'lime',
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


/************************************************************************************************************/



/************************************************************************************************************/
function decryptLines (lines) {
  return lines.map(line => decrypt(line))
}
/************************************************************************************************************/
function decrypt (data) {
  return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8)
}

/********************************************************************************************************/
/********************************************************************************************************/
/*************************************END OF FILE *******************************************************/
/*********************************************************************************************************
 This is sole licence property of Electronics Systems and Devices incase of any copy or
 reproduce will ask to autority.
************************************************************************************************************/
