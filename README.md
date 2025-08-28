# My Diary - Digital Journaling App

A beautiful, secure digital diary application built with Next.js, TypeScript, and Tailwind CSS. Capture your daily thoughts, memories, and experiences in a modern, elegant interface.

## Features

- ✨ **Beautiful Design**: Clean, modern interface with elegant typography
- 🔒 **Secure & Private**: Your thoughts are encrypted and protected
- ☁️ **Cloud Sync**: Access your diary anywhere, anytime
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- ⚡ **Fast**: Built with Next.js for optimal performance
- 🎨 **Customizable**: Personalize your journaling experience

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Fonts**: Inter (sans-serif) + Playfair Display (serif)
- **Deployment**: AWS-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd diary-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
diary-app/
├── src/
│   └── app/
│       ├── page.tsx          # Home page
│       ├── layout.tsx        # Root layout
│       └── globals.css       # Global styles
├── public/                   # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

## AWS Deployment

This app is designed to be deployed on AWS. Here are the recommended deployment options:

### Option 1: AWS Amplify (Recommended)

1. Connect your GitHub repository to AWS Amplify
2. Amplify will automatically detect Next.js and build the app
3. Configure environment variables if needed
4. Deploy with one click

### Option 2: AWS Elastic Beanstalk

1. Build the application:
```bash
npm run build
```

2. Create a deployment package:
```bash
zip -r diary-app.zip . -x "node_modules/*" ".git/*"
```

3. Deploy to Elastic Beanstalk using the AWS Console or CLI

### Option 3: AWS ECS with Fargate

1. Create a Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and push to Amazon ECR
3. Deploy using ECS Fargate

### Environment Variables

For production deployment, consider setting these environment variables:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Development Roadmap

- [ ] User authentication system
- [ ] Diary entry creation and editing
- [ ] Entry search and filtering
- [ ] Rich text editor
- [ ] Image upload support
- [ ] Entry templates
- [ ] Export functionality
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@mydiary.com or create an issue in the repository.

---

Built with ❤️ using Next.js and Tailwind CSS
