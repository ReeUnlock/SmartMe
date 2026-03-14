import { create } from "zustand";
import { getUserStorage, setUserStorage } from "../utils/storage";

const STORAGE_KEY = "smartme_intro_tour";

function loadSeen() {
  try {
    return getUserStorage(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

const useIntroTour = create((set) => ({
  hasSeenTour: loadSeen(),
  isTourOpen: false,

  openTour: () => set({ isTourOpen: true }),

  closeTour: () => set({ isTourOpen: false }),

  markAsSeen: () => {
    setUserStorage(STORAGE_KEY, "true");
    set({ hasSeenTour: true, isTourOpen: false });
  },
}));

export default useIntroTour;
