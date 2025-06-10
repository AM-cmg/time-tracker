import { useState, useEffect } from 'react';
import { Clock, Play, Square, Trash, Download } from 'lucide-react';

export default function TimeTracker() {
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('timeTrackerProjects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  });
  
  const [newProject, setNewProject] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expanded, setExpanded] = useState(null);
  const [selectedTask, setSelectedTask] = useState('');
  const [notified, setNotified] = useState(false);

  // Predefined tasks
  const predefinedTasks = [
    "Réunion technique", 
    "Recherches d'informations techniques", 
    "Rédaction de documentation technique", 
    "Analyse ou mise en forme de données", 
    "Réalisation d'essais"
  ];

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timeTrackerProjects', JSON.stringify(projects));
  }, [projects]);

  // Update current time every second for the timer display
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());

    if (activeProject && startTime && !notified) {
      const elapsed = new Date() - startTime;
      // Alert after 1 hour
      if (elapsed > 2 * 60 * 60 * 1000) {
        if (Notification.permission === 'granted') {
          new Notification("⏰ Tâche en cours", {
            body: "Cette tâche a dépassé 2 heures.",
          });
          setNotified(true);
        }
      }
    }
  }, 1000);
  return () => clearInterval(timer);
}, [activeProject, startTime, notified]);

  // Ask for notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Add a new project
  const addProject = () => {
    if (!newProject.trim()) return;
    
    setProjects([
      ...projects,
      {
        id: Date.now().toString(),
        name: newProject,
        logs: [],
        totalTime: 0
      }
    ]);
    setNewProject('');
  };

  // Toggle timer for a project
  const toggleTimer = (projectId) => {
    if (activeProject === projectId) {
      // Stop the timer and log the time
      const now = new Date();
      const elapsedTime = now - startTime;

      setProjects(projects.map(project => {
        if (project.id === projectId) {
          const newLog = {
            id: Date.now().toString(),
            start: startTime,
            end: now,
            duration: elapsedTime,
            task: selectedTask || "Non spécifié"
          };
          
          return {
            ...project,
            logs: [...project.logs, newLog],
            totalTime: project.totalTime + elapsedTime
          };
        }
        return project;
      }));
      
      setActiveProject(null);
      setStartTime(null);
      setSelectedTask('');
      setNotified(false);
    } else {
      // Start the timer
      setActiveProject(projectId);
      setStartTime(new Date());
      setNotified(false);
    }
  };

  // Delete a project
  const deleteProject = (projectId) => {
    if (activeProject === projectId) {
      setActiveProject(null);
      setStartTime(null);
    }
    setProjects(projects.filter(project => project.id !== projectId));
  };

  // Delete a log entry
  const deleteLog = (projectId, logId) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const logToRemove = project.logs.find(log => log.id === logId);
        return {
          ...project,
          logs: project.logs.filter(log => log.id !== logId),
          totalTime: project.totalTime - (logToRemove ? logToRemove.duration : 0)
        };
      }
      return project;
    }));
  };

  // Format time in HH:MM:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  
  // Format date for CSV export
  const formatDateForExport = (date) => {
    return new Date(date).toISOString();
  };

  // Export data to CSV
  const exportToCSV = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add summary section
    csvContent += "SUMMARY\r\n";
    csvContent += "Project,Total Time (HH:MM:SS),Total Time (ms)\r\n";
    
    projects.forEach(project => {
      csvContent += `"${project.name}","${formatTime(project.totalTime)}",${project.totalTime}\r\n`;
    });
    
    // Add a separator
    csvContent += "\r\n\r\n";
    
    // Add detailed logs for each project
    projects.forEach(project => {
      csvContent += `PROJECT: ${project.name}\r\n`;
      csvContent += "Start Time,End Time,Duration (HH:MM:SS),Duration (ms),Task\r\n";
      
      project.logs.forEach(log => {
        csvContent += `"${formatDateForExport(log.start)}","${formatDateForExport(log.end)}","${formatTime(log.duration)}",${log.duration},"${log.task || 'Non spécifié'}"\r\n`;
      });
      
      // Add project total
      csvContent += `\r\nTotal,"","${formatTime(project.totalTime)}",${project.totalTime},""\r\n\r\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `project-time-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  // Calculate current elapsed time for active project
  const getCurrentElapsedTime = () => {
    if (!activeProject || !startTime) return 0;
    return currentTime - startTime;
  };

  // Toggle expanded view for a project
  const toggleExpanded = (projectId) => {
    setExpanded(expanded === projectId ? null : projectId);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-50 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-600">Project Time Tracker</h1>
        {projects.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>
      
      {/* Add new project form */}
      <div className="flex mb-6">
        <input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="New project name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && addProject()}
        />
        <button
          onClick={addProject}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add
        </button>
      </div>
      
      {/* Projects list */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <p className="text-center text-gray-500 italic">No projects yet. Add one to get started!</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <div className="flex items-center p-3 bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    Total: {formatTime(project.totalTime + (activeProject === project.id ? getCurrentElapsedTime() : 0))}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleTimer(project.id)}
                    className={`p-2 rounded-full ${activeProject === project.id ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} hover:opacity-80`}
                  >
                    {activeProject === project.id ? <Square size={18} /> : <Play size={18} />}
                  </button>
                  
                  <button 
                    onClick={() => toggleExpanded(project.id)}
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:opacity-80"
                  >
                    <Clock size={18} />
                  </button>
                  
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:opacity-80"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
              
              {/* Expanded view with logs */}
              {expanded === project.id && (
                <div className="border-t border-gray-200 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Time Logs:</h4>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Total: {formatTime(project.totalTime + (activeProject === project.id ? getCurrentElapsedTime() : 0))}
                    </div>
                  </div>
                  {project.logs.length === 0 ? (
                    <p className="text-sm text-gray-500">No logs yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {project.logs.map(log => (
                        <div key={log.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                          <div>
                            <p>{formatDate(log.start)}</p>
                            <p className="text-gray-500">Duration: {formatTime(log.duration)}</p>
                            {log.task && <p className="text-blue-600 text-xs mt-1">Task: {log.task}</p>}
                          </div>
                          <button
                            onClick={() => deleteLog(project.id, log.id)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Active timer display */}
      {activeProject && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg">
          <p className="font-bold">
            {projects.find(p => p.id === activeProject)?.name}
          </p>
          <p className="text-xl">
            {formatTime(getCurrentElapsedTime())}
          </p>
          <div className="mt-2">
            <select 
              value={selectedTask} 
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full p-1 text-sm text-gray-700 rounded"
            >
              <option value="">Sélectionner une tâche...</option>
              {predefinedTasks.map((task, index) => (
                <option key={index} value={task}>{task}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}