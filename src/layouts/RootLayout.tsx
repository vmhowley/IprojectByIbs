import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import SplashScreen from '../components/layout/SplashScreen';
import { NewProjectModal } from '../components/project/NewProjectModal';
import Logo from '../public/Logoibpulse.webp';
import { projectService } from '../services/projectService';
export function RootLayout() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleCreateProject = async (projectData: { name: string; description: string }) => {
    try {
      const data = await projectService.create(projectData);
      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };
  useEffect(() => {
    const loadProjects = async () => {
      try {
        await projectService.getAll();
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading projects:', error);
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);
  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {isLoading ? (
        <SplashScreen />
      ) : (
        <>
          <Sidebar
            onNewProject={() => setIsNewProjectModalOpen(true)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Mobile Header with Menu button */}
            <div className="md:hidden border-b border-gray-200 p-4 flex items-center bg-white sticky top-0 z-30 flex-shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <Menu size={24} />
              </button>
              <span className="ml-2 font-semibold text-gray-900"><img className='w-30 h-8 object-cover object-center' src={Logo} alt="" /></span>
            </div>

            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
          </div>
        </>
      )}
      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
