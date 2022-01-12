import React, { createContext, useContext, useState, useEffect } from "react";
import { InitModal } from "../components/modals/InitModal"

// App init context
interface InitModal {
  showInitModal: boolean,
  setShowInitModal: (showInitModal: boolean) => void
};

const InitModalContext = createContext<InitModal>({
  showInitModal: false,
  setShowInitModal: () => {}
});

// App init context provider
export function InitModalProvider(props: { children: any }) {
  const [showInitModal, setShowInitModal] = useState(localStorage.getItem('showInitModal') === 'false');
  useEffect(() => {
    localStorage.setItem('showInitModal', JSON.stringify(showInitModal));
  }, [showInitModal]);
  
  return (
    <InitModalContext.Provider value={{ 
      showInitModal, 
      setShowInitModal
    }}>
      <InitModal
        showModal={showInitModal}
        cancelInitModal={() => setShowInitModal(false)}
      />
      {props.children}
    </InitModalContext.Provider>
  );
};

// User has clicked init modal
export const useInitModal = () => {
  const { showInitModal, setShowInitModal } = useContext(InitModalContext);
  return {
    showInitModal,
    setShowInitModal: () => setShowInitModal(false)
  };
};