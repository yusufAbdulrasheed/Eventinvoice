import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="glass-panel sticky top-0 z-30 flex items-center justify-between h-16 px-margin-mobile md:px-margin-desktop">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden text-on-surface-variant p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors"
          onClick={onMenuClick}
          aria-label="Open menu"
          type="button"
        >
          <Icon name="menu" size={22} />
        </button>
        <h1 className="font-title-lg text-title-lg text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="hidden sm:flex text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Search" type="button">
          <Icon name="search" size={20} />
        </button>
        <button className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Notifications" type="button">
          <Icon name="notifications" size={20} />
        </button>
        <ThemeToggle />
        <div className="h-8 w-px bg-outline-variant mx-2 hidden md:block" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-title-lg font-bold" title={user?.name}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline font-body-md font-semibold text-primary">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
