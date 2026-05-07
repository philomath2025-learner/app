import { StorageProvider } from "./interface";
import { LocalStorageProvider } from "./local";
import { CloudStorageProvider } from "./cloud";

let activeProvider: StorageProvider | null = null;

export function getStorageProvider(mode: "guest" | "cloud"): StorageProvider {
  if (activeProvider) return activeProvider;

  if (mode === "guest") {
    activeProvider = new LocalStorageProvider();
  } else {
    activeProvider = new CloudStorageProvider();
  }
  
  return activeProvider;
}

export function resetStorageProvider() {
  activeProvider = null;
}
