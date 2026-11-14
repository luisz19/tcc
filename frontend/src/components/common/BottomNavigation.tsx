import { BriefcaseBusiness, House, UsersRound, WalletCards } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Início", path: "/home", icon: House },
  { label: "Projetos", path: "/projects", icon: BriefcaseBusiness },
  { label: "Clientes", path: "/clients", icon: UsersRound },
  { label: "Financeiro", path: "/finance", icon: WalletCards },
];

function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md sm:bottom-6 sm:max-w-lg"
      aria-label="Navegação principal"
    >
      <div className="flex h-16 items-center justify-around rounded-2xl border border-surface-container bg-surface-container-lowest/90 px-1.5 shadow-level-2 backdrop-blur-md sm:rounded-3xl sm:px-3">
        {navigationItems.map(({ label, path, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path === "/home" &&
              (location.pathname === "/" || location.pathname === "/dashboard"));

          return (
            <NavLink
              key={path}
              to={path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl",
                isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-12 sm:w-14 items-center justify-center rounded-full transition-all duration-200",
                  isActive
                    ? "bg-primary-fixed text-primary scale-105"
                    : "text-on-surface-variant group-hover:bg-surface-container/60 group-active:scale-95"
                )}
              >
                <Icon className="size-[18px] stroke-[2.2]" aria-hidden="true" />
              </div>
              <span
                className={cn(
                  "mt-0.5 text-[10px] tracking-tight transition-colors leading-tight",
                  isActive
                    ? "font-bold text-on-surface"
                    : "font-medium text-on-surface-variant"
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
