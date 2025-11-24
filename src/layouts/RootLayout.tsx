import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { projectService } from '../services/projectService';

export function RootLayout() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreateProject = async (projectData: { name: string; description: string }) => {
    try {
      const data = await projectService.create(projectData);
      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar onNewProject={() => setIsNewProjectModalOpen(true)} />
      <Outlet />

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
