import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import SplashScreen from '../components/layout/SplashScreen';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { SupportChatWidget } from '../components/support/SupportChatWidget';
import Logo from '../public/Logoibpulse.webp';
import { projectService } from '../services/projectService';
import { Project } from '../types';
export function RootLayout() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    try {
      // 1. Create Project
      const data = await projectService.create(projectData);

      // 2. Upload Files
      if (files.length > 0) {
        const { storageService } = await import('../services/storageService');
        const attachments = [];

        for (const file of files) {
          try {
            const { url } = await storageService.uploadFile(file, data.id);
            attachments.push({
              name: file.name,
              url,
              size: file.size,
              type: file.type
            });
          } catch (err) {
            console.error('Failed to upload file:', file.name, err);
          }
        }

        // 3. Update Project with Attachments
        if (attachments.length > 0) {
          await projectService.update(data.id, { attachments });
        }
      }

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
      <SupportChatWidget />
    </div>
  );
}
