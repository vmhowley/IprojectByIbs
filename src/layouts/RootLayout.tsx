import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CommandPalette } from '../components/layout/CommandPalette';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { SupportChatWidget } from '../components/support/SupportChatWidget';
import { createProjectWithFiles } from '../services/projectCreation';
import { Project } from '../types';

export function RootLayout() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    const data = await createProjectWithFiles(projectData, files);
    navigate(`/project/${data.id}`);
  };

  // Ctrl+K (Cmd+K on Mac) opens the search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Every navigation starts at the top of the page and closes the drawer.
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="flex h-dvh overflow-hidden bg-desk">
      <a
        href="#main"
        className="sr-only z-[90] rounded-control bg-paper px-3 py-2 text-sm font-semibold text-ink shadow-lift focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>

      <Sidebar
        onNewProject={() => setIsNewProjectModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Navbar onOpenMenu={() => setIsSidebarOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
        {/* relative: screen-reader-only captions scroll inside #main instead of stretching the page. */}
        <main id="main" tabIndex={-1} className="relative flex-1 overflow-y-auto outline-none">
          <Outlet />
        </main>
      </div>

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
      <CommandPalette open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <SupportChatWidget />
    </div>
  );
}
