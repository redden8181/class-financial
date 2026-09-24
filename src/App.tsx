import { AnimatePresence, motion } from "framer-motion";
import { NavProvider, routeKey, useNav } from "./app/nav";
import { StoreProvider } from "./app/store";
import { ThemeProvider } from "./app/theme";
import { BottomNav } from "./components/BottomNav";
import { CollectionDetailScreen } from "./screens/CollectionDetailScreen";
import { CollectionsScreen } from "./screens/CollectionsScreen";
import { DebtsScreen } from "./screens/DebtsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { KidDetailScreen } from "./screens/KidDetailScreen";
import { KidsScreen } from "./screens/KidsScreen";

function Shell() {
  const { tab, stack } = useNav();
  const top = stack[stack.length - 1];

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-app-bg">
      {/* Вкладки */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          {tab === "home" && <HomeScreen />}
          {tab === "kids" && <KidsScreen />}
          {tab === "collections" && <CollectionsScreen />}
          {tab === "debts" && <DebtsScreen />}
        </motion.div>
      </AnimatePresence>

      {/* Нижняя навигация — только на корневых экранах */}
      {stack.length === 0 && <BottomNav />}

      {/* Открытые поверх экраны */}
      <AnimatePresence>
        {top && (
          <motion.div
            key={routeKey(top)}
            className="fixed inset-0 z-40 mx-auto flex h-dvh w-full max-w-md flex-col overflow-y-auto overscroll-contain bg-app-bg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            {top.name === "child" ? (
              <KidDetailScreen childId={top.childId} />
            ) : (
              <CollectionDetailScreen collectionId={top.collectionId} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <NavProvider>
          <Shell />
        </NavProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
