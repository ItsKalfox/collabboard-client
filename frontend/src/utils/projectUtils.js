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

export function isProjectOwner(project, user) {
  if (!project || !user) return false;
  const userName = typeof user === 'string' ? user : user.name;
  const userEmail = typeof user === 'object' ? user.email : (typeof user === 'string' && user.includes('@') ? user : null);
  
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
  const userName = typeof user === 'string' ? user : user.name;
  const userEmail = typeof user === 'object' ? user.email : (typeof user === 'string' && user.includes('@') ? user : null);

  return project.members.some(m => {
    if (!m) return false;
    const mName = typeof m === 'string' ? m : m.name;
    const mEmail = typeof m === 'object' ? m.email : (typeof m === 'string' && m.includes('@') ? m : null);

    if (userName && mName && userName.toLowerCase() === mName.toLowerCase()) return true;
    if (userEmail && mEmail && userEmail.toLowerCase() === mEmail.toLowerCase()) return true;
    if (userEmail && mName && userEmail.toLowerCase() === mName.toLowerCase()) return true;
    if (userName && mEmail && userName.toLowerCase() === mEmail.toLowerCase()) return true;

    return false;
  });
}

