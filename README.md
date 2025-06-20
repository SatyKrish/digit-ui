# DigitChat

A modern AI-powered chat application built with Next.js, featuring real-time conversations, data visualization, and Model Context Protocol (MCP) integration.

[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/PrtwFAXCyjN)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🤖 **AI-Powered Conversations**: Advanced chat capabilities with OpenAI integration
- 📊 **Data Visualization**: Interactive charts, heatmaps, treemaps, and geospatial visualizations
- 🔌 **MCP Integration**: Model Context Protocol support for enhanced AI capabilities
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Radix UI components
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices
- 🔐 **Authentication**: Secure Microsoft SSO authentication and session management
- ⚡ **Real-time Updates**: Live chat updates and status indicators

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **AI Integration**: OpenAI SDK
- **Authentication**: Microsoft Authentication Library (MSAL)
- **State Management**: React Hooks
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/digit-ui.git
cd digit-ui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Azure AD and add environment variables to `.env.local`:

#### Azure AD Setup

> **📋 Quick Setup Guide**  
> For a complete step-by-step guide with screenshots, see the [Azure AD App Registration documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app).

**1. Create Azure AD App Registration**
1. Navigate to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **"New registration"** and configure:
   - **Name**: `DigitChat` (or your preferred app name)
   - **Supported account types**: `Accounts in this organizational directory only` (Single tenant)
   - **Redirect URI**: Select `Single-page application (SPA)` and enter `http://localhost:3000` (for development)

**2. Configure Authentication Settings**
1. Go to **Authentication** blade
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ **Access tokens** (used for calling APIs)
   - ✅ **ID tokens** (used for user sign-in)
3. Under **Advanced settings**, set:
   - **Allow public client flows**: `No`
   - **Live SDK support**: `No`

**3. Gather Required Information**
1. Go to **Overview** blade and copy:
   - **Application (client) ID** - This is your `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** - This is your `AZURE_TENANT_ID`

**4. Configure API Permissions (Minimal Setup)**
1. Go to **API permissions** blade
2. Remove the default `User.Read` permission if present to avoid admin consent requirements
3. The app will use only standard OpenID Connect claims: `openid`, `profile`, `email`
4. These permissions do not require admin consent and provide basic user information

#### Azure OpenAI Setup (Required)

**For organizations using Azure OpenAI Service**:

**1. Create Azure OpenAI Resource**
1. Visit [Azure Portal](https://portal.azure.com)
2. Create a new **Azure OpenAI** resource
3. Choose your subscription, resource group, and region
4. Select appropriate pricing tier

**2. Deploy a Model**
1. Go to **Azure OpenAI Studio** from your resource
2. Navigate to **Deployments** > **Create new deployment**
3. Select model (e.g., `gpt-4o`, `gpt-4`, `gpt-35-turbo`)
4. Choose deployment name (this will be your `AZURE_OPENAI_DEPLOYMENT_NAME`)
5. Configure capacity and settings

**3. Get Connection Details**
1. In Azure Portal, go to your OpenAI resource
2. Navigate to **Keys and Endpoint**
3. Copy **Endpoint** - this is your `AZURE_OPENAI_ENDPOINT`
4. Copy **Key1** or **Key2** - this is your `AZURE_OPENAI_API_KEY`

**4. Configure Application**
Set `LLM_PROVIDER=azure` in your environment variables and provide the Azure OpenAI configuration.

> **🏢 Enterprise Benefits**: Azure OpenAI provides enhanced security, compliance, and data residency controls for enterprise use.

#### Environment Variables

> **🔐 Security Architecture**  
> This application uses **server-side configuration** for enhanced security:
> - Configuration is fetched from `/api/auth/config` endpoint
> - Azure AD credentials are never exposed to the client browser
> 
> See the [Azure MSAL documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview) for more details on authentication flows.

**Development Configuration**:
```env
# Azure AD Configuration (Server-side)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here 
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_REDIRECT_URI=http://localhost:3000
AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# Environment
NODE_ENV=development

# Optional: Database Configuration
DATABASE_PATH=./data/chat.db
DATABASE_TIMEOUT=30000

# Optional: MCP Server Configuration
ENABLE_MCP=true
MCP_DATABASE_SERVER_URL=http://localhost:3001
MCP_ANALYTICS_SERVER_URL=http://localhost:3002
MCP_FILE_SERVER_URL=http://localhost:3003
```

**Azure OpenAI Configuration** (Required):
```env
# Azure AD Configuration (Server-side)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here 
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_REDIRECT_URI=http://localhost:3000
AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000

# Azure OpenAI Configuration (Required)
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

**Production Configuration**:
```env
# Azure AD Configuration (Server-side for security)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here 
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_REDIRECT_URI=https://yourdomain.com
AZURE_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# Environment
NODE_ENV=production

# Optional: Database Configuration
DATABASE_PATH=./data/chat.db
DATABASE_TIMEOUT=30000
```

**Azure OpenAI Production Configuration**:
```env
# Azure AD Configuration (Server-side for security)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here 
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_REDIRECT_URI=https://yourdomain.com
AZURE_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# Azure OpenAI Configuration (Required)
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Azure AD Production Configuration

For production deployments, additional Azure AD configuration is required for enhanced security:

**1. Create Client Secret** (Required for server-side authentication):
1. In your Azure AD app registration, go to **Certificates & secrets**
2. Click **"New client secret"**
3. Set description: `DigitChat Production Secret`
4. Set expiration: `24 months` (recommended)
5. Copy the **Value** immediately - this is your `AZURE_CLIENT_SECRET`

**2. Update Redirect URIs**:
1. Go to **Authentication** blade
2. Add your production URL to **Redirect URIs**: `https://yourdomain.com`
3. Update **Logout URL** if needed: `https://yourdomain.com`

**3. Container/Kubernetes Deployment**:

The application includes Kubernetes configuration in `/k8s/deployment.yaml`. Update the ConfigMap and Secret with your values:

```yaml
# ConfigMap for non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: digit-auth-config
data:
  AZURE_TENANT_ID: "your-tenant-id-here"
  AZURE_REDIRECT_URI: "https://digit.yourdomain.com"
  AZURE_POST_LOGOUT_REDIRECT_URI: "https://digit.yourdomain.com"
  NODE_ENV: "production"
```

```yaml
# Secret for sensitive configuration
apiVersion: v1
kind: Secret
metadata:
  name: digit-auth-secrets
type: Opaque
data:
  # Base64 encoded values
  AZURE_CLIENT_ID: "<base64-encoded-client-id>"
  AZURE_CLIENT_SECRET: "<base64-encoded-client-secret>"
```

### Docker Deployment

The application includes Docker support for both development and production environments.

**Development with Docker:**
```bash
# Build and run in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or use the development-specific compose file
docker-compose -f docker-compose.dev.yml up --build
```

**Production with Docker:**
```bash
# Copy environment variables
cp .env.docker .env

# Edit .env with your production values
# Then run production build
docker-compose up --build -d

# With nginx reverse proxy (recommended for production)
docker-compose --profile production up --build -d
```

**Docker Environment Setup:**
1. Copy the docker environment template:
   ```bash
   cp .env.docker .env
   ```

2. Update the `.env` file with your Azure AD configuration:
   ```env
   NEXT_PUBLIC_AZURE_CLIENT_ID=your-azure-client-id
   NEXT_PUBLIC_AZURE_TENANT_ID=your-azure-tenant-id
   NEXT_PUBLIC_REDIRECT_URI=https://yourdomain.com
   NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
   ```

3. For production, ensure your Azure AD app registration includes the correct redirect URI

**Docker Commands:**
```bash
# Build only
docker-compose build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f digit-ui

# Stop services
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Troubleshooting Authentication

**Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| **"AADSTS50011: The reply URL specified in the request does not match"** | Verify redirect URI in Azure AD matches your domain exactly |
| **"Failed to initialize authentication system"** | Check that all required environment variables are set correctly |
| **"AADSTS700016: Application not found"** | Verify `AZURE_CLIENT_ID` is correct and app exists in the tenant |
| **Login succeeds but user info missing** | User info is now extracted from ID token claims automatically |

**Debug Steps:**
1. Check browser console for detailed MSAL errors
2. Verify environment variables are loaded: `/api/auth/config`
3. Test authentication flow in Azure AD logs
4. Review server logs for configuration errors

**Useful Links:**
- [Azure AD Error Codes](https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)
- [MSAL.js Troubleshooting](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-js-troubleshooting)
- [Azure AD App Registration Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/security-best-practices-for-app-registration)

## Project Structure

```
├── src/                   # Application source code
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   ├── chat-*.tsx   # Chat-related components
│   │   └── *-artifact.tsx # Visualization components
│   ├── config/          # Configuration files
│   │   ├── msal-config.ts # Azure AD configuration
│   │   └── theme-config.ts # Theme configuration
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── mcp/             # MCP client and related files
│   └── styles/          # Additional stylesheets
├── k8s/                 # Kubernetes deployment files
├── public/              # Static assets
├── docker-compose.yml   # Docker deployment configuration
├── docker-compose.dev.yml # Docker development configuration
├── nginx.conf           # Nginx configuration for production
└── Dockerfile           # Docker build configuration
```

## Usage

1. **Start a Conversation**: Click on "New Chat" to begin a conversation with the AI
2. **Visualize Data**: Ask the AI to create charts, graphs, or other visualizations
3. **MCP Tools**: Access enhanced AI capabilities through the MCP tools panel
4. **Manage Chats**: Use the sidebar to navigate between different chat sessions

## Screenshots

### Login Screen
![Login Screen](docs/login-screen.png)

### Welcome Screen
![Welcome Screen](docs/welcome-screen.png)

### Chat Screen
![Chat Screen](docs/chat-screen.png)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
