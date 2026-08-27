export const MOCK_MEMBERS = [];

export function getInitials(nameStr) {
  if (!nameStr) return 'U';
  const parts = nameStr.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : nameStr.substring(0, 2).toUpperCase();
}

export function getMemberByName(name) {
  if (!name) return null;
  const nameStr = typeof name === 'string' ? name : (name.name || name.email || '');
  const found = MOCK_MEMBERS.find(
    m => m.name.toLowerCase() === nameStr.toLowerCase() || 
         (m.email && m.email.toLowerCase() === nameStr.toLowerCase())
  );
  if (found) return found;

  // Generate proper 2-letter initials: first letter of first name + first letter of last name
  const initials = getInitials(nameStr);

  return {
    name: nameStr,
    role: 'Member',
    initials: initials || 'U',
    bg: '#3b82f6',
    avatar: ''
  };
}

export function normalizeMember(member) {
  if (typeof member === 'string') {
    return getMemberByName(member);
  }
  if (member && member.name) {
    const defaultData = getMemberByName(member.name);

    // Always recompute initials from the actual name for accuracy
    const nameStr = member.name.trim();
    const initials = getInitials(nameStr);

    return {
      ...defaultData,
      ...member,
      initials: member.initials || initials,
      // Live avatar from API always wins over mock avatar
      avatar: member.avatar !== undefined ? member.avatar : defaultData.avatar
    };
  }
  return member;
}

