# Workflow Builder

A modern, visual flow-based workflow builder inspired by n8n and Node-RED. Built with Vue 3, TypeScript, Vue Flow, and Pinia.

## 🎯 Features

### Core Features

- **Node Palette**: Drag and drop nodes from a collapsible left-side palette
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
  - Multi-node selection and operations

- **Node Configuration Panel**:
  - Context-aware configuration for each node type
  - Real-time updates with reactive state
  - JSON payload editor for Start nodes
  - Transform operation selector
  - Condition builder with comprehensive operators

- **State Management**:
  - Centralized state with Pinia
  - Full reactivity for nodes, edges, and configurations
  - Position tracking for all nodes
  - Viewport state persistence
  - Clipboard support for copy/paste operations

- **Workflow Execution**:
  - Visual simulation of data flow
  - Step-by-step execution with logs
  - Input/output tracking for each node
  - **Cycle detection** to prevent infinite loops
  - Validation with toast notifications for errors and warnings before execution

- **Save/Load Workflows**:
  - Export workflow as JSON
  - Import from JSON file or paste
  - Download workflow configuration
  - Copy to clipboard
  - Comprehensive import validation

### Bonus Features ✨

- **Undo/Redo Support**: Full history with Ctrl+Z / Ctrl+Y (up to 50 states)
- **Dark/Light Mode**: Toggle with persistent preference
- **Minimap View**: Navigate large workflows easily
- **LocalStorage Autosave**: Debounced auto-save (500ms) - never lose your work
- **Grid Snapping**: Align nodes perfectly
- **Custom Node Designs**: Unique visual styling per node type
- **Keyboard Shortcuts**: Comprehensive shortcuts with help modal (Ctrl+?)
- **Toast Notifications**: Success, error, warning, and info messages
- **Confirmation Modals**: Safe destructive actions with confirmation dialogs
- **Sample Workflows**: Pre-built examples to get started quickly
- **Custom SVG Icons**: 25+ handcrafted icons for a polished UI
- **Collapsible Node Palette**: Maximize canvas space when needed
- **Copy/Paste Nodes**: Duplicate nodes with Ctrl+C / Ctrl+V
- **Multi-Node Selection**: Select all nodes with Ctrl+A, bulk delete support

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

### Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Code Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting
npm run format:check
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

### Loading Sample Workflows

The app includes pre-built sample workflows in `public/sample-workflows/`:

- **text-transformation.json**: Simple text processing pipeline
- **conditional-branching.json**: Grade-based conditional flow with pass/fail paths

### Keyboard Shortcuts

| Shortcut                        | Action                      |
| ------------------------------- | --------------------------- |
| `Ctrl + Z`                      | Undo last action            |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo last action            |
| `Ctrl + A`                      | Select all nodes            |
| `Ctrl + C`                      | Copy selected node(s)       |
| `Ctrl + V`                      | Paste copied node(s)        |
| `Ctrl + E`                      | Export workflow             |
| `Ctrl + I`                      | Import workflow             |
| `Ctrl + ?`                      | Open keyboard shortcuts help|
| `Delete` / `Backspace`          | Delete selected node(s)     |
| `Escape`                        | Deselect / Close modals     |

## 🛠 Technologies Used

- **Vue 3.5** - Progressive JavaScript framework
- **Vue Flow 1.48** - Interactive node-based graph library
- **Pinia 3.x** - Intuitive state management
- **VueUse 14.x** - Essential Vue Composition Utilities
- **TypeScript 5.9** - Type-safe development
- **Vite 7.x** - Next generation frontend tooling
- **Vitest 4.x** - Fast unit testing framework
- **Sass** - CSS preprocessor for styling
- **Prettier** - Code formatting with import sorting

## 🎨 Design Decisions

1. **Dark Mode Default**: Optimized for extended use with eye-friendly colors
2. **Distinctive Node Colors**: Each node type has a unique color scheme for quick identification
3. **Gradient Backgrounds**: Modern aesthetic with subtle gradients
4. **JetBrains Mono Font**: Monospace font for code/data display
5. **Outfit Font**: Clean, modern sans-serif for UI elements
6. **Toast Notifications**: Non-intrusive feedback for user actions with validation errors/warnings
7. **Composable Architecture**: Reusable logic separated into composables for maintainability
   - `useWorkflowHistory` - Undo/redo functionality
   - `useWorkflowPersistence` - LocalStorage auto-save
   - `useWorkflowExecution` - Workflow execution engine
   - `useTheme` - Dark/light mode management
   - `useToast` - Toast notification system
8. **Lazy-loaded Modals**: Confirmation and help modals loaded on demand for performance
9. **Global CSS Variables**: Centralized color scheme for consistent theming
10. **Collapsible Panels**: Maximize workspace by hiding the node palette when needed
