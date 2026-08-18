export function calculateProjectProgress(project) {
  if (!project || !project.tasks || project.tasks.length === 0) {
    return project?.progress || 0;
  }
  let totalItems = 0;
  let completedItems = 0;

  project.tasks.forEach(t => {
    const subtasks = t.subtasks || [];
    if (subtasks.length > 0) {
      subtasks.forEach(s => {
        totalItems++;
        if (s.done || s.completed) completedItems++;
      });
    } else {
      totalItems++;
      if (t.done || t.completed) completedItems++;
    }
  });

  if (totalItems === 0) return project.progress || 0;
  return Math.round((completedItems / totalItems) * 100);
}
