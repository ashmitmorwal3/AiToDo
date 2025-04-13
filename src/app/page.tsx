"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { suggestDeadline } from "@/ai/flows/suggest-deadline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  deadline?: Date | null;
}

function Home() {
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deadlineSuggestion, setDeadlineSuggestion] = useState<{ suggestedDeadline: string; reasoning: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: async (taskDescription: string) => {
      const result = await suggestDeadline({ taskDescription });
      return result;
    },
    onSuccess: (data) => {
      setDeadlineSuggestion({
        suggestedDeadline: data.suggestedDeadline,
        reasoning: data.reasoning,
      });
    },
    onError: () => {
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          "There was a problem suggesting a deadline. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = async () => {
    if (newTask.trim() === "") return;

    mutation.mutate(newTask);

    const id = Math.random().toString(36).substring(7);
    const task: Task = {
      id,
      text: newTask,
      completed: false,
      deadline: selectedDate,
    };
    setTasks([...tasks, task]);
    setNewTask("");
    setSelectedDate(undefined);
    setDeadlineSuggestion(null);
  };

  const handleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleTaskDeletion = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleDateSelection = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-primary text-2xl font-semibold">
            TaskTango
          </CardTitle>
          <CardDescription>
            Manage your tasks with ease.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Add a task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    "w-32"
                  )}
                >
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelection}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleAddTask} disabled={mutation.isPending}>
              {mutation.isPending ? "Suggesting..." : "Add Task"}
            </Button>
          </div>
          {deadlineSuggestion && (
            <div className="text-sm text-muted-foreground">
              Suggested Deadline: {deadlineSuggestion.suggestedDeadline}
              <br />
              Reasoning: {deadlineSuggestion.reasoning}
            </div>
          )}
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between p-2 rounded-md shadow-sm bg-background"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleTaskCompletion(task.id)}
                    id={task.id}
                  />
                  <label
                    htmlFor={task.id}
                    className={`text-sm ${task.completed
                      ? "line-through text-accent"
                      : ""
                      }`}
                  >
                    {task.text}
                    {task.deadline && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (Deadline: {format(task.deadline, "PPP")})
                      </span>
                    )}
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTaskDeletion(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}
