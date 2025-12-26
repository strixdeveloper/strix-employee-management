"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  GripVertical,
  Calendar,
  Users,
  FileText,
  Image as ImageIcon,
  X,
  ArrowLeft,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Task {
  rowid: number;
  id?: string; // For backward compatibility with drag-and-drop
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  assignee_id?: string;
  assignee?: string; // For display (from join)
  due_date?: string;
  dueDate?: string; // For backward compatibility
  order_index?: number;
  created_by?: string;
  assignee?: {
    name: string;
    employee_id: string;
  };
}

interface Project {
  rowid: number;
  project_name: string;
  project_description?: string;
  client_name?: string;
  priority: string;
  status: string;
  deadline?: string;
  media_files?: string[];
  assigned_employees?: Array<{
    name: string;
    employee_id: string;
  }>;
}

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-100 dark:bg-gray-800" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "review", title: "Review", color: "bg-yellow-100 dark:bg-yellow-900" },
  { id: "done", title: "Done", color: "bg-green-100 dark:bg-green-900" },
];

function TaskCard({ 
  task, 
  onClick 
}: { 
  task: Task; 
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 cursor-pointer transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg hover:shadow-pink-500/10 dark:hover:shadow-pink-500/20 bg-white dark:bg-gray-900"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing hover:text-pink-600 dark:hover:text-pink-400 transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
              <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-tight">
                {task.title}
              </h4>
              {task.priority && (
                <Badge
                  className={`${getPriorityColor(task.priority)} text-white text-xs px-1.5 sm:px-2 py-0.5 font-medium shrink-0`}
                >
                  {task.priority}
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-500">
              {task.dueDate && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="font-medium text-xs">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="truncate max-w-[80px] sm:max-w-[100px] font-medium text-xs">{task.assignee}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableColumn({ 
  column, 
  tasks,
  onTaskClick
}: { 
  column: typeof columns[0]; 
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const columnTasks = tasks.filter((t) => t.status === column.id);

  return (
    <div className="flex-1 min-w-[260px] sm:min-w-[300px] shrink-0" ref={setNodeRef}>
      <Card className="h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className={`${column.color} pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6`}>
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between text-gray-900 dark:text-gray-100">
            <span className="uppercase tracking-wide">{column.title}</span>
            <Badge variant="secondary" className="text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
              {columnTasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 min-h-[400px] sm:min-h-[500px] bg-gray-50/50 dark:bg-gray-800/50">
          <SortableContext
            items={columnTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {columnTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick(task)}
              />
            ))}
            {columnTasks.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-muted-foreground text-xs sm:text-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <GripVertical className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                  <p className="font-medium">No tasks</p>
                  <p className="text-xs hidden sm:block">Drag tasks here or add new ones</p>
                </div>
              </div>
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectBoardContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params?.id === 'string' ? params.id : String(params?.id);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    assignee: "",
    dueDate: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProject();
    fetchTasks();
    
    // Real-time sync: Poll every 2 seconds
    const interval = setInterval(() => {
      fetchTasks();
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project?rowid=${projectId}`);
      if (response.ok) {
        const result = await response.json();
        setProject(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?project_id=${projectId}`);
      if (response.ok) {
        const result = await response.json();
        // Transform database tasks to component format
        const transformedTasks = (result.data || []).map((task: any) => ({
          ...task,
          id: `task-${task.rowid}`, // For drag-and-drop compatibility
          assignee: task.assignee_id || task.assignee?.employee_id,
          dueDate: task.due_date,
        }));
        setTasks(transformedTasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id as string;
    const isColumn = columns.some((c) => c.id === overId);

    let newStatus: Task["status"];
    if (isColumn) {
      newStatus = overId as Task["status"];
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask || activeTask.status === overTask.status) return;
      newStatus = overTask.status;
    }

    // Update task status in database
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: activeTask.rowid,
          status: newStatus,
        }),
      });
      // Fetch updated tasks (real-time sync will also handle this)
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleUpdateTaskStatus = async (newStatus: Task["status"]) => {
    if (!selectedTask) return;
    
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowid: selectedTask.rowid,
          status: newStatus,
        }),
      });
      setSelectedTask({ ...selectedTask, status: newStatus });
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status,
          priority: newTask.priority,
          assignee_id: newTask.assignee || null,
          due_date: newTask.dueDate || null,
        }),
      });

      if (response.ok) {
        setNewTask({
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          assignee: "",
          dueDate: "",
        });
        setIsAddTaskOpen(false);
        fetchTasks(); // Refresh tasks
      } else {
        const error = await response.json();
        console.error("Failed to add task:", error);
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-500";
      case "in_progress":
        return "bg-blue-500";
      case "review":
        return "bg-yellow-500";
      case "done":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p>Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Project Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 sm:p-6 border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/protected/projects")}
                className="hover:bg-pink-50 dark:hover:bg-pink-900/20 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent truncate">
                  {project.project_name}
                </h1>
                {project.client_name && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Client: <span className="font-medium">{project.client_name}</span>
                  </p>
                )}
                {project.project_description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl line-clamp-2 sm:line-clamp-none">
                    {project.project_description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
                <Button
                  variant={viewMode === "board" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("board")}
                  className="h-8 px-2 sm:px-3"
                >
                  <LayoutGrid className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Board</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-2 sm:px-3"
                >
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                </Button>
              </div>
              <Button
                onClick={() => setIsAddTaskOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white shadow-lg shadow-pink-500/50 text-sm sm:text-base"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Media Files */}
        {project.media_files && project.media_files.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Files ({project.media_files.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {project.media_files.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg hover:bg-accent hover:border-pink-300 dark:hover:border-pink-700 transition-all group"
                  >
                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
                    <span className="text-xs text-center truncate w-full px-1">
                      {url.split("/").pop()}
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Board View */}
        {viewMode === "board" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-3 sm:mx-0 px-3 sm:px-0">
              {columns.map((column) => (
                <DroppableColumn 
                  key={column.id} 
                  column={column} 
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <Card className="w-56 sm:w-64 opacity-95 rotate-2 shadow-xl border-2 border-pink-500">
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{activeTask.title}</h4>
                    {activeTask.priority && (
                      <Badge
                        className={`${getPriorityColor(activeTask.priority)} text-white text-xs mt-2`}
                      >
                        {activeTask.priority}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No tasks yet. Click "Add Task" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-accent/50 cursor-pointer">
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.title}</div>
                              {task.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(task.status)} text-white`}
                            >
                              {columns.find((c) => c.id === task.status)?.title}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.priority && (
                              <Badge
                                className={`${getPriorityColor(task.priority)} text-white`}
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.assignee || (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.dueDate ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No date</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTaskClick(task)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks yet. Click "Add Task" to create one.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm flex-1">{task.title}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={`${getStatusColor(task.status)} text-white text-xs`}
                          >
                            {columns.find((c) => c.id === task.status)?.title}
                          </Badge>
                          {task.priority && (
                            <Badge
                              className={`${getPriorityColor(task.priority)} text-white text-xs`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{task.assignee}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Task Dialog */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Create a new task for this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Title *</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, status: value as Task["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value as Task["priority"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTask}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-600 hover:to-fuchsia-600"
              >
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Detail Dialog */}
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          {selectedTask && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedTask.title}</DialogTitle>
                <DialogDescription>Update task details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(value) => handleUpdateTaskStatus(value as Task["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={selectedTask.priority || "medium"}
                    onValueChange={async (value) => {
                      try {
                        await fetch("/api/tasks", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            rowid: selectedTask.rowid,
                            priority: value,
                          }),
                        });
                        setSelectedTask({ ...selectedTask, priority: value as Task["priority"] });
                        fetchTasks(); // Refresh tasks
                      } catch (error) {
                        console.error("Failed to update task priority:", error);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedTask.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <Label>Due Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!selectedTask) return;
                    if (!confirm("Are you sure you want to delete this task?")) return;
                    
                    try {
                      await fetch(`/api/tasks?rowid=${selectedTask.rowid}`, {
                        method: "DELETE",
                      });
                      setIsTaskDetailOpen(false);
                      setSelectedTask(null);
                      fetchTasks(); // Refresh tasks
                    } catch (error) {
                      console.error("Failed to delete task:", error);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
                <Button onClick={() => setIsTaskDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  );
}
