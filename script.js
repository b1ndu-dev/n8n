class WorkflowBuilder {
    constructor() {
        this.nodes = new Map();
        this.connections = [];
        this.selectedNode = null;
        this.selectedConnection = null;
        this.nodeCounter = 1;
        this.zoomLevel = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.loadInitialNodes();
    }

    setupEventListeners() {
        // Drag and drop from sidebar
        document.querySelectorAll('.node-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.type);
            });
        });

        const canvas = document.getElementById('canvas');
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('text/plain');
            if (nodeType) {
                this.addNode(nodeType, e.clientX, e.clientY);
            }
        });

        // Canvas click to deselect
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.id === 'connections') {
                this.deselectAll();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedNode) {
                    this.deleteNode(this.selectedNode);
                } else if (this.selectedConnection) {
                    this.deleteConnection(this.selectedConnection);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveWorkflow();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                // Simple undo - would need more implementation
            }
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoomIn();
        });
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoomOut();
        });
        document.getElementById('zoomReset').addEventListener('click', () => {
            this.resetZoom();
        });

        // Save/Load/Clear
        document.getElementById('saveWorkflow').addEventListener('click', () => {
            this.saveWorkflow();
        });
        document.getElementById('loadWorkflow').addEventListener('click', () => {
            this.loadWorkflow();
        });
        document.getElementById('clearCanvas').addEventListener('click', () => {
            this.clearCanvas();
        });
    }

    setupCanvas() {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        
        // Initialize with a sample workflow
        this.createSampleWorkflow();
    }

    createSampleWorkflow() {
        // Create a simple Webhook -> HTTP Request -> Function workflow
        const webhookNode = this.createNode('webhook', 100, 100, 'Webhook Trigger');
        const httpRequestNode = this.createNode('httpRequest', 400, 100, 'Fetch Data');
        const functionNode = this.createNode('function', 700, 100, 'Process Data');

        // Connect them
        this.connectNodes(webhookNode.id, httpRequestNode.id);
        this.connectNodes(httpRequestNode.id, functionNode.id);
    }

    getNodeIcon(type) {
        const icons = {
            webhook: 'fa-plug',
            httpRequest: 'fa-globe',
            code: 'fa-code',
            function: 'fa-calculator',
            set: 'fa-sliders-h',
            splitInBatches: 'fa-layer-group',
            if: 'fa-question'
        };
        return icons[type] || 'fa-cog';
    }

    getNodeDescription(type) {
        const descriptions = {
            webhook: 'Trigger workflow with HTTP requests',
            httpRequest: 'Make HTTP requests to external APIs',
            code: 'Execute custom JavaScript code',
            function: 'Transform data with JavaScript',
            set: 'Set or update data values',
            splitInBatches: 'Split data into batches for processing',
            if: 'Conditional logic based on data'
        };
        return descriptions[type] || 'Node description';
    }

    addNode(type, clientX, clientY) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        
        const x = clientX - rect.left - 110; // Center the node
        const y = clientY - rect.top - 60;   // Center the node
        
        const name = `${type.charAt(0).toUpperCase() + type.slice(1)} Node ${this.nodeCounter++}`;
        this.createNode(type, x, y, name);
    }

    createNode(type, x, y, name = '') {
        const node = document.createElement('div');
        node.className = `node ${type}`;
        node.dataset.id = `node-${Date.now()}`;
        node.dataset.type = type;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;

        const title = document.createElement('div');
        title.className = 'node-header';
        title.innerHTML = `
            <div class="node-title">
                <i class="fas ${this.getNodeIcon(type)}"></i>
                <span>${name || type}</span>
            </div>
            <div class="node-actions">
                <button class="edit-node" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-node" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        const body = document.createElement('div');
        body.className = 'node-body';
        body.textContent = this.getNodeDescription(type);

        const footer = document.createElement('div');
        footer.className = 'node-footer';
        footer.innerHTML = `
            <div class="status-indicator"></div>
            <div class="output-handle" title="Connect"></div>
        `;

        node.appendChild(title);
        node.appendChild(body);
        node.appendChild(footer);

        // Add input handle if not the first node
        if (this.nodes.size > 0) {
            const inputHandle = document.createElement('div');
            inputHandle.className = 'input-handle';
            node.appendChild(inputHandle);
        }

        document.getElementById('nodes').appendChild(node);
        this.nodes.set(node.dataset.id, {
            element: node,
            type: type,
            x: x,
            y: y,
            name: name || type,
            connections: []
        });

        this.makeNodeDraggable(node);
        this.addEventListeners(node);
        this.updateNodeCount();
        
        return {
            id: node.dataset.id,
            element: node,
            type: type,
            x: x,
            y: y
        };
    }

    makeNodeDraggable(node) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;

        node.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('output-handle') || 
                e.target.closest('.node-actions')) {
                return;
            }
            
            isDragging = true;
            this.selectNode(node);
            
            const rect = node.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            startX = node.offsetLeft;
            startY = node.offsetTop;
            
            node.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const canvas = document.getElementById('canvas');
            const canvasRect = canvas.getBoundingClientRect();
            
            let newX = e.clientX - canvasRect.left - offsetX;
            let newY = e.clientY - canvasRect.top - offsetY;
            
            // Keep node within canvas bounds
            newX = Math.max(0, Math.min(newX, canvas.scrollWidth - node.offsetWidth));
            newY = Math.max(0, Math.min(newY, canvas.scrollHeight - node.offsetHeight));
            
            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;
            
            // Update node data
            const nodeId = node.dataset.id;
            const nodeData = this.nodes.get(nodeId);
            if (nodeData) {
                nodeData.x = newX;
                nodeData.y = newY;
            }
            
            // Update connections
            this.updateConnections();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                node.style.cursor = 'move';
            }
        });
    }

    addEventListeners(node) {
        // Edit node
        node.querySelector('.edit-node').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editNode(node);
        });

        // Delete node
        node.querySelector('.delete-node').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNode(node);
        });

        // Connect nodes
        node.querySelector('.output-handle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleConnectionStart(node);
        });

        // Select node
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node);
        });

        // Double click to edit
        node.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editNode(node);
        });
    }

    handleConnectionStart(sourceNode) {
        const canvas = document.getElementById('canvas');
        const sourceId = sourceNode.dataset.id;
        
        // Check if already connecting
        if (this.connectingSource) {
            this.connectingSource = null;
            canvas.style.cursor = 'default';
            return;
        }

        this.connectingSource = sourceId;
        canvas.style.cursor = 'crosshair';
        
        const tempLine = document.createElement('div');
        tempLine.className = 'connection-line temp-line';
        document.getElementById('connections').appendChild(tempLine);
        this.tempConnection = tempLine;
        
        // Position temp line from source output
        const sourceRect = sourceNode.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const startX = sourceRect.right - canvasRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
        
        this.updateTempConnection(startX, startY, startX, startY);

        canvas.addEventListener('mousemove', this.tempConnectionMouseMove = (e) => {
            this.updateTempConnection(startX, startY, e.clientX - canvasRect.left, e.clientY - canvasRect.top);
        });

        canvas.addEventListener('click', this.tempConnectionClick = (e) => {
            if (e.target.classList.contains('input-handle') || 
                e.target.closest('.input-handle')) {
                const targetNode = e.target.closest('.node');
                if (targetNode && targetNode.dataset.id !== sourceId) {
                    this.connectNodes(sourceId, targetNode.dataset.id);
                    this.endConnection();
                }
            } else {
                this.endConnection();
            }
        });
    }

    updateTempConnection(x1, y1, x2, y2) {
        if (!this.tempConnection) return;
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        this.tempConnection.style.width = `${length}px`;
        this.tempConnection.style.left = `${x1}px`;
        this.tempConnection.style.top = `${y1}px`;
        this.tempConnection.style.transform = `rotate(${angle}deg)`;
    }

    endConnection() {
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
        
        const canvas = document.getElementById('canvas');
        canvas.style.cursor = 'default';
        this.connectingSource = null;
        
        canvas.removeEventListener('mousemove', this.tempConnectionMouseMove);
        canvas.removeEventListener('click', this.tempConnectionClick);
    }

    connectNodes(sourceId, targetId) {
        // Check if already connected
        const existing = this.connections.find(c => c.source === sourceId && c.target === targetId);
        if (existing) return;

        const connection = {
            id: `conn-${Date.now()}`,
            source: sourceId,
            target: targetId
        };

        this.connections.push(connection);
        
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);
        
        if (sourceNode) {
            sourceNode.connections.push(targetId);
        }
        if (targetNode) {
            targetNode.connections.push(sourceId);
        }

        this.createConnectionLine(connection);
        this.updateNodeInputHandle(targetNode.element);
    }

    createConnectionLine(connection) {
        const line = document.createElement('div');
        line.className = 'connection-line';
        line.dataset.id = connection.id;
        line.dataset.source = connection.source;
        line.dataset.target = connection.target;
        
        document.getElementById('connections').appendChild(line);
        this.updateConnectionLine(connection.id);
        
        // Click to select connection
        line.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(line);
        });
    }

    updateConnectionLine(connectionId) {
        const connection = this.connections.find(c => c.id === connectionId);
        if (!connection) return;
        
        const line = document.querySelector(`.connection-line[data-id="${connectionId}"]`);
        if (!line) return;
        
        const sourceNode = this.nodes.get(connection.source);
        const targetNode = this.nodes.get(connection.target);
        
        if (!sourceNode || !targetNode) return;
        
        const sourceRect = sourceNode.element.getBoundingClientRect();
        const targetRect = targetNode.element.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        const x1 = sourceRect.right - canvasRect.left;
        const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
        const x2 = targetRect.left - canvasRect.left;
        const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
    }

    updateConnections() {
        this.connections.forEach(conn => this.updateConnectionLine(conn.id));
    }

    updateNodeInputHandle(nodeElement) {
        if (!nodeElement.querySelector('.input-handle')) {
            const inputHandle = document.createElement('div');
            inputHandle.className = 'input-handle';
            nodeElement.appendChild(inputHandle);
        }
    }

    selectNode(node) {
        this.deselectAll();
        node.classList.add('selected');
        this.selectedNode = node;
        
        // Show context menu
        this.showContextMenu(node);
    }

    selectConnection(line) {
        this.deselectAll();
        line.classList.add('selected');
        this.selectedConnection = line;
    }

    deselectAll() {
        document.querySelectorAll('.node.selected').forEach(n => n.classList.remove('selected'));
        document.querySelectorAll('.connection-line.selected').forEach(l => l.classList.remove('selected'));
        this.selectedNode = null;
        this.selectedConnection = null;
        this.hideContextMenu();
    }

    showContextMenu(node) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="edit">
                <i class="fas fa-edit"></i> Edit Node
            </div>
            <div class="context-menu-item" data-action="delete">
                <i class="fas fa-trash"></i> Delete Node
            </div>
            <div class="context-menu-item" data-action="duplicate">
                <i class="fas fa-copy"></i> Duplicate Node
            </div>
        `;
        
        const rect = node.getBoundingClientRect();
        menu.style.left = `${rect.right + 10}px`;
        menu.style.top = `${rect.top}px`;
        
        document.body.appendChild(menu);
        
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.handleContextMenuAction(item.dataset.action, node);
                menu.remove();
            });
        });
        
        // Click outside to close
        document.addEventListener('click', this.contextMenuClick = () => {
            menu.remove();
            document.removeEventListener('click', this.contextMenuClick);
        });
    }

    hideContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    handleContextMenuAction(action, node) {
        switch(action) {
            case 'edit':
                this.editNode(node);
                break;
            case 'delete':
                this.deleteNode(node);
                break;
            case 'duplicate':
                this.duplicateNode(node);
                break;
        }
    }

    editNode(node) {
        const nodeData = this.nodes.get(node.dataset.id);
        const newName = prompt('Enter node name:', nodeData.name);
        if (newName) {
            nodeData.name = newName;
            node.querySelector('.node-title span').textContent = newName;
        }
    }

    deleteNode(node) {
        const nodeId = node.dataset.id;
        
        // Remove connections
        this.connections = this.connections.filter(conn => {
            if (conn.source === nodeId || conn.target === nodeId) {
                const line = document.querySelector(`.connection-line[data-id="${conn.id}"]`);
                if (line) line.remove();
                return false;
            }
            return true;
        });
        
        // Remove node
        node.remove();
        this.nodes.delete(nodeId);
        this.deselectAll();
        this.updateNodeCount();
    }

    duplicateNode(node) {
        const nodeData = this.nodes.get(node.dataset.id);
        const newNode = this.createNode(nodeData.type, nodeData.x + 50, nodeData.y + 50, nodeData.name + ' (Copy)');
        
        // Copy connections
        const newId = newNode.id;
        this.connections.forEach(conn => {
            if (conn.source === nodeData.id) {
                this.connectNodes(newId, conn.target);
            } else if (conn.target === nodeData.id) {
                this.connectNodes(conn.source, newId);
            }
        });
    }

    zoomIn() {
        this.zoomLevel += 0.1;
        this.applyZoom();
    }

    zoomOut() {
        if (this.zoomLevel > 0.3) {
            this.zoomLevel -= 0.1;
            this.applyZoom();
        }
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
    }

    applyZoom() {
        const canvas = document.getElementById('canvas');
        canvas.style.transform = `scale(${this.zoomLevel})`;
        canvas.style.transformOrigin = '0 0';
    }

    updateNodeCount() {
        document.getElementById('nodeCount').textContent = `Nodes: ${this.nodes.size}`;
    }

    saveWorkflow() {
        const workflow = {
            nodes: Array.from(this.nodes.values()).map(node => ({
                id: node.id,
                type: node.type,
                x: node.x,
                y: node.y,
                name: node.name
            })),
            connections: this.connections
        };
        
        localStorage.setItem('n8n-workflow', JSON.stringify(workflow));
        
        // Show save confirmation
        const notification = document.createElement('div');
        notification.textContent = 'Workflow saved!';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.background = '#22c55e';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '8px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    loadWorkflow() {
        const saved = localStorage.getItem('n8n-workflow');
        if (saved) {
            this.clearCanvas();
            const workflow = JSON.parse(saved);
            
            workflow.nodes.forEach(node => {
                this.createNode(node.type, node.x, node.y, node.name);
            });
            
            workflow.connections.forEach(conn => {
                this.connectNodes(conn.source, conn.target);
            });
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            document.getElementById('nodes').innerHTML = '';
            document.getElementById('connections').innerHTML = '';
            this.nodes.clear();
            this.connections = [];
            this.nodeCounter = 1;
            this.updateNodeCount();
        }
    }
}

// Initialize the workflow builder when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WorkflowBuilder();
});