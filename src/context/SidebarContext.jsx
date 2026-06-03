import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext()

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true)
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle: () => setOpen(o => !o) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)