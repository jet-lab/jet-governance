import React, { createContext, useContext, useState, useEffect } from "react";
import { InitModal } from "../components/modals/InitModal"

// App init context
interface InitModal {
  hideInitModal: boolean,
  setHideInitModal: (hideInitModal: boolean) => void
};
const InitModalContext = createContext<InitModal>({
  hideInitModal: false,
  setHideInitModal: () => {}
});

// App init context provider
export function InitModalProvider(props: { children: any }) {
  const [hideInitModal, setHideInitModal] = useState(localStorage.getItem('hideInitModal') === 'true');
  useEffect(() => {    
    localStorage.setItem('hideInitModal', JSON.stringify(hideInitModal))
  }, [hideInitModal]);
  
  return (
    <InitModalContext.Provider value={{ 
      hideInitModal, 
      setHideInitModal
    }}>
      {/* <InitModal
        showModal={!hideInitModal}
        cancelInitModal={() => setHideInitModal(false)}
      /> */}
      {props.children}
    </InitModalContext.Provider>
  );
};