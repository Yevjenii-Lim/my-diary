# Topics Management Guide

## 📚 **Overview**

The diary app uses a **user-specific topics system** where each user has their own set of writing goals and topics. This ensures complete data isolation and personalized experiences.

## 🏗️ **Database Structure**

### **Topics Table (`diary-topics`)**
- **Primary Key**: `userId` (HASH) + `topicId` (RANGE)
- **Each user gets their own copy** of all available topics
- **Topics are isolated** - users can only see their own topics

### **Available Topics**
The app comes with **12 predefined writing goals** across **5 categories**:

#### **Reflection (1 topic)**
- 🤔 **Daily Reflection** - Process your day and understand your experiences

#### **Creativity (1 topic)**
- ✨ **Creative Writing** - Explore your imagination and develop creative skills

#### **Learning (2 topics)**
- 🧩 **Problem Solving** - Work through challenges and find solutions
- 📚 **Learning Notes** - Document what you've learned and insights gained

#### **Personal (5 topics)**
- 🙏 **Gratitude Practice** - Focus on what you're thankful for
- 🎯 **Goal Setting** - Plan your future and track your progress
- 💭 **Emotional Processing** - Understand and work through your emotions
- ❤️ **Relationship Reflection** - Reflect on your relationships and interactions
- 🧘 **Mindfulness Practice** - Practice present-moment awareness and meditation

#### **Professional (3 topics)**
- ⚖️ **Decision Making** - Think through important decisions systematically
- 🚀 **Skill Development** - Track your progress in developing new skills
- 💼 **Career Planning** - Plan and reflect on your career development

## 🛠️ **Management Scripts**

### **1. Populate Topics for All Users**
```bash
node scripts/populate-topics.js
```
- Adds all 12 initial topics for every existing user
- Use this when you want to give existing users access to all topics

### **2. Add Topics for User (Manual)**
```bash
node scripts/add-topics-for-new-user.js <userId> [userName]
```
- Adds all 12 initial topics for a specific user
- Use this for manual topic addition (not automatic)
- Example: `node scripts/add-topics-for-new-user.js user-789 "John Doe"`

### **3. View All Topics**
```bash
node scripts/view-topics.js
```
- Shows all topics organized by user and category
- Useful for debugging and verification

### **4. Clear User Topics (Reset)**
```bash
node scripts/clear-user-topics.js <userId>
```
- Deletes all topics for a specific user
- Use this to reset a user to empty topics list
- Example: `node scripts/clear-user-topics.js user-123`

## 🔄 **User Flow**

### **New User Signup**
1. User creates account via Cognito
2. User is added to `diary-users` table
3. **User starts with empty topics list**
4. User manually adds topics they want via the UI

### **Existing User**
1. User signs in via Cognito
2. App fetches user's topics from `diary-topics` table
3. User sees their personalized list of topics (or empty list)
4. User can add topics from available goals

## 📊 **Current Status**

### **Database Statistics**
- **Total Topics**: 12 (12 for user-123, 0 for user-456)
- **Total Users**: 2
- **Categories**: 5 (reflection, creativity, learning, personal, professional)

### **User Breakdown**
- **user-123** (Test User): 12 topics (manually added)
- **user-456** (Jane Smith): 0 topics (empty list - demonstrating new approach)

### **New User Experience**
- **New users start with**: 0 topics (empty list)
- **Topic addition**: Manual via "+ Add to My Topics" button
- **Available topics**: 12 predefined writing goals

## 🎯 **Integration with App**

### **Goals Page (`/goals`)**
- Shows user's current topics
- Allows adding new topics from available goals
- Filters by category

### **New Entry Page (`/new-entry`)**
- User selects from their personal topics
- Can add new topics on the fly
- Shows available goals to add

### **API Endpoints**
- `GET /api/topics` - Fetch user's topics
- `POST /api/topics` - Add new topic for user
- `GET /api/entries/topic/[topicId]` - Get entries for specific topic

## 🔧 **Adding New Topics**

### **For Development**
1. Add new topic to `src/data/writingGoals.ts`
2. Update the `initialTopics` array in scripts
3. Run population scripts for existing users

### **For Production**
1. Add new topic to `src/data/writingGoals.ts`
2. Deploy the update
3. Run `node scripts/populate-topics.js` to add to existing users
4. New users will automatically get the new topic

## 🚀 **Best Practices**

### **Topic Design**
- Keep titles clear and actionable
- Use descriptive icons and colors
- Categorize logically
- Limit to 12-15 topics per user for usability

### **User Experience**
- Each user sees only their topics
- Topics are personalized and private
- Users can add/remove topics as needed
- Categories help organize content

### **Performance**
- Topics are cached in UserContext
- API calls are minimized
- Efficient DynamoDB queries by userId

## 🔒 **Security & Privacy**

### **Data Isolation**
- ✅ Each user only sees their own topics
- ✅ No cross-user data access
- ✅ Topics are tied to user ID
- ✅ Cognito authentication required

### **Access Control**
- Topics require user authentication
- API endpoints validate user ownership
- No public topic access

## 📈 **Scaling Considerations**

### **Current Limits**
- **Free Tier**: 50,000 MAUs
- **Topics per User**: 12 (easily expandable)
- **Categories**: 5 (easily expandable)

### **Future Enhancements**
- Custom topic creation
- Topic sharing between users
- Topic templates
- Advanced categorization

## 🎉 **Success Metrics**

### **User Engagement**
- Users can immediately start writing
- Clear topic categories
- Easy topic management
- Personalized experience

### **Data Quality**
- Structured writing goals
- Consistent topic format
- Proper categorization
- User-specific customization

---

**Your diary app now has a robust, scalable topics system that provides each user with a personalized writing experience!** 🚀
