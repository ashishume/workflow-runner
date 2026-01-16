# Workflow Builder

A modern, visual flow-based workflow builder inspired by n8n and Node-RED. Built with Vue 3, TypeScript, Vue Flow, and Pinia.

![Workflow Builder](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Pinia](https://img.shields.io/badge/Pinia-3.x-yellow?style=flat-square)
![Vue Flow](https://img.shields.io/badge/Vue%20Flow-1.x-00d4ff?style=flat-square)

## 🎯 Features

### Core Features

- **Node Palette**: Drag and drop nodes from a left-side palette
  - Start Node: Initialize workflow with custom JSON payload
  - Transform Node: Modify data with various operations (uppercase, lowercase, append, prepend, multiply, add, replace)
  - If-Else Condition Node: Conditional branching with multiple operators
  - End Node: Terminate workflow execution

- **Interactive Canvas**: 
  - Drag nodes from palette to canvas
  - Move nodes around freely
  - Connect nodes using visual edges
  - Pan and zoom navigation
  - Grid snapping for precise positioning

- **Node Configuration Panel**:
  - Context-aware configuration for each node type
  - Real-time updates with reactive state
  - JSON payload editor for Start nodes
  - Transform operation selector
  - Condition builder with operators

- **State Management**:
  - Centralized state with Pinia
  - Full reactivity for nodes, edges, and configurations
  - Position tracking for all nodes
  - Viewport state persistence

- **Workflow Execution**:
  - Visual simulation of data flow
  - Step-by-step execution with logs
  - Input/output tracking for each node
  - Cycle detection to prevent infinite loops

- **Save/Load Workflows**:
  - Export workflow as JSON
  - Import from JSON file or paste
  - Download workflow configuration
  - Copy to clipboard

### Bonus Features ✨

- **Undo/Redo Support**: Full history with Ctrl+Z / Ctrl+Y
- **Dark/Light Mode**: Toggle with persistent preference
- **Minimap View**: Navigate large workflows easily
- **LocalStorage Autosave**: Never lose your work
- **Grid Snapping**: Align nodes perfectly
- **Custom Node Designs**: Unique visual styling per node type
- **Keyboard Shortcuts**: Efficient workflow management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/workflow-builder.git

# Navigate to project directory
cd workflow-builder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
workflow-builder/
├── public/
│   └── workflow-icon.svg    # App icon
├── src/
│   ├── components/
│   │   ├── nodes/
│   │   │   ├── StartNode.vue      # Start node component
│   │   │   ├── TransformNode.vue  # Transform node component
│   │   │   ├── ConditionNode.vue  # If-Else node component
│   │   │   └── EndNode.vue        # End node component
│   │   ├── NodePalette.vue        # Draggable node palette
│   │   ├── WorkflowCanvas.vue     # Main canvas with Vue Flow
│   │   ├── ConfigPanel.vue        # Node configuration panel
│   │   ├── ExecutionLogs.vue      # Execution logs display
│   │   └── Toolbar.vue            # Top toolbar with actions
│   ├── stores/
│   │   └── workflow.ts            # Pinia store for state management
│   ├── types/
│   │   └── workflow.ts            # TypeScript type definitions
│   ├── App.vue                    # Root component
│   ├── main.ts                    # Entry point
│   └── style.css                  # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎮 Usage Guide

### Creating a Workflow

1. **Add Nodes**: Drag nodes from the left palette onto the canvas
2. **Connect Nodes**: Click and drag from one node's handle to another
3. **Configure Nodes**: Click a node to open the configuration panel
4. **Position Nodes**: Drag nodes to arrange your workflow

### Running a Workflow

1. Create a valid workflow with connected nodes
2. Click the **Run** button in the toolbar
3. Watch the execution logs panel for results
4. View input/output data for each step

### Workflow Examples

#### Example 1: Simple Text Transformation

```
Start Node (payload: {"message": "hello"})
    ↓
Transform Node (uppercase on "message")
    ↓
End Node
```

**Expected Output:**
```
Start Node -> { message: "hello" }
Transform Node -> { message: "HELLO" }
End Node -> { message: "HELLO" }
```

#### Example 2: Conditional Flow

```
Start Node (payload: {"value": 50})
    ↓
If-Else Node (value > 25)
   ├── True → Transform (multiply by 2) → End
   └── False → End
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + E` | Export Workflow |
| `Ctrl + I` | Import Workflow |

## 🛠 Technologies Used

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vue Flow** - Interactive node-based graph library
- **Pinia** - Intuitive state management
- **Vite** - Next-generation build tool
- **VueUse** - Collection of Vue composition utilities

## 📝 API Reference

### Node Types

#### Start Node
```typescript
interface StartNodeConfig {
  payload: Record<string, unknown>
}
```

#### Transform Node
```typescript
interface TransformNodeConfig {
  operation: 'uppercase' | 'lowercase' | 'append' | 'prepend' | 'multiply' | 'add' | 'replace'
  field: string
  value?: string | number
}
```

#### Condition Node
```typescript
interface ConditionNodeConfig {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value: string | number | boolean
}
```

#### End Node
```typescript
interface EndNodeConfig {
  label: string
}
```

### Workflow State

```typescript
interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}
```

## 🎨 Design Decisions

1. **Dark Mode Default**: Optimized for extended use with eye-friendly colors
2. **Distinctive Node Colors**: Each node type has a unique color scheme for quick identification
3. **Gradient Backgrounds**: Modern aesthetic with subtle gradients
4. **JetBrains Mono Font**: Monospace font for code/data display
5. **Outfit Font**: Clean, modern sans-serif for UI elements

## 🔧 Configuration

### Vite Config
The project uses Vite with Vue plugin. Customize in `vite.config.ts`.

### TypeScript Config
Strict TypeScript configuration for type safety. See `tsconfig.json`.

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build the project
npm run build

# Deploy dist folder to Netlify
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Vue Flow](https://vueflow.dev/) - For the amazing graph library
- [n8n](https://n8n.io/) - For inspiration
- [Node-RED](https://nodered.org/) - For workflow concepts

---

Built with ❤️ using Vue 3 + TypeScript
