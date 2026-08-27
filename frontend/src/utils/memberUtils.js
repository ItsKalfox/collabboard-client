export function getInitials(nameStr) {
  if (!nameStr) return 'U';
  const parts = nameStr.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nameStr.substring(0, 2).toUpperCase();
}

export function normalizeMember(member) {
  if (typeof member === 'string') {
    return {
      name: member,
      role: 'Member',
      initials: getInitials(member),
      bg: '#3b82f6',
      avatar: ''
    };
  }
  
  if (member && (member.name || member.email)) {
    const nameStr = (member.name || member.email || '').trim();
    const initials = getInitials(nameStr);
    
    return {
      ...member,
      name: nameStr,
      role: member.role || 'Member',
      initials: member.initials || initials,
      bg: member.bg || '#3b82f6',
      avatar: member.avatar || ''
    };
  }
  
  return member;
}
