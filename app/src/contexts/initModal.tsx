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
    console.log("state", showInitModal);
    localStorage.setItem('showInitModal', JSON.stringify(showInitModal))
    console.log("localstorage", localStorage.getItem('showInitModal'));
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