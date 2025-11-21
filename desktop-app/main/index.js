/**
 * Electron Main Process
 * Entry point for the desktop application
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { CliBridge } from './cli-bridge.js';
import { McpClient } from './mcp-client.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let cliBridge;
let mcpClient;
let watcher;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js')
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1e1e1e'
    });

    // Development mode: load from Vite dev server
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Production: load built files
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    const { globalShortcut } = require('electron');

    // Register shortcuts
    globalShortcut.register('CommandOrControl+O', () => {
        mainWindow.webContents.send('shortcut:open-project');
    });

    globalShortcut.register('CommandOrControl+R', () => {
        mainWindow.webContents.send('shortcut:refresh');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function setupIpcHandlers() {
    // Initialize bridges
    cliBridge = new CliBridge();
    mcpClient = new McpClient();

    // CLI handlers
    ipcMain.handle('cli:analyze', async (event, projectPath, options) => {
        return await cliBridge.analyze(projectPath, options);
    });

    ipcMain.handle('cli:generateContext', async (event, projectPath, options) => {
        return await cliBridge.generateContext(projectPath, options);
    });

    ipcMain.handle('cli:listFormats', async () => {
        return await cliBridge.listFormats();
    });

    ipcMain.handle('cli:getVersion', async () => {
        return await cliBridge.getVersion();
    });

    // MCP handlers
    ipcMain.handle('mcp:connect', async (event, options) => {
        await mcpClient.connect(options);
        return { success: true };
    });

    ipcMain.handle('mcp:disconnect', async () => {
        await mcpClient.disconnect();
        return { success: true };
    });

    ipcMain.handle('mcp:listTools', async () => {
        return await mcpClient.listTools();
    });

    ipcMain.handle('mcp:callTool', async (event, name, args) => {
        return await mcpClient.callTool(name, args);
    });

    ipcMain.handle('mcp:listResources', async (event, cursor) => {
        return await mcpClient.listResources(cursor);
    });

    ipcMain.handle('mcp:readResource', async (event, uri) => {
        return await mcpClient.readResource(uri);
    });

    ipcMain.handle('mcp:listPrompts', async () => {
        return await mcpClient.listPrompts();
    });

    ipcMain.handle('mcp:getPrompt', async (event, name, args) => {
        return await mcpClient.getPrompt(name, args);
    });

    // File system handlers
    ipcMain.handle('fs:selectDirectory', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result.canceled ? null : result.filePaths[0];
    });

    ipcMain.handle('fs:readFile', async (event, filePath) => {
        return fs.readFileSync(filePath, 'utf-8');
    });

    ipcMain.handle('fs:saveFile', async (event, content, defaultPath) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultPath
        });

        if (!result.canceled && result.filePath) {
            fs.writeFileSync(result.filePath, content);
            return { success: true, filePath: result.filePath };
        }
        return { success: false };
    });

    // Watcher handler
    ipcMain.handle('watcher:start', (event, projectPath) => {
        if (watcher) {
            watcher.close();
        }

        // Simple watcher using fs.watch for now to avoid extra dependencies if possible,
        // but chokidar is better. Let's assume we can use the project's chokidar if available,
        // or just fs.watch. Given the project has chokidar, let's try to import it dynamically or use fs.watch.
        // For simplicity and reliability in this context without adding deps to desktop-app/package.json yet:
        try {
            const chokidar = require('chokidar');
            watcher = chokidar.watch(projectPath, {
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                persistent: true,
                ignoreInitial: true
            });

            watcher.on('all', (event, path) => {
                mainWindow.webContents.send('project:files-changed', { event, path });
            });
        } catch (e) {
            // Fallback to fs.watch if chokidar not found (though it should be in root node_modules)
            watcher = fs.watch(projectPath, { recursive: true }, (eventType, filename) => {
                mainWindow.webContents.send('project:files-changed', { event: eventType, path: filename });
            });
        }
        return { success: true };
    });

    ipcMain.handle('watcher:stop', () => {
        if (watcher) {
            watcher.close();
            watcher = null;
        }
        return { success: true };
    });

    // App handlers
    ipcMain.handle('app:getVersion', () => {
        return app.getVersion();
    });

    ipcMain.on('app:quit', () => {
        app.quit();
    });
}

// App lifecycle
app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup on quit
app.on('before-quit', async () => {
    if (mcpClient) {
        await mcpClient.disconnect();
    }
});

// Export for testing
export { createWindow };
