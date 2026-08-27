export function calculateProjectProgress(project, tasksOverride) {
  const activeTasks = tasksOverride || project?.tasks || [];
  if (!activeTasks || activeTasks.length === 0) {
    return project?.progress || 0;
  }
  let totalItems = 0;
  let completedItems = 0;

  activeTasks.forEach(t => {
    const subtasks = t.subtasks || [];
    if (subtasks.length > 0) {
      subtasks.forEach(s => {
        totalItems++;
        if (s.done || s.completed) completedItems++;
      });
    } else {
      totalItems++;
      const isDone = Boolean(t.done || t.completed || t.status === 'done' || t.status === 'completed' || t.status === 'Done' || t.status === 'Completed');
      if (isDone) completedItems++;
    }
  });

  if (totalItems === 0) return project?.progress || 0;
  return Math.round((completedItems / totalItems) * 100);
}

export function isProjectOwner(project, user) {
  if (!project || !user) return false;
  const userId = typeof user === 'object' ? user.id : null;
  const userName = typeof user === 'string' ? user : user.name;
  const userEmail = typeof user === 'object' ? user.email : (typeof user === 'string' && user.includes('@') ? user : null);
  
  const projectOwnerId = project.ownerId || (typeof project.owner === 'object' ? project.owner?.id : null);
  if (userId && projectOwnerId && String(userId) === String(projectOwnerId)) return true;

  const ownerName = typeof project.owner === 'string' ? project.owner : project.owner?.name;
  const ownerEmail = typeof project.owner === 'object' ? project.owner?.email : (typeof project.owner === 'string' && project.owner.includes('@') ? project.owner : null);

  if (userName && ownerName && userName.toLowerCase() === ownerName.toLowerCase()) return true;
  if (userEmail && ownerEmail && userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
  if (userEmail && ownerName && userEmail.toLowerCase() === ownerName.toLowerCase()) return true;
  if (userName && ownerEmail && userName.toLowerCase() === ownerEmail.toLowerCase()) return true;
  
  return false;
}

export function isProjectMember(project, user) {
  if (!project || !user || !Array.isArray(project.members)) return false;
  const userId = typeof user === 'object' ? user.id : null;
  const userName = typeof user === 'string' ? user : user.name;
  const userEmail = typeof user === 'object' ? user.email : (typeof user === 'string' && user.includes('@') ? user : null);

  return project.members.some(m => {
    if (!m) return false;
    if (userId && (m.userId || m.id) && String(userId) === String(m.userId || m.id)) return true;

    const mName = typeof m === 'string' ? m : m.name;
    const mEmail = typeof m === 'object' ? m.email : (typeof m === 'string' && m.includes('@') ? m : null);

    if (userName && mName && userName.toLowerCase() === mName.toLowerCase()) return true;
    if (userEmail && mEmail && userEmail.toLowerCase() === mEmail.toLowerCase()) return true;
    if (userEmail && mName && userEmail.toLowerCase() === mName.toLowerCase()) return true;
    if (userName && mEmail && userName.toLowerCase() === mEmail.toLowerCase()) return true;

    return false;
  });
}

export function formatActivityText(text) {
  if (!text) return text;
  return String(text)
    .replace(/\bin_progress\b/g, 'In Progress')
    .replace(/\btodo\b/g, 'To Do')
    .replace(/\breview\b/g, 'Review')
    .replace(/\bcompleted\b/g, 'Completed');
}
