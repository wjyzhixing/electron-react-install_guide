/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.on('set-title', (event, title) => {
  const webContents = event.sender;
  const win: any = BrowserWindow.fromWebContents(webContents);
  win.setTitle(title);
});

ipcMain.on('open-directory-dialog', (event) => {
  const webContents = event.sender;
  const win: any = BrowserWindow.fromWebContents(webContents);
  const result = dialog.showOpenDialogSync(win, {
    properties: ['openDirectory'],
  });
  console.log(result);

  if (result && result.length > 0) {
    // 发送所选目录路径回渲染进程
    console.log('woc');
    event.reply('selected-directory', result[0]);
  }
});

ipcMain.on('close-window', (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

ipcMain.on('encrypt', async (event, postData) => {
  try {
    const response = await fetch(
      'http://localhost:3001/api/v1/cipher/external/asym/auth/encrypt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      },
    );
    const data = await response.json();
    console.log(data, 'datadata');
    // 将响应发送回渲染进程
    event.sender.send('encrypt-response', data);
  } catch (error) {
    console.error(error, 'error');
  }
});

ipcMain.on('encrypt2', async (event, postData) => {
  try {
    const response = await fetch(
      'http://localhost:3001/api/v1/cipher/external/asym/auth/encrypt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      },
    );
    const data = await response.json();
    console.log(data, 'datadata');
    // 将响应发送回渲染进程
    event.sender.send('encrypt-response2', data);
  } catch (error) {
    console.error(error, 'error');
  }
});

ipcMain.on('encrypt3', async (event, postData) => {
  try {
    const response = await fetch(
      'http://localhost:3001/api/v1/cipher/external/asym/auth/encrypt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      },
    );
    const data = await response.json();
    console.log(data, 'datadata');
    // 将响应发送回渲染进程
    event.sender.send('encrypt-response3', data);
  } catch (error) {
    console.error(error, 'error');
  }
});

ipcMain.on('encrypt4', async (event, postData) => {
  try {
    const response = await fetch(
      'http://localhost:3001/api/v1/cipher/external/asym/auth/encrypt',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      },
    );
    const data = await response.json();
    console.log(data, 'datadata');
    // 将响应发送回渲染进程
    event.sender.send('encrypt-response4', data);
  } catch (error) {
    console.error(error, 'error');
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
