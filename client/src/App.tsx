import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GameSetup from "./pages/GameSetup";
import GameBoard from "./pages/GameBoard";
import ComingSoon from "./pages/ComingSoon";
import Encyclopedia from "./pages/Encyclopedia";
import MyGarage from "./pages/MyGarage";
import SetupGarage from "./pages/SetupGarage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/game/setup"} component={GameSetup} />
      <Route path={"/game/play"} component={GameBoard} />
      <Route path={"/coming-soon"} component={ComingSoon} />
      <Route path={"/encyclopedia"} component={Encyclopedia} />
      <Route path={"/my-garage"} component={MyGarage} />
      <Route path={"/setup-garage"} component={SetupGarage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
