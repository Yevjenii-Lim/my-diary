# Database Schema Documentation

## Overview

The diary application uses DynamoDB with a hierarchical structure where:
- **Users** own multiple **Topics**
- **Topics** contain multiple **Entries**
- All data is properly linked and organized by user

## Table Structure

### 1. Users Table (`diary-users`)

**Primary Key**: `id` (String)

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | String | Unique user identifier (Primary Key) |
| `email` | String | User's email address |
| `name` | String | User's display name |
| `createdAt` | String | ISO timestamp of user creation |
| `updatedAt` | String | ISO timestamp of last update |

**Example Item**:
```json
{
  "id": "user-123",
  "email": "john@example.com",
  "name": "John Doe",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### 2. Topics Table (`diary-topics`)

**Primary Key**: 
- **Hash Key**: `userId` (String)
- **Range Key**: `topicId` (String)

| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` | String | Reference to user (Hash Key) |
| `topicId` | String | Topic identifier (Range Key) |
| `id` | String | Composite key: `${userId}-${topicId}` |
| `title` | String | Topic title |
| `description` | String | Topic description |
| `icon` | String | Emoji icon |
| `color` | String | CSS gradient class |
| `category` | String | Topic category (reflection, creativity, learning, personal, professional) |
| `isActive` | Boolean | Whether topic is active |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

**Example Item**:
```json
{
  "userId": "user-123",
  "topicId": "daily-reflection",
  "id": "user-123-daily-reflection",
  "title": "Daily Reflection",
  "description": "Process your day and understand your experiences",
  "icon": "🤔",
  "color": "from-blue-500 to-blue-600",
  "category": "reflection",
  "isActive": true,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### 3. Entries Table (`diary-entries`)

**Primary Key**:
- **Hash Key**: `userId` (String)
- **Range Key**: `entryId` (String)

**Global Secondary Index**: `TopicEntriesIndex`
- **Hash Key**: `topicId` (String)
- **Range Key**: `createdAt` (String)

| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` | String | Reference to user (Hash Key) |
| `entryId` | String | Entry identifier (Range Key) |
| `id` | String | Composite key: `${userId}-${entryId}` |
| `topicId` | String | Reference to topic |
| `title` | String | Entry title |
| `content` | String | Entry content |
| `wordCount` | Number | Word count |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

**Example Item**:
```json
{
  "userId": "user-123",
  "entryId": "daily-reflection-1705312200000",
  "id": "user-123-daily-reflection-1705312200000",
  "topicId": "daily-reflection",
  "title": "My First Reflection",
  "content": "Today was an interesting day...",
  "wordCount": 150,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

## Relationships

### User → Topics
- **One-to-Many**: Each user can have multiple topics
- **Query**: Get all topics for a user using `userId` as hash key
- **Example**: `getUserTopics("user-123")`

### User → Entries
- **One-to-Many**: Each user can have multiple entries
- **Query**: Get all entries for a user using `userId` as hash key
- **Example**: `getUserEntries("user-123")`

### Topic → Entries
- **One-to-Many**: Each topic can have multiple entries
- **Query**: Get all entries for a topic using GSI `TopicEntriesIndex`
- **Example**: `getUserEntries("user-123", "daily-reflection")`

## Query Patterns

### 1. Get User's Topics
```typescript
// Query topics table with userId as hash key
const topics = await getUserTopics("user-123");
```

### 2. Get User's All Entries
```typescript
// Query entries table with userId as hash key
const entries = await getUserEntries("user-123");
```

### 3. Get Entries for Specific Topic
```typescript
// Query entries table using GSI with topicId as hash key
const entries = await getUserEntries("user-123", "daily-reflection");
```

### 4. Get Specific Entry
```typescript
// Get entry by composite key
const entry = await getEntry("user-123-daily-reflection-1705312200000");
```

## Data Flow

### Creating a New Entry
1. User selects a topic from their personal topics
2. User writes entry content
3. Entry is saved with:
   - `userId`: Links to user
   - `topicId`: Links to specific topic
   - `entryId`: Unique identifier for the entry
   - `id`: Composite key for efficient querying

### Adding a New Topic
1. User selects from available predefined goals
2. Topic is saved with:
   - `userId`: Links to user
   - `topicId`: Links to predefined goal
   - All metadata from the predefined goal

## Benefits of This Structure

1. **Efficient Queries**: All queries use hash keys for optimal performance
2. **Scalability**: DynamoDB can handle millions of users and entries
3. **Data Integrity**: All relationships are maintained through proper keys
4. **Flexibility**: Easy to add new topics and entries
5. **Cost Effective**: Pay only for what you use

## Security Considerations

1. **User Isolation**: All queries are scoped to specific users
2. **No Cross-User Access**: Users cannot access other users' data
3. **Proper Authentication**: All API calls require valid user context
4. **Data Validation**: All inputs are validated before database operations

## Migration Notes

If you need to migrate from the old structure:
1. Create new tables with the updated schema
2. Migrate existing data to new structure
3. Update application code to use new API patterns
4. Test thoroughly before switching over

