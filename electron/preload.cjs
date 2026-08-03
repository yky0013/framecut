const { contextBridge, ipcRenderer, webUtils } = require('electron')

function eventSubscription(channel, callback) {
  const listener = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('framecut', {
  getFilePath: (file) => webUtils.getPathForFile(file),
  exportVideo: (options) => ipcRenderer.invoke('export-video', options),
  cancelExport: () => ipcRenderer.invoke('cancel-export'),
  saveSubtitleFile: (options) => ipcRenderer.invoke('save-subtitle-file', options),
  transcribeVideo: (options) => ipcRenderer.invoke('transcribe-video', options),
  cancelTranscription: () => ipcRenderer.invoke('cancel-transcription'),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  onExportProgress: (callback) => eventSubscription('export-progress', callback),
  onTranscriptionProgress: (callback) => eventSubscription('transcription-progress', callback),
})
