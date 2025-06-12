import type React from "react"
import { useThemeParams } from "@tma.js/sdk-react"

interface ThemeWrapperProps {
  children: React.ReactNode
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const themeParams = useThemeParams()

  return (
    <div
      style={{
        color: themeParams?.textColor || "#000000",
        backgroundColor: themeParams?.backgroundColor || "#ffffff",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  )
}

export default ThemeWrapper
