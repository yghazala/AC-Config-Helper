const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'INI Files', extensions: ['ini'] }]
  });
  
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('process-car-config', async (event, entryListPath, modifyCmContent, carCount, sortByAI) => {
  function processCarConfig(entryListPath, modifyCmContent, carCount, sortByAI) {
    const contentJsonPath = path.join(path.dirname(entryListPath), 'cm_content', 'content.json');

    if (!fs.existsSync(entryListPath)) {
      return { error: "there is no entry_list.ini here..." };
    }

    let entryListContent;
    try {
      entryListContent = fs.readFileSync(entryListPath, 'utf8');
    } catch (error) {
      return { error: `Error reading entry_list.ini: ${error.message}` };
    }

    const cars = entryListContent.split(/\[CAR_\d+\]/).filter(Boolean).map(car => {
      const lines = car.trim().split('\n');
      const carObj = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        carObj[key.trim()] = value.trim();
      });
      return carObj;
    });

    const processedCars = [];
    const seenModels = new Set();
    cars.forEach(car => {
      if (!seenModels.has(car.MODEL) || processedCars.filter(c => c.MODEL === car.MODEL).length < carCount) {
        processedCars.push(car);
        seenModels.add(car.MODEL);
      }
    });

    if (sortByAI) {
      processedCars.sort((a, b) => {
        if (a.AI === 'fixed' && b.AI !== 'fixed') return -1;
        if (a.AI !== 'fixed' && b.AI === 'fixed') return 1;
        return 0;
      });
    }

    const newContent = {
      cars: {},
      track: {
        url: "",
        version: ""
      }
    };

    processedCars.forEach(car => {
      if (!newContent.cars[car.MODEL]) {
        newContent.cars[car.MODEL] = { url: "" };
      }
    });

    let output = '';
    processedCars.forEach((car, index) => {
      output += `[CAR_${index}]\n`;
      Object.entries(car).forEach(([key, value]) => {
        output += `${key}=${value}\n`;
      });
      output += '\n';
    });

    if (modifyCmContent) {
      const cmContentDir = path.dirname(contentJsonPath);
      if (!fs.existsSync(cmContentDir)) {
        fs.mkdirSync(cmContentDir, { recursive: true });
      }

      try {
        fs.writeFileSync(contentJsonPath, JSON.stringify(newContent, null, 2));
        fs.writeFileSync(entryListPath, output);
        return { success: "entry_list.ini and content.json have been updated successfully." };
      } catch (error) {
        return { error: `Error writing files: ${error.message}` };
      }
    } else {
      try {
        fs.writeFileSync(entryListPath, output);
        return { success: "entry_list.ini has been updated successfully. cm_content not modified." };
      } catch (error) {
        return { error: `Error writing entry_list.ini: ${error.message}` };
      }
    }
  }

  return processCarConfig(entryListPath, modifyCmContent, carCount, sortByAI);
});

