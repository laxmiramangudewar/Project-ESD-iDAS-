
// const { contextBridge } = require('electron')
// const SerialPort = require('serialport');
// const fs = require('fs');

// contextBridge.exposeInMainWorld('api','SerialPort','fs', {
//   readFile: (path) => fs.promises.readFile(path, 'utf8'),
//   openPort,
//   node: () => process.versions.node,
//   chrome: () => process.versions.chrome,
//   electron: () => process.versions.electron
// });

// let port;

// // Open the serial port
// function openPort(portName, baudRate) {
//   port = new SerialPort(portName, { baudRate });
// }

// // Close the serial port
// function closePort() {
//   if (port) {
//     port.close();
//   }
// }

// // Send data to the serial port
// function sendData(data) {
//   if (port) {
//     port.write(data);
//   }
// }

// // Expose functions to renderer process
// contextBridge.exposeInMainWorld('serialPort', {
//   openPort,
//   closePort,
//   sendData,
// });

// // Handle communication from the renderer process
// ipcRenderer.on('set-port-config', (event, portName, baudRate) => {
//   openPort(portName, baudRate);
// });

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})