import { Outlet, useLocation } from "react-router-dom"
import AIChatPopup from "./AIChatPopup";

function Layout() {
  const location = useLocation();

  // Hide AI chat on these pages
  const hideAIChat = ['/pets', '/success-stories'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideAIChat && <AIChatPopup />}
    </div>
  )
}

export default Layout