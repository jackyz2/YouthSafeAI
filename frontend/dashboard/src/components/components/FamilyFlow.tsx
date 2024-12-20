import { ReactFlow, Controls, Background, Node, Edge, Position, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect } from 'react';

interface Child {
  id: string;
  name: string;
}

interface FamilyFlowProps {
  parent_name: string;
  children: Child[];
}

export default function FamilyFlow({ parent_name, children }: FamilyFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // const onConnect = useCallback(
  //   (params: any) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges],
  // );

  useEffect(() => {
    const updatedNodes: Node[] = [
      {
        id: '0',
        type: 'input',
        data: { label: parent_name },
        position: { x: 100, y: 25 },
      },
      ...children.map((child, index) => ({
        id: child.id.toString(),
        data: { label: child.name },
        position: { x: index * 200, y: 100 },
      })),
    ];

    const updatedEdges: Edge[] = children.map((child, index) => ({
      id: `edge-${index}`,
      source: '0',
      target: child.id.toString(),
      type: 'bezier',
      // label: `Edge to ${child.name}`,
    }));


    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [parent_name, children, setNodes, setEdges]);

  const disabled = true;

  return (
    <div className="w-full h-64 mt-4 border-2 border-gray-300 rounded-md">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        // fitView
        minZoom={0.2}
        style={{ backgroundColor: "#F7F9FB" }}

        edgesFocusable={!disabled}
        nodesDraggable={!disabled}
        nodesConnectable={!disabled}
        nodesFocusable={!disabled}
        draggable={!disabled}
        // panOnDrag={!disabled}
        elementsSelectable={!disabled}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}