import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createContext, useContext, useState, useEffect } from "react";

import NotFound from "@/pages/not-found";
import CalculatorPage from "@/pages/calculator";
import RecipesPage from "@/pages/recipes";
import MaterialsPage from "@/pages/materials";
import HistoryPage from "@/pages/history";
import { SideMenu } from "@/components/SideMenu";
import { initStorage } from "@/lib/storage";

const queryClient = new QueryClient();

export const MenuContext = createContext({ openMenu: () => {} });
export const useMenu = () => useContext(MenuContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={CalculatorPage} />
      <Route path="/recipes" component={RecipesPage} />
      <Route path="/materials" component={MaterialsPage} />
      <Route path="/history" component={HistoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    initStorage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <MenuContext.Provider value={{ openMenu: () => setIsMenuOpen(true) }}>
            <div className="min-h-[100dvh] w-full flex justify-center bg-gray-50 font-sans text-gray-900">
              <div className="w-full max-w-[440px] bg-white min-h-[100dvh] relative shadow-sm overflow-x-hidden flex flex-col">
                <Router />
                <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
              </div>
            </div>
          </MenuContext.Provider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
