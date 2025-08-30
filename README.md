# My Diary - Learn to Write, Learn to Think

A beautiful digital diary application designed to help users develop their writing skills and critical thinking through structured journaling with personalized topics.

## 🚀 Features

- **Personalized Writing Topics**: Users can select from predefined writing goals or create their own
- **Topic Management**: Add, organize, and track your writing topics by category
- **Entry Creation**: Write entries under specific topics with automatic word counting
- **DynamoDB Integration**: Scalable cloud storage for users, topics, and entries
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **TypeScript**: Full type safety and excellent developer experience

## 📋 Prerequisites

- Node.js 18+ 
- AWS Account with DynamoDB access
- AWS CLI configured (optional, for local development)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/Yevjenii-Lim/my-diary.git
cd my-diary
npm install
```

### 2. AWS Configuration

Create a `.env.local` file in the root directory:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# DynamoDB Table Names
USERS_TABLE=diary-users
TOPICS_TABLE=diary-topics
ENTRIES_TABLE=diary-entries
```

### 3. Set Up DynamoDB Tables

Run the setup script to create the required DynamoDB tables:

```bash
node scripts/setup-dynamodb.js
```

This will create three tables:
- `diary-users`: Stores user information
- `diary-topics`: Stores user's writing topics
- `diary-entries`: Stores diary entries

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🏗️ Architecture

### Database Schema

#### Users Table
- `id` (String, Primary Key): Unique user identifier
- `email` (String): User's email address
- `name` (String): User's display name
- `createdAt` (String): ISO timestamp
- `updatedAt` (String): ISO timestamp

#### Topics Table
- `id` (String, Primary Key): `${userId}-${topicId}`
- `userId` (String): Reference to user
- `topicId` (String): Topic identifier
- `title` (String): Topic title
- `description` (String): Topic description
- `icon` (String): Emoji icon
- `color` (String): CSS gradient class
- `category` (String): Topic category
- `isActive` (Boolean): Whether topic is active
- `createdAt` (String): ISO timestamp
- `updatedAt` (String): ISO timestamp

#### Entries Table
- `id` (String, Primary Key): `${userId}-${topicId}-${timestamp}`
- `userId` (String): Reference to user
- `topicId` (String): Reference to topic
- `title` (String): Entry title
- `content` (String): Entry content
- `wordCount` (Number): Word count
- `createdAt` (String): ISO timestamp
- `updatedAt` (String): ISO timestamp

### API Endpoints

- `GET /api/topics?userId={userId}`: Get user's topics
- `POST /api/topics`: Create new user topic
- `GET /api/entries?userId={userId}&topicId={topicId}`: Get user's entries
- `POST /api/entries`: Create new diary entry

## 🎯 Writing Goals

The app includes 12 predefined writing goals across 5 categories:

### Reflection
- Daily Reflection
- Emotional Processing

### Creativity
- Creative Writing

### Learning
- Problem Solving
- Learning Notes

### Personal
- Gratitude Practice
- Goal Setting
- Relationship Reflection
- Mindfulness Practice

### Professional
- Decision Making
- Skill Development
- Career Planning

## 🚀 Deployment

### AWS Deployment

1. **Set up AWS credentials** in your environment
2. **Create DynamoDB tables** using the setup script
3. **Deploy to AWS** using the provided Dockerfile:

```bash
docker build -t my-diary .
docker run -p 3000:3000 my-diary
```

### Environment Variables for Production

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key
USERS_TABLE=diary-users-prod
TOPICS_TABLE=diary-topics-prod
ENTRIES_TABLE=diary-entries-prod
```

## 🛠️ Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── goals/          # Goals management page
│   ├── new-entry/      # Entry creation page
│   └── page.tsx        # Home page
├── contexts/           # React contexts
├── data/              # Static data
├── lib/               # Utility functions
└── types/             # TypeScript types
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
