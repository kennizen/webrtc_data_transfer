/// <reference types="vite/client" />

interface ShowOpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  startIn?: FileSystemDirectoryHandle;
  excludeAcceptAllOption?: boolean;
  id?: string;
}

interface FilePickerAcceptType {
  description: string;
  accept: {
    [mimeType: string]: string[];
  };
}

interface Window {
  showOpenFilePicker(
    options?: ShowOpenFilePickerOptions
  ): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(
    options?: SaveFilePickerOptions
  ): Promise<FileSystemFileHandle>;
}
