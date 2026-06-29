import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useReducer,
  type ReactNode,
} from "react";

export type Route = { name: string; params?: Record<string, any> };

interface NavValue {
  route: Route;
  depth: number;
  go: (r: Route) => void;
  back: () => void;
}

const NavContext = createContext<NavValue | undefined>(undefined);

export const useNav = () => {
  const c = useContext(NavContext);
  if (!c) throw new Error("useNav must be used within NavProvider");
  return c;
};

const ROOT: Route = { name: "home" };

/**
 * Routeur basé sur l'historique du navigateur.
 * Chaque navigation empile une entrée : le bouton retour du système
 * (Android / PWA) déclenche `popstate` et revient à l'écran précédent.
 * À la racine, un nouveau "retour" ferme l'application.
 */
export function NavProvider({
  initial = ROOT,
  children,
}: {
  initial?: Route;
  children: ReactNode;
}) {
  const [, force] = useReducer((x) => x + 1, 0);
  const routeRef = useRef<Route>(initial);
  const depthRef = useRef(0);

  useEffect(() => {
    window.history.replaceState({ d: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      const d = (e.state?.d as number) ?? 0;
      routeRef.current = (e.state?.route as Route) ?? ROOT;
      depthRef.current = d;
      force();
      requestAnimationFrame(() => {
        document.getElementById("adf-scroll")?.scrollTo({ top: 0 });
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((r: Route) => {
    const nd = depthRef.current + 1;
    window.history.pushState({ d: nd, route: r }, "");
    routeRef.current = r;
    depthRef.current = nd;
    force();
    requestAnimationFrame(() => {
      document.getElementById("adf-scroll")?.scrollTo({ top: 0 });
    });
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const value: NavValue = {
    route: routeRef.current,
    depth: depthRef.current,
    go,
    back,
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
