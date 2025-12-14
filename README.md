# n8n Clone - Workflow Builder

A web-based clone of n8n with draggable nodes and connections, built with vanilla HTML, CSS, and JavaScript.

## Features

### 🎨 Visual Workflow Builder
- **Drag & Drop Interface**: Intuitive node placement from the sidebar palette
- **Smooth Node Movement**: Drag nodes around the canvas with precision
- **Grid Background**: Clean grid system for better node alignment

### 🔌 Node System
- **7 Node Types**: Webhook, HTTP Request, Code, Function, Set, SplitInBatches, and IF nodes
- **Node Actions**: Edit, delete, and duplicate nodes
- **Node Info**: Each node shows its type, description, and status indicator
- **Context Menu**: Right-click functionality for quick actions

### 🔗 Connection System
- **Visual Connections**: Animated connection lines between nodes
- **Drag-to-Connect**: Click output handles and connect to input handles
- **Connection Management**: Delete connections with Delete key or context menu

### 🎛️ Canvas Controls
- **Zoom In/Out**: Keyboard shortcuts and toolbar buttons (Ctrl/Cmd + +/-)
- **Pan Support**: Scroll the canvas to navigate large workflows
- **Node Count**: Real-time display of active nodes

### 💾 Workflow Management
- **Save/Load**: Store workflows in browser localStorage
- **Clear Canvas**: Remove all nodes and connections
- **Sample Workflow**: Pre-built example to get you started

### ⌨️ Keyboard Shortcuts
- **Delete/Backspace**: Remove selected nodes or connections
- **Ctrl/Cmd + S**: Save current workflow
- **Ctrl/Cmd + Z**: Undo (basic implementation)
- **Double-click**: Edit node properties

## Quick Start

1. **Open the Application**
   - Simply open `index.html` in your web browser
   - No installation or server required!

2. **Build Your First Workflow**
   - Drag a **Webhook** node from the sidebar onto the canvas
   - Add an **HTTP Request** node
   - Connect them by clicking the output handle (green) and then the input handle (blue)
   - Add more nodes and connections as needed

3. **Save Your Workflow**
   - Click the **Save Workflow** button or press Ctrl/Cmd + S
   - Your workflow will be stored in your browser

## Node Types

### Core Nodes
- **Webhook**: Trigger workflows with HTTP requests
- **HTTP Request**: Make API calls to external services
- **Code**: Execute custom JavaScript code
- **Function**: Transform data with JavaScript

### Data Nodes
- **Set**: Set or update data values
- **SplitInBatches**: Split data into batches for processing
- **IF**: Add conditional logic to your workflows

## How to Use

### Adding Nodes
1. Click and drag any node from the sidebar palette
2. Drop it anywhere on the canvas
3. Nodes will automatically position and render

### Connecting Nodes
1. Click the **green output handle** on the right side of a node
2. Move your cursor to the **blue input handle** on another node
3. Click to create a connection
4. Connections are automatically drawn between nodes

### Editing Nodes
- **Double-click** any node to rename it
- **Right-click** for context menu options
- Use the **Edit button** in the node header

### Managing the Canvas
- **Scroll** to zoom in and out
- **Click empty space** to deselect everything
- Use toolbar buttons for zoom controls
- Press **Delete** to remove selected items

## Browser Support

- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**

## Technical Details

### Architecture
- **Vanilla JavaScript**: No frameworks required
- **CSS Grid & Flexbox**: Modern layout techniques
- **localStorage**: Browser-based data persistence
- **DOM Manipulation**: Direct element handling for performance

### File Structure
```
n8n-clone/
├── index.html      # Main application file
├── styles.css      # Styling and layout
├── script.js       # Core functionality
└── README.md       # This documentation
```

## Customization

### Adding New Node Types
1. Add new node type to `getNodeIcon()` and `getNodeDescription()` functions
2. Create CSS styles for the new node type
3. Update the sidebar palette in `index.html`

### Styling Changes
- Modify colors in the CSS `:root` variables
- Update node dimensions and spacing
- Customize connection line styles

### Adding Features
- Extend the `WorkflowBuilder` class in `script.js`
- Add new methods for additional functionality
- Update the UI elements as needed

## Demo

The application includes a sample workflow with:
- Webhook Trigger → HTTP Request → Function Node

This demonstrates the basic flow of data through connected nodes.

## Contributing

Feel free to fork this repository and submit pull requests! Suggestions for improvements are always welcome.

## License

This project is open source and available under the MIT License.

---

**Note**: This is a simplified clone of n8n for educational and demonstration purposes. It does not execute actual workflows but provides a visual interface for designing them.