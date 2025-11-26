import React, { useRef, useEffect, useState } from 'react';

const CanvasView = ({ engine, config }) => {
    const canvasRef = useRef(null);
    const [hoveredStudent, setHoveredStudent] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (engine && engine.students) {
                const hovered = engine.students.find(s => {
                    const dx = s.x - x;
                    const dy = s.y - y;
                    return Math.sqrt(dx * dx + dy * dy) < 10;
                });
                setHoveredStudent(hovered || null);
            }

            // Check node hover
            const layout = getLayout(canvas.width, canvas.height, config);
            const nodes = [
                { name: 'Source', ...layout.source },
                { name: 'Exec Queue', ...layout.execQueue },
                { name: 'Result Queue', ...layout.resultQueue }
            ];

            // Add server nodes
            layout.execServers.forEach((pos, i) => {
                nodes.push({ name: `Exec ${i + 1}`, ...pos, radius: 30 });
            });
            layout.resultServers.forEach((pos, i) => {
                nodes.push({ name: `Result ${i + 1}`, ...pos, radius: 30 });
            });

            const hoveredN = nodes.find(n => {
                const dx = n.x - x;
                const dy = n.y - y;
                return Math.sqrt(dx * dx + dy * dy) < (n.radius || 40);
            });
            setHoveredNode(hoveredN || null);
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }, [engine, config]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const render = () => {
            if (!engine) return;

            const W = canvas.width;
            const H = canvas.height;

            // Clear with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            const layout = getLayout(W, H, config);

            // Draw connections
            drawConnections(ctx, layout);

            // Draw nodes
            drawNode(ctx, layout.source, 'Source', '#6366f1', hoveredNode?.name === 'Source');

            // Exec Queue
            const execQueueFill = config.execQueueCap === Infinity
                ? Math.min(engine.execQueue.length / 20, 1)
                : engine.execQueue.length / config.execQueueCap;
            drawQueueNode(ctx, layout.execQueue, 'Exec Queue', engine.execQueue.length, config.execQueueCap, execQueueFill, hoveredNode?.name === 'Exec Queue');

            // Exec Servers
            layout.execServers.forEach((pos, i) => {
                const server = engine.execServers[i];
                const isBusy = server?.status === 'busy';
                drawServerNode(ctx, pos, `E${i + 1}`, isBusy, hoveredNode?.name === `Exec ${i + 1}`);
            });

            // Result Queue
            const resultQueueFill = config.resultQueueCap === Infinity
                ? Math.min(engine.resultQueue.length / 20, 1)
                : engine.resultQueue.length / config.resultQueueCap;
            drawQueueNode(ctx, layout.resultQueue, 'Result Queue', engine.resultQueue.length, config.resultQueueCap, resultQueueFill, hoveredNode?.name === 'Result Queue');

            // Result Servers
            layout.resultServers.forEach((pos, i) => {
                const server = engine.resultServers[i];
                const isBusy = server?.status === 'busy';
                drawServerNode(ctx, pos, `R${i + 1}`, isBusy, hoveredNode?.name === `Result ${i + 1}`);
            });

            // Draw students
            engine.students.forEach(s => {
                drawStudent(ctx, s, s === hoveredStudent);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [engine, hoveredStudent, hoveredNode, config]);

    return (
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <canvas
                ref={canvasRef}
                width={1200}
                height={675}
                className="w-full h-full"
            />

            {hoveredStudent && (
                <div
                    className="absolute bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl pointer-events-none z-50"
                    style={{
                        left: `${(hoveredStudent.x / 1200) * 100}%`,
                        top: `${(hoveredStudent.y / 675) * 100}%`,
                        transform: 'translate(-50%, calc(-100% - 12px))'
                    }}
                >
                    <div className="font-semibold mb-1">Student #{hoveredStudent.id}</div>
                    <div className="text-slate-300">Type: {hoveredStudent.type}</div>
                    <div className="text-slate-300">Status: {hoveredStudent.status}</div>
                    <div className="text-slate-300">Age: {((engine.time - hoveredStudent.arrivalTime) / 1000).toFixed(1)}s</div>
                </div>
            )}
        </div>
    );
};

function getLayout(W, H, config) {
    const margin = 100;
    const centerY = H / 2;

    // Source on left
    const sourceX = margin;

    // Exec queue
    const execQueueX = margin + 180;

    // Exec servers in the middle (arranged in a circle/column)
    const execServerX = W / 2 - 100;
    const numExecServers = config.numExecServers;
    const execServers = [];
    const execSpacing = Math.min(80, 300 / numExecServers);
    for (let i = 0; i < numExecServers; i++) {
        execServers.push({
            x: execServerX,
            y: centerY - ((numExecServers - 1) * execSpacing) / 2 + i * execSpacing
        });
    }

    // Result queue
    const resultQueueX = W / 2 + 100;

    // Result servers
    const resultServerX = W - margin - 180;
    const numResultServers = config.numResultServers;
    const resultServers = [];
    const resultSpacing = Math.min(80, 300 / numResultServers);
    for (let i = 0; i < numResultServers; i++) {
        resultServers.push({
            x: resultServerX,
            y: centerY - ((numResultServers - 1) * resultSpacing) / 2 + i * resultSpacing
        });
    }

    return {
        source: { x: sourceX, y: centerY },
        execQueue: { x: execQueueX, y: centerY },
        execServers,
        resultQueue: { x: resultQueueX, y: centerY },
        resultServers
    };
}

function drawConnections(ctx, layout) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;

    // Source to Exec Queue
    drawArrow(ctx, layout.source.x + 40, layout.source.y, layout.execQueue.x - 45, layout.execQueue.y);

    // Exec Queue to all Exec Servers
    layout.execServers.forEach(server => {
        drawArrow(ctx, layout.execQueue.x + 45, layout.execQueue.y, server.x - 35, server.y);
    });

    // All Exec Servers to Result Queue
    layout.execServers.forEach(server => {
        drawArrow(ctx, server.x + 35, server.y, layout.resultQueue.x - 45, layout.resultQueue.y);
    });

    // Result Queue to all Result Servers
    layout.resultServers.forEach(server => {
        drawArrow(ctx, layout.resultQueue.x + 45, layout.resultQueue.y, server.x - 35, server.y);
    });
}

function drawArrow(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

function drawNode(ctx, pos, label, color, isHovered) {
    const radius = isHovered ? 45 : 40;

    // Outer glow for hover
    if (isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y + 4);
}

function drawQueueNode(ctx, pos, label, count, capacity, fillRatio, isHovered) {
    const radius = isHovered ? 45 : 40;

    // Determine color based on fill ratio
    const color = fillRatio > 0.8 ? '#ef4444' : fillRatio > 0.5 ? '#f59e0b' : '#10b981';

    if (isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
    }

    // Background circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();

    // Fill arc
    if (fillRatio > 0) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, -Math.PI / 2, -Math.PI / 2 + fillRatio * Math.PI * 2);
        ctx.lineTo(pos.x, pos.y);
        ctx.closePath();
        ctx.fillStyle = color + '60';
        ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(count.toString(), pos.x, pos.y + 5);

    // Capacity label
    if (capacity !== Infinity) {
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`/ ${capacity}`, pos.x, pos.y + 20);
    }

    // Name label below
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(label, pos.x, pos.y + radius + 18);
}

function drawServerNode(ctx, pos, label, isBusy, isHovered) {
    const radius = isHovered ? 32 : 30;
    const color = isBusy ? '#3b82f6' : '#10b981';

    if (isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y + 4);
}

function drawStudent(ctx, student, isHovered) {
    const radius = isHovered ? 10 : 7;
    const colorMap = {
        "ING": '#3b82f6',
        "PREPA": '#ef4444',
        "Standard": '#8b5cf6'
    };

    const isRejected = student.status.includes("Rejected");
    const color = isRejected ? '#94a3b8' : colorMap[student.type];

    // Student circle
    ctx.beginPath();
    ctx.arc(student.x, student.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered ? '#0f172a' : '#ffffff';
    ctx.lineWidth = isHovered ? 2.5 : 2;
    ctx.stroke();

    // Rejection marker
    if (isRejected) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(student.x - 4, student.y - 4);
        ctx.lineTo(student.x + 4, student.y + 4);
        ctx.moveTo(student.x + 4, student.y - 4);
        ctx.lineTo(student.x - 4, student.y + 4);
        ctx.stroke();
    }
}

export default CanvasView;
