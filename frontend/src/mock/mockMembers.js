export const MOCK_MEMBERS = [
  {
    id: 'usr-1',
    name: 'Alex Johnson',
    role: 'Lead Designer',
    initials: 'AJ',
    bg: '#3b82f6',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-2',
    name: 'Sara Smith',
    role: 'Product Manager',
    initials: 'SS',
    bg: '#10b981',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-3',
    name: 'John Doe',
    role: 'Software Engineer',
    initials: 'JD',
    bg: '#8b5cf6',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-4',
    name: 'David W',
    role: 'DevOps Engineer',
    initials: 'DW',
    bg: '#f59e0b',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-5',
    name: 'Elena V',
    role: 'QA Lead',
    initials: 'EV',
    bg: '#f43f5e',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-6',
    name: 'Amanda Black',
    role: 'UX Designer',
    initials: 'AB',
    bg: '#6366f1',
    avatar: ''
  },
  {
    id: 'usr-7',
    name: 'Jake Wilson',
    role: 'Front-End Dev',
    initials: 'JW',
    bg: '#ec4899',
    avatar: ''
  },
  {
    id: 'usr-8',
    name: 'Priya Patel',
    role: 'UI Designer',
    initials: 'PP',
    bg: '#06b6d4',
    avatar: ''
  },
  {
    id: 'usr-9',
    name: 'Mike Chen',
    role: 'Back-End Dev',
    initials: 'MC',
    bg: '#84cc16',
    avatar: ''
  },
  {
    id: 'usr-10',
    name: 'Chris Brown',
    role: 'Marketing Specialist',
    initials: 'CB',
    bg: '#eab308',
    avatar: ''
  },
  {
    id: 'usr-11',
    name: 'Sathsarani Perera',
    email: 'sathsaraniperera16@gmail.com',
    role: 'Full Stack Developer',
    initials: 'SP',
    bg: '#ec4899',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'usr-12',
    name: 'Isuri Perera',
    email: 'isuriupp@gmail.com',
    role: 'Product Manager',
    initials: 'IP',
    bg: '#8b5cf6',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  }
];

export function getMemberByName(name) {
  if (!name) return null;
  const nameStr = typeof name === 'string' ? name : (name.name || name.email || '');
  const found = MOCK_MEMBERS.find(
    m => m.name.toLowerCase() === nameStr.toLowerCase() || 
         (m.email && m.email.toLowerCase() === nameStr.toLowerCase())
  );
  if (found) return found;

  const initials = nameStr
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
    return {
      ...defaultData,
      ...member
    };
  }
  return member;
}
