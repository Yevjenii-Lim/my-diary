// Demo script to show how each user has their own topics

// Mock data to demonstrate the concept
const mockUsers = [
  {
    id: 'user-john',
    name: 'John Doe',
    email: 'john@example.com'
  },
  {
    id: 'user-jane', 
    name: 'Jane Smith',
    email: 'jane@example.com'
  },
  {
    id: 'user-bob',
    name: 'Bob Wilson',
    email: 'bob@example.com'
  }
];

const mockTopics = [
  // John's topics
  { userId: 'user-john', topicId: 'daily-reflection', title: 'Daily Reflection', icon: '🤔' },
  { userId: 'user-john', topicId: 'creative-writing', title: 'Creative Writing', icon: '✨' },
  { userId: 'user-john', topicId: 'gratitude-practice', title: 'Gratitude Practice', icon: '🙏' },
  
  // Jane's topics
  { userId: 'user-jane', topicId: 'problem-solving', title: 'Problem Solving', icon: '🧩' },
  { userId: 'user-jane', topicId: 'career-planning', title: 'Career Planning', icon: '💼' },
  { userId: 'user-jane', topicId: 'mindfulness-practice', title: 'Mindfulness Practice', icon: '🧘' },
  
  // Bob's topics
  { userId: 'user-bob', topicId: 'daily-reflection', title: 'Daily Reflection', icon: '🤔' },
  { userId: 'user-bob', topicId: 'learning-notes', title: 'Learning Notes', icon: '📚' },
  { userId: 'user-bob', topicId: 'relationship-reflection', title: 'Relationship Reflection', icon: '❤️' }
];

function getMockUserTopics(userId) {
  return mockTopics.filter(topic => topic.userId === userId);
}

function getUserEntries(userId) {
  // Mock entries - in real app these would come from DynamoDB
  const mockEntries = [
    { userId: 'user-john', topicId: 'daily-reflection', title: 'My First Reflection', content: 'Today was...' },
    { userId: 'user-john', topicId: 'creative-writing', title: 'A Creative Story', content: 'Once upon a time...' },
    { userId: 'user-jane', topicId: 'problem-solving', title: 'Work Challenge', content: 'I faced a difficult...' },
    { userId: 'user-bob', topicId: 'daily-reflection', title: 'Bob\'s Reflection', content: 'I learned today...' }
  ];
  
  return mockEntries.filter(entry => entry.userId === userId);
}

console.log('🎯 DEMO: Each User Has Their Own Topics List\n');

mockUsers.forEach(user => {
  console.log(`👤 ${user.name} (${user.email})`);
  console.log('='.repeat(50));
  
  const userTopics = getMockUserTopics(user.id);
  const userEntries = getUserEntries(user.id);
  
  console.log(`📚 Topics (${userTopics.length}):`);
  userTopics.forEach(topic => {
    console.log(`   ${topic.icon} ${topic.title}`);
  });
  
  console.log(`\n📝 Entries (${userEntries.length}):`);
  userEntries.forEach(entry => {
    console.log(`   • ${entry.title} (Topic: ${entry.topicId})`);
  });
  
  console.log('\n' + '─'.repeat(50) + '\n');
});

console.log('💡 Key Points:');
console.log('• Each user has their OWN list of topics');
console.log('• Topics are stored in the topics table with userId as the key');
console.log('• When a user logs in, we query: "Get all topics where userId = current_user_id"');
console.log('• Users can have the same topic names but they are separate records');
console.log('• All entries are linked to both user AND topic');
